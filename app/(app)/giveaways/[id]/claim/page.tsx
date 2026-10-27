"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useWalletStore } from "@/stores/wallet";
import { fetchGiveawayById, type GiveawayItem } from "@/lib/giveaways";
import { checkGiveawayEligibility, type EligibilityReport } from "@/lib/giveaways/eligibility";
import { EligibilityChecklist } from "@/components/giveaways/EligibilityChecklist";
import { TurnstileWidget } from "@/components/anti-abuse/TurnstileWidget";
import { ArrowLeft, Gift, AlertCircle, Loader2 } from "lucide-react";

interface ClaimGiveawayPageProps {
  params: Promise<{ id: string }>;
}

export default function ClaimGiveawayPage({ params }: ClaimGiveawayPageProps): React.ReactElement {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { address, connect } = useWalletStore();
  const isConnected = Boolean(address);

  const [giveaway, setGiveaway] = useState<GiveawayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eligibilityReport, setEligibilityReport] = useState<EligibilityReport | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadGiveaway() {
      try {
        setLoading(true);
        const data = await fetchGiveawayById(id);
        if (!active) return;
        if (!data) {
          setError("Giveaway not found or expired.");
        } else {
          setGiveaway(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load giveaway");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadGiveaway();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    async function evaluate() {
      if (!address || !giveaway) {
        setEligibilityReport(null);
        return;
      }
      try {
        setEligibilityLoading(true);
        const rep = await checkGiveawayEligibility(address, giveaway);
        if (active) setEligibilityReport(rep);
      } catch {
        // Fallback
      } finally {
        if (active) setEligibilityLoading(false);
      }
    }
    void evaluate();
    return () => {
      active = false;
    };
  }, [address, giveaway]);

  if (loading) {
    return (
      <div className="container max-w-2xl py-12 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading giveaway details...</p>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="container max-w-2xl py-12 space-y-4">
        <Link
          href="/giveaways"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Giveaways
        </Link>
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Unable to claim</h2>
          <p className="text-sm text-muted-foreground">{error || "Giveaway not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <Link
        href={`/giveaways/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Giveaway
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Claim Giveaway</h1>
          <p className="text-sm text-muted-foreground">
            Complete human verification and claim your allocation.
          </p>
        </div>
      </div>

      {/* Giveaway Summary Card */}
      <div className="p-5 rounded-2xl border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Claim Amount</span>
          <span className="text-xl font-bold text-foreground">
            {giveaway.amountPerClaim} {giveaway.asset.code}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Creator</span>
          <span className="font-mono">
            {giveaway.creator.slice(0, 6)}...{giveaway.creator.slice(-4)}
          </span>
        </div>
      </div>

      {/* Wallet Connection check */}
      {!isConnected ? (
        <div className="p-6 rounded-2xl border bg-muted/30 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Please connect your Stellar wallet to verify your eligibility and claim.
          </p>
          <button
            type="button"
            onClick={() => void connect()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Eligibility Checklist */}
          <EligibilityChecklist report={eligibilityReport} loading={eligibilityLoading} />

          {/* Turnstile Bot Protection */}
          <TurnstileWidget
            onVerified={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
          />

          {/* Next action step: enabled once eligible and verified */}
          <div className="pt-2">
            <button
              type="button"
              id="proceed-claim-btn"
              disabled={!eligibilityReport?.eligible || !turnstileToken}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-colors ${
                eligibilityReport?.eligible && turnstileToken
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {!turnstileToken
                ? "Complete verification to proceed"
                : !eligibilityReport?.eligible
                  ? "Wallet not eligible"
                  : "Proceed to Claim"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
