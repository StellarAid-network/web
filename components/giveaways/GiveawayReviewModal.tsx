"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { stellarConfig, explorerTxUrl } from "@/lib/stellar";
import { signWalletTransaction } from "@/lib/wallet-kit";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, ShieldAlert } from "lucide-react";

interface GiveawayReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetCode: "USDC" | "XLM";
  amountPerClaim: string;
  claimants: string[];
  expiryDays: number;
  totalLocked: string;
  onSuccess: (txHash: string) => void;
}

const USDC_ISSUERS: Record<string, string> = {
  testnet: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  mainnet: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  local: "",
};

export function GiveawayReviewModal({
  open,
  onOpenChange,
  assetCode,
  amountPerClaim,
  claimants,
  expiryDays,
  totalLocked,
  onSuccess,
}: GiveawayReviewModalProps): React.ReactElement {
  const { address, isNetworkMismatch } = useWallet();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [txHash, setTxHash] = React.useState<string | null>(null);

  const expirySeconds = expiryDays * 86400;
  const expiryDate = new Date(Date.now() + expirySeconds * 1000);

  const handleConfirmAndSign = async () => {
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (isNetworkMismatch) {
      setError("Wallet network mismatch. Please switch to the configured network.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        TransactionBuilder,
        Asset,
        Account,
        Operation,
        Claimant,
      } = await import("@stellar/stellar-sdk");

      // 1. Fetch creator account sequence
      const accRes = await fetch(`${stellarConfig.horizonUrl}/accounts/${address}`);
      if (!accRes.ok) throw new Error("Could not load account details from Horizon.");
      const accountData = (await accRes.json()) as { sequence: string };

      const stellarAccount = new Account(address, accountData.sequence);

      const asset =
        assetCode === "XLM"
          ? Asset.native()
          : new Asset("USDC", USDC_ISSUERS[stellarConfig.network] ?? "");

      // 2. Build Claimable Balance operations (1 operation per claimant)
      const txBuilder = new TransactionBuilder(stellarAccount, {
        fee: "100",
        networkPassphrase: stellarConfig.networkPassphrase,
      });

      for (const dest of claimants) {
        txBuilder.addOperation(
          Operation.createClaimableBalance({
            asset,
            amount: amountPerClaim,
            claimants: [
              // Claimer can claim before expiry
              new Claimant(
                dest,
                Claimant.predicateBeforeRelativeTime(expirySeconds.toString()),
              ),
              // Creator can reclaim after expiry
              new Claimant(
                address,
                Claimant.predicateNot(
                  Claimant.predicateBeforeRelativeTime(expirySeconds.toString()),
                ),
              ),
            ],
          }),
        );
      }

      const tx = txBuilder.setTimeout(300).build();

      // 3. Sign through wallet
      const signedXdr = await signWalletTransaction(tx.toXDR(), { address });

      // 4. Submit to Horizon
      const subRes = await fetch(`${stellarConfig.horizonUrl}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ tx: signedXdr }).toString(),
      });

      if (!subRes.ok) {
        const errJson = (await subRes.json().catch(() => ({}))) as {
          extras?: { result_codes?: { operations?: string[] } };
        };
        const ops = errJson.extras?.result_codes?.operations?.join(", ");
        throw new Error(`Transaction failed on Horizon: ${ops || subRes.statusText}`);
      }

      const resData = (await subRes.json()) as { hash: string };
      setTxHash(resData.hash);
      onSuccess(resData.hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create giveaway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Giveaway</DialogTitle>
          <DialogDescription>
            Confirm parameters before signing the transaction with your wallet.
          </DialogDescription>
        </DialogHeader>

        {txHash ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Giveaway Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your native claimable balances have been confirmed on Stellar.
              </p>
            </div>
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary underline"
            >
              View on Stellar.Expert <ExternalLink className="h-3 w-3" />
            </a>
            <Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset:</span>
                <span className="font-semibold">{assetCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount per claim:</span>
                <span className="font-semibold">{amountPerClaim} {assetCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipients:</span>
                <span className="font-semibold">{claimants.length} person(s)</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total locked:</span>
                <span className="text-primary">{totalLocked} {assetCode}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Expiry:</strong> {expiryDate.toLocaleDateString()} ({expiryDays} days).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Unclaimed funds:</strong> Any unclaimed balances can be reclaimed back to
                  your wallet after expiry.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Estimated fee:</strong> ~0.0001 XLM (Stellar base network fee).
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isNetworkMismatch && (
              <div className="rounded border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Your wallet is on a different network than {stellarConfig.network}.</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleConfirmAndSign()}
                disabled={isSubmitting || !address || isNetworkMismatch}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing…
                  </>
                ) : (
                  "Confirm & Sign"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
