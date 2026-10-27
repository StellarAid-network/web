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
      <div className="p-4 rounded-xl border bg-card animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 rounded-xl border bg-muted/40 text-sm text-muted-foreground">
        Connect your wallet to evaluate your eligibility for this giveaway.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-card text-card-foreground space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Eligibility Requirements</h4>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            report.eligible
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {report.eligible ? "Eligible" : "Not Eligible"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {/* Account age */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Account Age</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {(report.accountAgeSeconds / 3600).toFixed(0)}h old
            </span>
            {report.accountAgeEligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Minimum XLM Balance */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span>Wallet Reserve Balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {parseFloat(report.nativeBalance).toFixed(2)} XLM
            </span>
            {report.balanceEligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Reputation */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span>Reputation Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {report.reputationScore} / 100
            </span>
            {report.reputationEligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Trustline status if non-native */}
        {report.needsTrustline && (
          <div className="flex items-center justify-between py-1 border-t pt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Asset Trustline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {report.hasTrustline ? "Active" : "Auto-add on claim"}
              </span>
              {report.hasTrustline ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                  Will add
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {report.reasons.length > 0 && (
        <div className="mt-2 pt-2 border-t text-xs text-destructive space-y-1">
          {report.reasons.map((r, i) => (
            <p key={i}>• {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}
