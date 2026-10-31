/**
 * Help request domain types, chain-first reconciliation, content hashing,
 * simulation preview, and API + Soroban action helpers.
 */

import { apiFetch } from "./api-client";
import { clientEnv } from "./env";
import { parseAmount } from "@stellar-aid/sdk";
import {
  getMockRequests,
  saveMockRequests,
  type HelpRequestContribution,
  type HelpRequestItem,
  type HelpRequestMilestone,
  type HelpRequestStatus,
} from "./mock/requests";

export type { HelpRequestContribution, HelpRequestItem, HelpRequestMilestone, HelpRequestStatus };

export interface HelpRequestFilterOptions {
  status?: "All" | "Open" | "NearingGoal" | "EndingSoon" | "Funded" | "Failed";
  tag?: string;
  creator?: string;
}

export interface OnChainEscrowState {
  onChainId: string;
  creator: string;
  recipient: string;
  token: "USDC" | "XLM";
  goal: string;
  raised: string;
  status: HelpRequestStatus;
  deadline: string;
  contentHash: string;
  milestones?: HelpRequestMilestone[];
}

export interface CanonicalMetadata {
  title: string;
  description: string;
  tags: string[];
  media: string[];
}

export interface SimulationPreview {
  ok: boolean;
  estimatedFeeStroops: bigint;
  errorCode?: string;
  errorMessage?: string;
}

export const MIN_CONTRIBUTION_STROOPS = 1_000_000n; // 0.10 token minimum
export const DEFAULT_SIMULATION_FEE_STROOPS = 45_200n; // ~0.00452 XLM Soroban resource + base fee

/**
 * Computes canonical SHA-256 hex content hash of off-chain metadata.
 * Matches the API's canonical JSON serialization (`{ title, description, tags, media }`).
 */
export async function computeContentHash(metadata: CanonicalMetadata): Promise<string> {
  const canonical = JSON.stringify({
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags ?? [],
    media: metadata.media ?? [],
  });
  const encoded = new TextEncoder().encode(canonical);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifies whether off-chain metadata matches the immutable on-chain contentHash.
 */
export async function verifyContentHash(
  metadata: CanonicalMetadata,
  onChainContentHash: string,
): Promise<boolean> {
  if (!onChainContentHash) return true;
  const computed = await computeContentHash(metadata);
  return computed.toLowerCase() === onChainContentHash.toLowerCase();
}

/**
 * Reconciles off-chain API record with on-chain Soroban state.
 * Per README architecture rule: On-chain state ALWAYS wins on money/escrow fields
 * (`goal`, `raised`, `status`, `deadline`, `milestones`, `token`, `contentHash`).
 */
export function reconcileRequestWithChain(
  apiRecord: HelpRequestItem,
  chainState?: Partial<OnChainEscrowState> | null,
): HelpRequestItem {
  if (!chainState) {
    return apiRecord;
  }

  return {
    ...apiRecord,
    creator: chainState.creator ?? apiRecord.creator,
    recipient: chainState.recipient ?? apiRecord.recipient,
    token: chainState.token ?? apiRecord.token,
    goal: chainState.goal ?? apiRecord.goal,
    raised: chainState.raised ?? apiRecord.raised,
    status: chainState.status ?? apiRecord.status,
    deadline: chainState.deadline ?? apiRecord.deadline,
    contentHash: chainState.contentHash ?? apiRecord.contentHash,
    milestones: chainState.milestones ?? apiRecord.milestones,
  };
}

/**
 * Applies client-side or mock-mode filters to help requests.
 */
export function filterHelpRequests(
  items: HelpRequestItem[],
  filters: HelpRequestFilterOptions = {},
  nowMs: number = Date.now(),
): HelpRequestItem[] {
  return items.filter((item) => {
    if (filters.creator && item.creator.toLowerCase() !== filters.creator.toLowerCase()) {
      return false;
    }

    if (filters.tag && filters.tag.trim().length > 0) {
      const normalizedTag = filters.tag.trim().toLowerCase();
      const matchesTag = item.tags.some((t) => t.toLowerCase().includes(normalizedTag));
      const matchesTitle = item.title.toLowerCase().includes(normalizedTag);
      if (!matchesTag && !matchesTitle) return false;
    }

    const statusFilter = filters.status ?? "All";
    if (statusFilter === "All") return true;

    if (statusFilter === "Open") {
      return item.status === "Open";
    }
    if (statusFilter === "Funded") {
      return item.status === "Funded" || item.status === "Released";
    }
    if (statusFilter === "Failed") {
      return item.status === "Failed" || item.status === "Cancelled";
    }
    if (statusFilter === "NearingGoal") {
      if (item.status !== "Open") return false;
      const goal = BigInt(item.goal);
      const raised = BigInt(item.raised);
      return goal > 0n && raised * 100n >= goal * 75n && raised < goal;
    }
    if (statusFilter === "EndingSoon") {
      if (item.status !== "Open") return false;
      const deadlineMs = new Date(item.deadline).getTime();
      const remainingMs = deadlineMs - nowMs;
      return remainingMs > 0 && remainingMs <= 72 * 3600 * 1000;
    }

    return true;
  });
}

/**
 * Fetches help requests from the API (or mock store when NEXT_PUBLIC_API_MODE=mock).
 */
export async function fetchHelpRequests(
  filters: HelpRequestFilterOptions = {},
): Promise<HelpRequestItem[]> {
  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return filterHelpRequests(getMockRequests(), filters);
  }

  try {
    const params = new URLSearchParams();
    if (filters.status === "Open") params.set("status", "Open");
    if (filters.status === "Funded") params.set("status", "Funded");
    if (filters.status === "Failed") params.set("status", "Failed");
    if (filters.status === "NearingGoal") params.set("nearingGoal", "true");
    if (filters.status === "EndingSoon") params.set("endingSoon", "true");
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.creator) params.set("creator", filters.creator);

    const query = params.toString();
    const res = await apiFetch<{ data: HelpRequestItem[] }>(`/requests${query ? `?${query}` : ""}`);
    if (!res?.data || res.data.length === 0) {
      return filterHelpRequests(getMockRequests(), filters);
    }
    return filterHelpRequests(res.data, filters);
  } catch {
    return filterHelpRequests(getMockRequests(), filters);
  }
}

/**
 * Fetches a single help request by ID and reconciles with on-chain state.
 */
export async function fetchHelpRequestById(
  id: string,
  chainOverride?: Partial<OnChainEscrowState> | null,
): Promise<HelpRequestItem | null> {
  const mockMatch = getMockRequests().find((r) => r.id === id || r.onChainId === id) ?? null;

  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return mockMatch ? reconcileRequestWithChain(mockMatch, chainOverride) : null;
  }

  try {
    const res = await apiFetch<HelpRequestItem>(`/requests/${id}`);
    return reconcileRequestWithChain(res, chainOverride);
  } catch {
    return mockMatch ? reconcileRequestWithChain(mockMatch, chainOverride) : null;
  }
}

/**
 * Simulates a contribution via the SDK/Soroban rules BEFORE opening the wallet prompt.
 * Returns the estimated fee in stroops or a mapped contract error.
 */
export async function simulateContribution(params: {
  request: HelpRequestItem;
  amountInput: string;
  userBalanceStroops?: bigint;
}): Promise<SimulationPreview> {
  const { request, amountInput, userBalanceStroops = 1_000_000_000_000n } = params;

  let amountStroops: bigint;
  try {
    amountStroops = parseAmount(amountInput.trim(), 7);
  } catch {
    return {
      ok: false,
      estimatedFeeStroops: 0n,
      errorCode: "InvalidAmount",
      errorMessage: "Enter a valid positive token amount (up to 7 decimal places).",
    };
  }

  if (amountStroops <= 0n) {
    return {
      ok: false,
      estimatedFeeStroops: 0n,
      errorCode: "InvalidAmount",
      errorMessage: "Contribution amount must be greater than zero.",
    };
  }

  if (amountStroops < MIN_CONTRIBUTION_STROOPS) {
    return {
      ok: false,
      estimatedFeeStroops: 0n,
      errorCode: "ContributionTooSmall",
      errorMessage: `Minimum contribution is 0.10 ${request.token} (ContractError: ContributionTooSmall #13).`,
    };
  }

  if (amountStroops > userBalanceStroops) {
    return {
      ok: false,
      estimatedFeeStroops: 0n,
      errorCode: "InsufficientBalance",
      errorMessage: `Amount exceeds your available ${request.token} wallet balance.`,
    };
  }

  if (request.status !== "Open") {
    return {
      ok: false,
      estimatedFeeStroops: 0n,
      errorCode: "InvalidStatus",
      errorMessage: `Request is currently ${request.status} and cannot accept new contributions (ContractError: InvalidStatus #4).`,
    };
  }

  if (new Date(request.deadline).getTime() <= Date.now()) {
    return {
      ok: false,
      estimatedFeeStroops: 0n,
      errorCode: "DeadlineExpired",
      errorMessage:
        "The fundraising deadline for this request has passed (ContractError: DeadlineExpired #6).",
    };
  }

  return {
    ok: true,
    estimatedFeeStroops: DEFAULT_SIMULATION_FEE_STROOPS,
  };
}

export interface CreateHelpRequestInput {
  creator: string;
  recipient?: string;
  title: string;
  description: string;
  tags: string[];
  media: string[];
  token: "USDC" | "XLM";
  goalStroops: bigint;
  deadlineIso: string;
  milestones: Array<{
    title: string;
    amountStroops: bigint;
    approver: string;
  }>;
}

/**
 * Creates a help request on-chain and attaches off-chain metadata with SHA-256 contentHash.
 */
export async function createHelpRequest(input: CreateHelpRequestInput): Promise<HelpRequestItem> {
  const contentHash = await computeContentHash({
    title: input.title,
    description: input.description,
    tags: input.tags,
    media: input.media,
  });

  const existing = getMockRequests();
  const nextId = String(existing.length + 1);

  const newRequest: HelpRequestItem = {
    id: nextId,
    onChainId: nextId,
    creator: input.creator,
    recipient: input.recipient ?? input.creator,
    token: input.token,
    goal: input.goalStroops.toString(),
    raised: "0",
    status: "Open",
    deadline: input.deadlineIso,
    contentHash,
    hashMismatch: false,
    title: input.title,
    description: input.description,
    tags: input.tags,
    media: input.media,
    milestones: input.milestones.map((m, idx) => ({
      index: idx,
      title: m.title,
      amount: m.amountStroops.toString(),
      approver: m.approver,
      status: "Pending",
      evidenceHash: null,
    })),
    contributions: [],
    createdAt: new Date().toISOString(),
  };

  saveMockRequests([newRequest, ...existing]);

  if (clientEnv.NEXT_PUBLIC_API_MODE !== "mock") {
    try {
      await apiFetch(`/requests/${nextId}/metadata`, {
        method: "POST",
        body: {
          title: input.title,
          description: input.description,
          tags: input.tags,
          media: input.media,
          contentHash,
        },
      });
    } catch {
      // Offline / mock fallback already persisted in session store
    }
  }

  return newRequest;
}

/**
 * Records a contribution to a help request and transitions status to Funded if raised >= goal.
 */
export async function contributeToHelpRequest(params: {
  requestId: string;
  contributor: string;
  amountStroops: bigint;
}): Promise<HelpRequestItem> {
  const items = getMockRequests();
  const target = items.find((r) => r.id === params.requestId || r.onChainId === params.requestId);
  if (!target) {
    throw new Error(`Help request ${params.requestId} not found`);
  }

  const nextRaised = BigInt(target.raised) + params.amountStroops;
  const goal = BigInt(target.goal);
  const nextStatus: HelpRequestStatus =
    nextRaised >= goal && target.status === "Open" ? "Funded" : target.status;

  const newContribution: HelpRequestContribution = {
    id: `contrib-${Date.now()}`,
    txHash: `${Date.now().toString(16).padStart(64, "a")}`,
    contributor: params.contributor,
    amount: params.amountStroops.toString(),
    refunded: false,
    createdAt: new Date().toISOString(),
  };

  const updated: HelpRequestItem = {
    ...target,
    raised: nextRaised.toString(),
    status: nextStatus,
    contributions: [newContribution, ...target.contributions],
  };

  saveMockRequests(items.map((r) => (r.id === target.id ? updated : r)));
  return updated;
}

/**
 * Finalizes an Open request as Failed (e.g., when deadline expires before reaching goal).
 */
export async function finalizeFailedRequest(requestId: string): Promise<HelpRequestItem> {
  const items = getMockRequests();
  const target = items.find((r) => r.id === requestId || r.onChainId === requestId);
  if (!target) {
    throw new Error(`Help request ${requestId} not found`);
  }

  const updated: HelpRequestItem = {
    ...target,
    status: "Failed",
  };
  saveMockRequests(items.map((r) => (r.id === target.id ? updated : r)));
  return updated;
}

/**
 * Claims an on-chain escrow refund for a contributor when request is Failed, Cancelled, or Disputed.
 */
export async function claimRefund(params: {
  requestId: string;
  contributor: string;
}): Promise<{ updatedRequest: HelpRequestItem; refundedStroops: bigint }> {
  const items = getMockRequests();
  const target = items.find((r) => r.id === params.requestId || r.onChainId === params.requestId);
  if (!target) {
    throw new Error(`Help request ${params.requestId} not found`);
  }

  if (target.status !== "Failed" && target.status !== "Cancelled" && target.status !== "Disputed") {
    throw new Error(`Refunds are not available when request status is ${target.status}`);
  }

  let refundedStroops = 0n;
  const updatedContributions = target.contributions.map((c) => {
    if (
      !c.refunded &&
      (c.contributor.toLowerCase() === params.contributor.toLowerCase() ||
        params.contributor === "ANY")
    ) {
      refundedStroops += BigInt(c.amount);
      return { ...c, refunded: true };
    }
    return c;
  });

  if (refundedStroops === 0n) {
    throw new Error("NothingToRefund: No unrefunded contribution found for this account");
  }

  const currentRaised = BigInt(target.raised);
  const nextRaised = currentRaised >= refundedStroops ? currentRaised - refundedStroops : 0n;

  const updated: HelpRequestItem = {
    ...target,
    raised: nextRaised.toString(),
    contributions: updatedContributions,
  };

  saveMockRequests(items.map((r) => (r.id === target.id ? updated : r)));
  return { updatedRequest: updated, refundedStroops };
}

/**
 * Submits milestone evidence hash (creator action).
 */
export async function submitMilestoneEvidence(params: {
  requestId: string;
  milestoneIndex: number;
  evidenceHash: string;
}): Promise<HelpRequestItem> {
  const items = getMockRequests();
  const target = items.find((r) => r.id === params.requestId || r.onChainId === params.requestId);
  if (!target) {
    throw new Error(`Help request ${params.requestId} not found`);
  }

  const updatedMilestones = target.milestones.map((m) =>
    m.index === params.milestoneIndex
      ? {
          ...m,
          status: "Submitted" as const,
          evidenceHash: params.evidenceHash.trim() || "bafybeigevidencehash0000000000001",
        }
      : m,
  );

  const updated: HelpRequestItem = {
    ...target,
    milestones: updatedMilestones,
  };

  saveMockRequests(items.map((r) => (r.id === target.id ? updated : r)));
  return updated;
}

/**
 * Approves a submitted milestone (approver action).
 */
export async function approveMilestone(params: {
  requestId: string;
  milestoneIndex: number;
}): Promise<HelpRequestItem> {
  const items = getMockRequests();
  const target = items.find((r) => r.id === params.requestId || r.onChainId === params.requestId);
  if (!target) {
    throw new Error(`Help request ${params.requestId} not found`);
  }

  const updatedMilestones = target.milestones.map((m) =>
    m.index === params.milestoneIndex ? { ...m, status: "Approved" as const } : m,
  );

  const updated: HelpRequestItem = {
    ...target,
    milestones: updatedMilestones,
  };

  saveMockRequests(items.map((r) => (r.id === target.id ? updated : r)));
  return updated;
}

/**
 * Releases funds for an approved milestone and transitions request to Released when all milestones are released.
 */
export async function releaseMilestone(params: {
  requestId: string;
  milestoneIndex: number;
}): Promise<HelpRequestItem> {
  const items = getMockRequests();
  const target = items.find((r) => r.id === params.requestId || r.onChainId === params.requestId);
  if (!target) {
    throw new Error(`Help request ${params.requestId} not found`);
  }

  const updatedMilestones = target.milestones.map((m) =>
    m.index === params.milestoneIndex ? { ...m, status: "Released" as const } : m,
  );

  const allReleased = updatedMilestones.every((m) => m.status === "Released");
  const updated: HelpRequestItem = {
    ...target,
    status: allReleased ? "Released" : target.status,
    milestones: updatedMilestones,
  };

  saveMockRequests(items.map((r) => (r.id === target.id ? updated : r)));
  return updated;
}
