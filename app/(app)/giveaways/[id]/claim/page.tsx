"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useWalletStore } from "@/stores/wallet";
import { fetchGiveawayById, type GiveawayItem } from "@/lib/giveaways";
import { checkGiveawayEligibility, type EligibilityReport } from "@/lib/giveaways/eligibility";
import { executeGiveawayClaim } from "@/lib/giveaways/claim";
import { explorerTxUrl } from "@/lib/stellar";
import { EligibilityChecklist } from "@/components/giveaways/EligibilityChecklist";
import { TurnstileWidget } from "@/components/anti-abuse/TurnstileWidget";
import { ArrowLeft, Gift, AlertCircle, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

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

  const [claimStatus, setClaimStatus] = useState<
    "idle" | "signing" | "submitting" | "success" | "error"
  >("idle");
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

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

  const handleClaim = async () => {
    if (!address || !giveaway || !turnstileToken) return;

    setClaimStatus("signing");
    setClaimError(null);

    try {
      setClaimStatus("submitting");
      const result = await executeGiveawayClaim({
        claimerAddress: address,
        balanceId: giveaway.id,
        asset: giveaway.asset,
        needsTrustline: eligibilityReport?.needsTrustline && !eligibilityReport.hasTrustline,
      });

      setClaimTxHash(result.txHash);
      setClaimStatus("success");
    } catch (err) {
      setClaimStatus("error");
      setClaimError(err instanceof Error ? err.message : "Claim execution failed");
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading giveaway details...</p>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="container max-w-2xl space-y-4 py-12">
        <Link
          href="/giveaways"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Giveaways
        </Link>
        <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="text-lg font-bold">Unable to claim</h2>
          <p className="text-sm text-muted-foreground">{error || "Giveaway not found"}</p>
        </div>
      </div>
    );
  }

  // Success view
  if (claimStatus === "success" && claimTxHash) {
    return (
      <div className="container max-w-2xl space-y-6 py-12">
        <div className="space-y-4 rounded-2xl border bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Claim Successful!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {giveaway.amountPerClaim} {giveaway.asset.code} has been transferred to your wallet.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={explorerTxUrl(claimTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View on Stellar Explorer <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="border-t pt-4">
            <Link
              href="/giveaways"
              className="inline-flex rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse More Giveaways
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <Link
        href={`/giveaways/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Giveaway
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Gift className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Claim Giveaway</h1>
          <p className="text-sm text-muted-foreground">
            Complete human verification and claim your allocation.
          </p>
        </div>
      </div>

      {/* Giveaway Summary Card */}
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Claim Amount</span>
          <span className="text-xl font-bold text-foreground">
            {giveaway.amountPerClaim} {giveaway.asset.code}
          </span>
        </div>
        <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
          <span>Creator</span>
          <span className="font-mono">
            {giveaway.creator.slice(0, 6)}...{giveaway.creator.slice(-4)}
          </span>
        </div>
      </div>

      {/* Turnstile Bot Protection */}
      <TurnstileWidget
        onVerified={(token) => setTurnstileToken(token)}
        onError={() => setTurnstileToken(null)}
      />

      {/* Wallet Connection check */}
      {!isConnected ? (
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Please connect your Stellar wallet to verify your eligibility and claim.
          </p>
          <button
            type="button"
            onClick={() => void connect()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Eligibility Checklist */}
          <EligibilityChecklist report={eligibilityReport} loading={eligibilityLoading} />

          {claimError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{claimError}</span>
            </div>
          )}

          {/* Claim Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="proceed-claim-btn"
              onClick={() => void handleClaim()}
              disabled={
                !eligibilityReport?.eligible ||
                !turnstileToken ||
                claimStatus === "signing" ||
                claimStatus === "submitting"
              }
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                eligibilityReport?.eligible &&
                turnstileToken &&
                claimStatus !== "signing" &&
                claimStatus !== "submitting"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              {claimStatus === "signing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Waiting for wallet signature...</span>
                </>
              ) : claimStatus === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirming transaction on Stellar...</span>
                </>
              ) : !turnstileToken ? (
                "Complete verification to proceed"
              ) : !eligibilityReport?.eligible ? (
                "Wallet not eligible"
              ) : (
                "Claim Giveaway"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
