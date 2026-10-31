"use client";

import * as React from "react";
import { parseAmount } from "@stellar-aid/sdk";
import { AlertCircle, CheckCircle2, Info, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/Money";
import { simulateContribution, type HelpRequestItem, type SimulationPreview } from "@/lib/requests";

export interface ContributeFormProps {
  request: HelpRequestItem;
  userBalanceStroops?: bigint;
  onContribute: (amountStroops: bigint) => Promise<void> | void;
  disabled?: boolean;
}

export function ContributeForm({
  request,
  userBalanceStroops = 500_000_000_000n, // 50,000.00 default mock balance
  onContribute,
  disabled = false,
}: ContributeFormProps): React.ReactElement {
  const remainingStroops = React.useMemo(() => {
    const goal = BigInt(request.goal || "0");
    const raised = BigInt(request.raised || "0");
    return goal > raised ? goal - raised : 100_000_000n;
  }, [request.goal, request.raised]);

  const defaultAmountStr = React.useMemo(() => {
    const num = Number(remainingStroops) / 1e7;
    return num > 0 ? num.toFixed(2) : "10.00";
  }, [remainingStroops]);

  const [amountInput, setAmountInput] = React.useState<string>(defaultAmountStr);
  const [simulation, setSimulation] = React.useState<SimulationPreview | null>(null);
  const [isSimulating, setIsSimulating] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Run Soroban simulation preview BEFORE opening wallet prompt whenever amount changes
  React.useEffect(() => {
    let active = true;
    setIsSimulating(true);
    void simulateContribution({
      request,
      amountInput,
      userBalanceStroops,
    }).then((result) => {
      if (active) {
        setSimulation(result);
        setIsSimulating(false);
      }
    });
    return () => {
      active = false;
    };
  }, [request, amountInput, userBalanceStroops]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const preview = await simulateContribution({
      request,
      amountInput,
      userBalanceStroops,
    });
    setSimulation(preview);

    if (!preview.ok) {
      return;
    }

    setIsSubmitting(true);
    try {
      const amountStroops = parseAmount(amountInput.trim(), 7);
      await onContribute(amountStroops);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit contribution");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-6"
      data-testid="contribute-form"
    >
      <Card>
        <CardHeader>
          <CardTitle>Contribute to Escrow</CardTitle>
          <CardDescription>
            Deposit {request.token} directly into the non-custodial Soroban escrow contract for{" "}
            <span className="font-medium text-foreground">{request.title}</span>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="contributionAmount">Contribution amount ({request.token})</Label>
              <span className="text-xs text-muted-foreground">
                Wallet balance: <Money value={userBalanceStroops} asset={request.token} />
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                id="contributionAmount"
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 50.00"
                disabled={disabled || isSubmitting}
                data-testid="contribution-amount-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmountInput(defaultAmountStr)}
                disabled={disabled || isSubmitting}
                className="shrink-0"
                data-testid="fund-remaining-button"
              >
                Fund remaining ({defaultAmountStr} {request.token})
              </Button>
            </div>
          </div>

          {/* Pre-Wallet Simulation Preview */}
          <div
            className="space-y-2 rounded-lg border bg-muted/40 p-3 text-xs"
            data-testid="simulation-preview"
          >
            <div className="flex items-center justify-between font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Pre-Wallet Soroban Simulation
              </span>
              {isSimulating ? (
                <span className="text-muted-foreground">Simulating...</span>
              ) : simulation?.ok ? (
                <span
                  className="inline-flex items-center gap-1 text-emerald-600"
                  data-testid="simulation-ok"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Simulation passed
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-destructive"
                  data-testid="simulation-error-status"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {simulation?.errorCode ?? "Simulation failed"}
                </span>
              )}
            </div>

            {simulation?.ok ? (
              <div className="flex items-center justify-between border-t pt-1 text-muted-foreground">
                <span>Estimated Soroban network fee:</span>
                <span className="font-mono text-foreground" data-testid="simulation-fee">
                  <Money value={simulation.estimatedFeeStroops} asset="XLM" showFull />
                </span>
              </div>
            ) : (
              simulation?.errorMessage && (
                <p
                  role="alert"
                  className="border-t pt-1 text-destructive"
                  data-testid="simulation-error-message"
                >
                  {simulation.errorMessage}
                </p>
              )
            )}
          </div>

          {/* Plain-Language Refund Policy */}
          <div
            className="space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs"
            data-testid="refund-policy-box"
          >
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>100% On-Chain Escrow Refund Guarantee</span>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              Funds are held in on-chain Soroban escrow—never by StellarAid servers or moderators.
              If the fundraising goal is not reached by the deadline, or if the request is cancelled
              or disputed, you can claim a 100% refund directly from the smart contract.
            </p>
          </div>

          {submitError && (
            <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
              <Info className="h-3.5 w-3.5" /> {submitError}
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || isSubmitting || !simulation?.ok}
        data-testid="submit-contribution-button"
      >
        {isSubmitting
          ? "Signing & Submitting to Soroban..."
          : `Sign & Contribute ${amountInput || "0"} ${request.token}`}
      </Button>
    </form>
  );
}
