"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Address } from "@/components/ui/Address";
import { Money } from "@/components/ui/Money";
import { useWallet } from "@/hooks/use-wallet";
import { formatDate } from "@/lib/format";
import {
  approveMilestone,
  claimRefund,
  fetchHelpRequestById,
  finalizeFailedRequest,
  releaseMilestone,
  submitMilestoneEvidence,
} from "@/lib/requests";
import { GoalProgress } from "@/components/requests/GoalProgress";
import { MilestoneList } from "@/components/requests/MilestoneList";

export default function RequestDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const requestId = params?.id ?? "1";
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const [isBusy, setIsBusy] = React.useState(false);
  const [actionBanner, setActionBanner] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["help-request", requestId],
    queryFn: () => fetchHelpRequestById(requestId),
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["help-request", requestId] });
    await queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    await refetch();
  };

  const handleClaimRefund = async () => {
    setIsBusy(true);
    setActionBanner(null);
    try {
      const contributorAddr = address ?? "ANY";
      const { refundedStroops } = await claimRefund({
        requestId,
        contributor: contributorAddr,
      });
      await handleRefresh();
      setActionBanner({
        type: "success",
        message: `Refund claimed successfully (${(Number(refundedStroops) / 1e7).toFixed(2)} ${request?.token ?? "USDC"} returned from escrow).`,
      });
    } catch (err) {
      setActionBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to claim refund",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleFinalizeFailed = async () => {
    setIsBusy(true);
    setActionBanner(null);
    try {
      await finalizeFailedRequest(requestId);
      await handleRefresh();
      setActionBanner({
        type: "success",
        message:
          "Request finalized as Failed on-chain. Contributors can now claim 100% refunds from escrow.",
      });
    } catch (err) {
      setActionBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to finalize request",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSubmitEvidence = async (milestoneIndex: number, evidenceHash: string) => {
    setIsBusy(true);
    setActionBanner(null);
    try {
      await submitMilestoneEvidence({ requestId, milestoneIndex, evidenceHash });
      await handleRefresh();
      setActionBanner({
        type: "success",
        message: `Evidence submitted on-chain for Milestone #${milestoneIndex + 1}.`,
      });
    } catch (err) {
      setActionBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit milestone evidence",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleApproveMilestone = async (milestoneIndex: number) => {
    setIsBusy(true);
    setActionBanner(null);
    try {
      await approveMilestone({ requestId, milestoneIndex });
      await handleRefresh();
      setActionBanner({
        type: "success",
        message: `Milestone #${milestoneIndex + 1} approved by verifier.`,
      });
    } catch (err) {
      setActionBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to approve milestone",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleReleaseMilestone = async (milestoneIndex: number) => {
    setIsBusy(true);
    setActionBanner(null);
    try {
      await releaseMilestone({ requestId, milestoneIndex });
      await handleRefresh();
      setActionBanner({
        type: "success",
        message: `Escrow funds released for Milestone #${milestoneIndex + 1}.`,
      });
    } catch (err) {
      setActionBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to release milestone",
      });
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4">
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/50 p-8 text-center">
          <p className="text-sm text-destructive">Help request not found or failed to load.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isRefundEligibleStatus =
    request.status === "Failed" ||
    request.status === "Cancelled" ||
    request.status === "Disputed";
  const hasUnrefundedContributions = request.contributions.some((c) => !c.refunded);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            All help requests
          </Button>
        </Link>

        <span className="text-xs font-mono text-muted-foreground">
          On-Chain Escrow #{request.onChainId}
        </span>
      </div>

      {request.hashMismatch && (
        <div
          role="alert"
          data-testid="hash-mismatch-warning"
          className="flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Content Hash Mismatch Detected</p>
            <p className="text-xs mt-0.5">
              The off-chain title or description does not match the immutable SHA-256 content_hash
              recorded on-chain. Always rely on on-chain escrow parameters (goal, token, milestones,
              deadline).
            </p>
          </div>
        </div>
      )}

      {actionBanner && (
        <div
          role="status"
          data-testid="request-action-banner"
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            actionBanner.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {actionBanner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionBanner.message}</span>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Created by</span>
              <Address value={request.creator} href />
            </div>
            <span>Created {formatDate(request.createdAt)}</span>
          </div>

          <CardTitle className="text-2xl">{request.title}</CardTitle>

          {request.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {request.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {request.description}
          </p>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <GoalProgress
              raised={request.raised}
              goal={request.goal}
              token={request.token}
              status={request.status}
              deadline={request.deadline}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>On-chain SHA-256:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {request.contentHash.slice(0, 16)}…
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {request.status === "Open" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleFinalizeFailed()}
                      data-testid="finalize-failed-button"
                      className="gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Simulate Goal Failed
                    </Button>

                    <Link href={`/requests/${request.id}/contribute`}>
                      <Button size="sm" className="gap-1.5" data-testid="contribute-cta-button">
                        <Coins className="h-4 w-4" />
                        Contribute {request.token}
                      </Button>
                    </Link>
                  </>
                )}

                {isRefundEligibleStatus && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isBusy || !hasUnrefundedContributions}
                    onClick={() => void handleClaimRefund()}
                    data-testid="claim-refund-button"
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {hasUnrefundedContributions ? "Claim refund" : "Refund claimed"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escrow Milestones & Verification</CardTitle>
          <CardDescription>
            Funds are released incrementally as each milestone is submitted and approved on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MilestoneList
            milestones={request.milestones}
            token={request.token}
            requestStatus={request.status}
            creatorAddress={request.creator}
            currentUserAddress={address}
            onSubmitEvidence={handleSubmitEvidence}
            onApproveMilestone={handleApproveMilestone}
            onReleaseMilestone={handleReleaseMilestone}
            isBusy={isBusy}
          />
        </CardContent>
      </Card>

      {/* Contribution History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Contributions ({request.contributions.length})
          </CardTitle>
          <CardDescription>
            Verifiable Soroban escrow deposits recorded on the Stellar ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {request.contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No contributions yet. Be the first to support this request!
            </p>
          ) : (
            <div className="divide-y" data-testid="contribution-history">
              {request.contributions.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Address value={c.contributor} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      <Money value={c.amount} asset={request.token} />
                    </span>
                    {c.refunded && (
                      <Badge variant="secondary" data-testid="refunded-badge">
                        Refunded
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
