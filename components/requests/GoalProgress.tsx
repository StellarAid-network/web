"use client";

import * as React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/Money";
import { formatRelativeTime } from "@/lib/format";
import type { HelpRequestStatus } from "@/lib/requests";

export interface GoalProgressProps {
  raised: string | bigint;
  goal: string | bigint;
  token: "USDC" | "XLM";
  status: HelpRequestStatus;
  deadline: string;
  compact?: boolean;
}

export function GoalProgress({
  raised,
  goal,
  token,
  status,
  deadline,
  compact = false,
}: GoalProgressProps): React.ReactElement {
  const raisedBig = typeof raised === "bigint" ? raised : BigInt(raised || "0");
  const goalBig = typeof goal === "bigint" ? goal : BigInt(goal || "0");

  const rawPercent = goalBig > 0n ? Number((raisedBig * 10000n) / goalBig) / 100 : 0;
  const clampedPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));

  const statusMeta = getStatusBadgeMeta(status);

  return (
    <div className="space-y-2" data-testid="goal-progress">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="font-semibold text-foreground" data-testid="goal-raised">
            <Money value={raisedBig} asset={token} />
          </span>
          <span className="text-muted-foreground">raised of</span>
          <span className="font-medium text-foreground" data-testid="goal-target">
            <Money value={goalBig} asset={token} />
          </span>
        </div>

        <Badge
          variant={statusMeta.variant}
          className="gap-1"
          data-testid="request-status-badge"
          aria-label={`Request status: ${statusMeta.label}`}
        >
          {statusMeta.icon}
          <span>{statusMeta.label}</span>
        </Badge>
      </div>

      <Progress
        value={clampedPercent}
        aria-label={`Funding progress ${clampedPercent}%`}
        className={compact ? "h-2" : "h-3"}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="goal-percent">{clampedPercent}% funded</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>Deadline {formatRelativeTime(deadline)}</span>
        </span>
      </div>
    </div>
  );
}

function getStatusBadgeMeta(status: HelpRequestStatus): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success";
  icon: React.ReactNode;
} {
  switch (status) {
    case "Open":
      return {
        label: "Open",
        variant: "default",
        icon: <Clock className="h-3 w-3" aria-hidden="true" />,
      };
    case "Funded":
      return {
        label: "Funded",
        variant: "success",
        icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
      };
    case "Released":
      return {
        label: "Released",
        variant: "success",
        icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
      };
    case "Failed":
      return {
        label: "Failed",
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
      };
    case "Cancelled":
      return {
        label: "Cancelled",
        variant: "secondary",
        icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
      };
    case "Disputed":
      return {
        label: "Disputed",
        variant: "destructive",
        icon: <ShieldAlert className="h-3 w-3" aria-hidden="true" />,
      };
  }
}
