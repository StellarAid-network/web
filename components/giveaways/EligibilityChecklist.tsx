"use client";

import React from "react";
import type { EligibilityReport } from "@/lib/giveaways/eligibility";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Clock, Wallet } from "lucide-react";

interface EligibilityChecklistProps {
  report: EligibilityReport | null;
  loading?: boolean;
}

export function EligibilityChecklist({
  report,
  loading = false,
}: EligibilityChecklistProps): React.ReactElement {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border bg-card p-4">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        Connect your wallet to evaluate your eligibility for this giveaway.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Eligibility Requirements</h4>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            report.eligible
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              : "border border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {report.eligible ? "Eligible" : "Not Eligible"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {/* Account age */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Account Age</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {(report.accountAgeSeconds / 3600).toFixed(0)}h old
            </span>
            {report.accountAgeEligible ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Minimum XLM Balance */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span>Wallet Reserve Balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {parseFloat(report.nativeBalance).toFixed(2)} XLM
            </span>
            {report.balanceEligible ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Reputation */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Reputation Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{report.reputationScore} / 100</span>
            {report.reputationEligible ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Trustline status if non-native */}
        {report.needsTrustline && (
          <div className="flex items-center justify-between border-t py-1 pt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Asset Trustline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {report.hasTrustline ? "Active" : "Auto-add on claim"}
              </span>
              {report.hasTrustline ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600">
                  Will add
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {report.reasons.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2 text-xs text-destructive">
          {report.reasons.map((r, i) => (
            <p key={i}>• {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}
