import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { GoalProgress } from "@/components/requests/GoalProgress";
import { MilestoneList } from "@/components/requests/MilestoneList";
import { ContributeForm } from "@/components/requests/ContributeForm";
import { CreateRequestFormSchema } from "@/components/requests/CreateRequestForm";
import {
  approveMilestone,
  claimRefund,
  computeContentHash,
  contributeToHelpRequest,
  createHelpRequest,
  filterHelpRequests,
  finalizeFailedRequest,
  reconcileRequestWithChain,
  releaseMilestone,
  simulateContribution,
  submitMilestoneEvidence,
  verifyContentHash,
} from "@/lib/requests";
import { getMockRequests, resetMockRequests } from "@/lib/mock/requests";

describe("Day 5 Help Requests: Schemas, Chain Reconciliation, Components, and Lifecycles", () => {
  const CREATOR = "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ";
  const VERIFIER = "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF2WS7UKLZ5";
  const CONTRIBUTOR = "GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F";

  beforeEach(() => {
    resetMockRequests();
  });

  it("validates CreateRequestFormSchema and enforces milestone sum == goal", () => {
    const valid = CreateRequestFormSchema.safeParse({
      title: "Solar Battery Backup for Community Clinic",
      description:
        "Replacing two lithium iron phosphate battery modules for clinic emergency backup power.",
      tagsRaw: "energy, clinic",
      token: "USDC",
      goal: "100.00",
      deadlineDays: 14,
      milestones: [
        { title: "Procurement", amount: "60.00", approver: VERIFIER },
        { title: "Installation", amount: "40.00", approver: VERIFIER },
      ],
    });
    expect(valid.success).toBe(true);

    const mismatchedSum = CreateRequestFormSchema.safeParse({
      title: "Solar Battery Backup for Community Clinic",
      description:
        "Replacing two lithium iron phosphate battery modules for clinic emergency backup power.",
      tagsRaw: "energy, clinic",
      token: "USDC",
      goal: "100.00",
      deadlineDays: 14,
      milestones: [
        { title: "Procurement", amount: "50.00", approver: VERIFIER },
        { title: "Installation", amount: "30.00", approver: VERIFIER },
      ],
    });
    expect(mismatchedSum.success).toBe(false);
    if (!mismatchedSum.success) {
      expect(mismatchedSum.error.issues[0]?.message).toContain(
        "Milestone amounts must sum exactly to the goal",
      );
    }
  });

  it("computes SHA-256 contentHash and detects off-chain tampering", async () => {
    const metadata = {
      title: "Clean Water Filtration",
      description: "Ceramic water filters for 120 students.",
      tags: ["water", "school"],
      media: ["https://ipfs.io/ipfs/bafybeigtest1"],
    };

    const hash = await computeContentHash(metadata);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(await verifyContentHash(metadata, hash)).toBe(true);
    expect(
      await verifyContentHash({ ...metadata, title: "Tampered Title" }, hash),
    ).toBe(false);
  });

  it("enforces chain-wins rule in reconcileRequestWithChain", () => {
    const apiItem = getMockRequests()[0]!;
    const reconciled = reconcileRequestWithChain(apiItem, {
      goal: "9990000000",
      raised: "9990000000",
      status: "Funded",
    });

    expect(reconciled.goal).toBe("9990000000");
    expect(reconciled.raised).toBe("9990000000");
    expect(reconciled.status).toBe("Funded");
    // Off-chain fields remain preserved
    expect(reconciled.title).toBe(apiItem.title);
  });

  it("filters help requests by status, NearingGoal, EndingSoon, and tag", () => {
    const all = getMockRequests();
    expect(filterHelpRequests(all, { status: "Open" }).length).toBeGreaterThanOrEqual(1);
    expect(filterHelpRequests(all, { status: "NearingGoal" })).toHaveLength(1);
    expect(filterHelpRequests(all, { status: "EndingSoon" })).toHaveLength(1);
    expect(filterHelpRequests(all, { status: "Funded" })).toHaveLength(1);
    expect(filterHelpRequests(all, { status: "Failed" })).toHaveLength(1);
    expect(filterHelpRequests(all, { tag: "energy" })).toHaveLength(1);
  });

  it("renders GoalProgress with formatted Money amounts and status badge", () => {
    render(
      <GoalProgress
        raised="8500000000"
        goal="10000000000"
        token="USDC"
        status="Open"
        deadline={new Date(Date.now() + 86400 * 1000).toISOString()}
      />,
    );

    expect(screen.getByTestId("goal-raised")).toHaveTextContent("850.00 USDC");
    expect(screen.getByTestId("goal-target")).toHaveTextContent("1000.00 USDC");
    expect(screen.getByTestId("goal-percent")).toHaveTextContent("85% funded");
    expect(screen.getByTestId("request-status-badge")).toHaveTextContent("Open");
  });

  it("renders ContributeForm with refund policy, pre-wallet simulation fee, and error mapping", async () => {
    const openRequest = getMockRequests()[0]!;
    const onContribute = vi.fn();

    render(
      <ContributeForm
        request={openRequest}
        userBalanceStroops={50_000_000_000n}
        onContribute={onContribute}
      />,
    );

    // Plain-language refund policy is always visible
    expect(screen.getByTestId("refund-policy-box")).toHaveTextContent(
      "100% On-Chain Escrow Refund Guarantee",
    );

    // Wait for pre-wallet simulation to complete with estimated fee
    await waitFor(() => {
      expect(screen.getByTestId("simulation-ok")).toBeInTheDocument();
    });
    expect(screen.getByTestId("simulation-fee")).toHaveTextContent("0.0045200 XLM");

    // Enter an amount below minimum (0.01 USDC -> ContributionTooSmall)
    const input = screen.getByTestId("contribution-amount-input");
    fireEvent.change(input, { target: { value: "0.01" } });

    await waitFor(() => {
      expect(screen.getByTestId("simulation-error-message")).toHaveTextContent(
        "ContributionTooSmall",
      );
    });
    expect(screen.getByTestId("submit-contribution-button")).toBeDisabled();
  });

  it("renders MilestoneList and executes submit, approve, and release callbacks", async () => {
    const fundedRequest = getMockRequests()[1]!;
    const onSubmitEvidence = vi.fn();
    const onApproveMilestone = vi.fn();
    const onReleaseMilestone = vi.fn();

    render(
      <MilestoneList
        milestones={fundedRequest.milestones}
        token="USDC"
        requestStatus="Funded"
        creatorAddress={fundedRequest.creator}
        onSubmitEvidence={onSubmitEvidence}
        onApproveMilestone={onApproveMilestone}
        onReleaseMilestone={onReleaseMilestone}
      />,
    );

    // Milestone 0 is Submitted -> has Approve button
    const approveBtn = screen.getByTestId("approve-milestone-0");
    fireEvent.click(approveBtn);
    expect(onApproveMilestone).toHaveBeenCalledWith(0);

    // Milestone 1 is Pending -> has Submit evidence button
    const submitBtn = screen.getByTestId("submit-milestone-1");
    fireEvent.click(submitBtn);
    expect(onSubmitEvidence).toHaveBeenCalledWith(1, expect.stringContaining("bafybeig"));
  });

  it("completes Journey 1: create -> contribute -> goal failed -> refund", async () => {
    const created = await createHelpRequest({
      creator: CREATOR,
      title: "Emergency Generator Fuel Grant",
      description: "Fuel reserve for the neighborhood health station during grid outage.",
      tags: ["emergency", "fuel"],
      media: [],
      token: "USDC",
      goalStroops: 2_000_000_000n, // 200 USDC
      deadlineIso: new Date(Date.now() + 86400 * 1000).toISOString(),
      milestones: [
        {
          title: "Fuel Delivery Receipt",
          amountStroops: 2_000_000_000n,
          approver: VERIFIER,
        },
      ],
    });
    expect(created.status).toBe("Open");

    // Partial contribution (50 USDC < 200 USDC goal)
    const afterContribute = await contributeToHelpRequest({
      requestId: created.id,
      contributor: CONTRIBUTOR,
      amountStroops: 500_000_000n,
    });
    expect(afterContribute.raised).toBe("500000000");
    expect(afterContribute.status).toBe("Open");

    // Goal fails at deadline
    const afterFailed = await finalizeFailedRequest(created.id);
    expect(afterFailed.status).toBe("Failed");

    // Contributor claims 100% refund
    const { updatedRequest, refundedStroops } = await claimRefund({
      requestId: created.id,
      contributor: CONTRIBUTOR,
    });
    expect(refundedStroops).toBe(500_000_000n);
    expect(updatedRequest.raised).toBe("0");
    expect(updatedRequest.contributions[0]?.refunded).toBe(true);

    // Second refund attempt is rejected (NothingToRefund)
    await expect(
      claimRefund({ requestId: created.id, contributor: CONTRIBUTOR }),
    ).rejects.toThrow("NothingToRefund");
  });

  it("completes Journey 2: create -> fund -> milestone -> release", async () => {
    const created = await createHelpRequest({
      creator: CREATOR,
      title: "School Library Solar Lamps",
      description: "Providing 40 solar reading lamps for evening study sessions.",
      tags: ["education", "solar"],
      media: [],
      token: "USDC",
      goalStroops: 1_000_000_000n, // 100 USDC
      deadlineIso: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      milestones: [
        {
          title: "Lamp Delivery & Photo Proof",
          amountStroops: 1_000_000_000n,
          approver: VERIFIER,
        },
      ],
    });

    // Simulating valid contribution before funding
    const sim = await simulateContribution({
      request: created,
      amountInput: "100.00",
    });
    expect(sim.ok).toBe(true);

    // Fund 100% of goal -> transitions to Funded
    const funded = await contributeToHelpRequest({
      requestId: created.id,
      contributor: CONTRIBUTOR,
      amountStroops: 1_000_000_000n,
    });
    expect(funded.status).toBe("Funded");

    // Submit milestone evidence
    const submitted = await submitMilestoneEvidence({
      requestId: created.id,
      milestoneIndex: 0,
      evidenceHash: "bafybeigsolarlampreceipt000001",
    });
    expect(submitted.milestones[0]?.status).toBe("Submitted");

    // Approve milestone
    const approved = await approveMilestone({
      requestId: created.id,
      milestoneIndex: 0,
    });
    expect(approved.milestones[0]?.status).toBe("Approved");

    // Release milestone -> all milestones released -> request status becomes Released
    const released = await releaseMilestone({
      requestId: created.id,
      milestoneIndex: 0,
    });
    expect(released.milestones[0]?.status).toBe("Released");
    expect(released.status).toBe("Released");
  });
});
