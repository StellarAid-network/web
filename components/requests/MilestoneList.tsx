"use client";

import * as React from "react";
import { CheckCircle2, Clock, FileCheck2, Send, ShieldCheck, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Address } from "@/components/ui/Address";
import { Money } from "@/components/ui/Money";
import type { HelpRequestMilestone, HelpRequestStatus } from "@/lib/requests";

export interface MilestoneListProps {
  milestones: HelpRequestMilestone[];
  token: "USDC" | "XLM";
  requestStatus: HelpRequestStatus;
  creatorAddress: string;
  currentUserAddress?: string | null;
  onSubmitEvidence?: (milestoneIndex: number, evidenceHash: string) => Promise<void> | void;
  onApproveMilestone?: (milestoneIndex: number) => Promise<void> | void;
  onReleaseMilestone?: (milestoneIndex: number) => Promise<void> | void;
  isBusy?: boolean;
}

export function MilestoneList({
  milestones,
  token,
  requestStatus,
  creatorAddress,
  currentUserAddress,
  onSubmitEvidence,
  onApproveMilestone,
  onReleaseMilestone,
  isBusy = false,
}: MilestoneListProps): React.ReactElement {
  const [evidenceInputs, setEvidenceInputs] = React.useState<Record<number, string>>({});

  if (milestones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Single-lump-sum escrow release upon reaching funding goal.
      </div>
    );
  }

  const canActOnMilestones = requestStatus === "Funded" || requestStatus === "Open";

  return (
    <div className="space-y-4" data-testid="milestone-list">
      {milestones.map((m) => {
        const isCreator =
          !currentUserAddress ||
          currentUserAddress.toLowerCase() === creatorAddress.toLowerCase();
        const isApprover =
          !currentUserAddress || currentUserAddress.toLowerCase() === m.approver.toLowerCase();

        const evidenceVal =
          evidenceInputs[m.index] ?? `bafybeigmilestone${m.index + 1}proof000000000001`;

        return (
          <div
            key={m.index}
            className="rounded-lg border bg-card p-4 space-y-3"
            data-testid={`milestone-item-${m.index}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-muted-foreground">
                    Milestone #{m.index + 1}
                  </span>
                  <MilestoneStatusBadge status={m.status} />
                </div>
                <h4 className="font-semibold text-sm">{m.title}</h4>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold">
                  <Money value={m.amount} asset={token} />
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>Verifier / Approver:</span>
                <Address value={m.approver} />
              </div>

              {m.evidenceHash && (
                <div className="font-mono text-xs" data-testid={`milestone-evidence-${m.index}`}>
                  Evidence CID: <span className="text-foreground">{m.evidenceHash}</span>
                </div>
              )}
            </div>

            {canActOnMilestones && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {m.status === "Pending" && onSubmitEvidence && isCreator && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="text"
                      aria-label={`Evidence hash for milestone ${m.index + 1}`}
                      placeholder="IPFS CID or SHA-256 evidence hash"
                      value={evidenceVal}
                      onChange={(e) =>
                        setEvidenceInputs((prev) => ({
                          ...prev,
                          [m.index]: e.target.value,
                        }))
                      }
                      className="h-8 text-xs font-mono"
                      disabled={isBusy}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy || evidenceVal.trim().length === 0}
                      onClick={() => void onSubmitEvidence(m.index, evidenceVal)}
                      data-testid={`submit-milestone-${m.index}`}
                      className="gap-1.5 shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit evidence
                    </Button>
                  </div>
                )}

                {m.status === "Submitted" && onApproveMilestone && isApprover && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={() => void onApproveMilestone(m.index)}
                    data-testid={`approve-milestone-${m.index}`}
                    className="gap-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Approve milestone
                  </Button>
                )}

                {m.status === "Approved" && onReleaseMilestone && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void onReleaseMilestone(m.index)}
                    data-testid={`release-milestone-${m.index}`}
                    className="gap-1.5"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    Release milestone
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MilestoneStatusBadge({
  status,
}: {
  status: HelpRequestMilestone["status"];
}): React.ReactElement {
  switch (status) {
    case "Pending":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>Pending</span>
        </Badge>
      );
    case "Submitted":
      return (
        <Badge variant="secondary" className="gap-1">
          <FileCheck2 className="h-3 w-3" aria-hidden="true" />
          <span>Evidence Submitted</span>
        </Badge>
      );
    case "Approved":
      return (
        <Badge variant="default" className="gap-1">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          <span>Approved</span>
        </Badge>
      );
    case "Released":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          <span>Released</span>
        </Badge>
      );
  }
}
