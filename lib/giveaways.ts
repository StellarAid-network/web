/**
 * Giveaway domain types, helpers, and Horizon fetchers.
 */

import { stellarConfig } from "./stellar";
import { clientEnv } from "./env";
import { mockGiveaways } from "./mock/giveaways";

export interface GiveawayItem {
  id: string;
  creator: string;
  asset: {
    code: string;
    issuer?: string;
  };
  amount: string;
  amountPerClaim: string;
  claimants: string[];
  claimableFrom?: string;
  expiresAt?: string;
  status: "open" | "claimed" | "expired";
  title?: string;
  description?: string;
}

export interface HorizonClaimant {
  destination: string;
  predicate: Record<string, unknown>;
}

export interface HorizonClaimableBalance {
  id: string;
  asset: string;
  amount: string;
  sponsor: string;
  last_modified_time: string;
  claimants: HorizonClaimant[];
}

function parseAsset(assetStr: string): { code: string; issuer?: string } {
  if (assetStr === "native") return { code: "XLM" };
  const [code, issuer] = assetStr.split(":");
  return { code: code ?? "USDC", ...(issuer ? { issuer } : {}) };
}

function parseHorizonRecord(record: HorizonClaimableBalance): GiveawayItem {
  const claimants = record.claimants.map((c) => c.destination);
  const asset = parseAsset(record.asset);

  return {
    id: record.id,
    creator: record.sponsor,
    asset,
    amount: record.amount,
    amountPerClaim: record.amount, // native claimable balance represents total balance
    claimants,
    status: "open",
    title: `Community Giveaway (${asset.code})`,
  };
}

/**
 * Fetch giveaways for exploring, user claims, or user created.
 */
export async function fetchGiveaways(account?: string | null): Promise<GiveawayItem[]> {
  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return mockGiveaways;
  }

  try {
    const url = account
      ? `${stellarConfig.horizonUrl}/claimable_balances?claimant=${account}&order=desc&limit=20`
      : `${stellarConfig.horizonUrl}/claimable_balances?order=desc&limit=20`;

    const res = await fetch(url);
    if (!res.ok) {
      return mockGiveaways;
    }

    const data = (await res.json()) as {
      _embedded?: { records?: HorizonClaimableBalance[] };
    };

    const records = data._embedded?.records ?? [];
    if (records.length === 0) {
      return mockGiveaways;
    }

    return records.map(parseHorizonRecord);
  } catch {
    return mockGiveaways;
  }
}

/**
 * Fetch a single giveaway by id.
 */
export async function fetchGiveawayById(id: string): Promise<GiveawayItem | null> {
  if (clientEnv.NEXT_PUBLIC_API_MODE === "mock") {
    return mockGiveaways.find((g) => g.id === id) ?? null;
  }

  try {
    const res = await fetch(`${stellarConfig.horizonUrl}/claimable_balances/${id}`);
    if (!res.ok) {
      return mockGiveaways.find((g) => g.id === id) ?? null;
    }
    const record = (await res.json()) as HorizonClaimableBalance;
    return parseHorizonRecord(record);
  } catch {
    return mockGiveaways.find((g) => g.id === id) ?? null;
  }
}
