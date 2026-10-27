"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Address } from "@/components/ui/Address";
import { Money } from "@/components/ui/Money";
import { fetchGiveawayById } from "@/lib/giveaways";
import { executeReclaimExpired } from "@/lib/giveaways/claim";
import { useWalletStore } from "@/stores/wallet";
import { explorerTxUrl } from "@/lib/stellar";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  ShieldCheck,
  RotateCcw,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function GiveawayDetailPage(): React.ReactElement {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { address } = useWalletStore();
  const queryClient = useQueryClient();

  const [reclaimStatus, setReclaimStatus] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [reclaimTxHash, setReclaimTxHash] = React.useState<string | null>(null);
  const [reclaimError, setReclaimError] = React.useState<string | null>(null);

  const {
    data: giveaway,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["giveaway", id],
    queryFn: () => (id ? fetchGiveawayById(id) : null),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-6 w-32" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  if (isError || !giveaway) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 text-center">
        <h2 className="text-xl font-bold">Giveaway not found</h2>
        <p className="text-sm text-muted-foreground">
          The requested giveaway could not be located on-chain.
        </p>
        <Link href="/giveaways">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to giveaways
          </Button>
        </Link>
      </div>
    );
  }

  const isExpired = Boolean(
    giveaway.status === "expired" ||
      (giveaway.expiresAt && new Date(giveaway.expiresAt).getTime() < Date.now()),
  );

  const isCreator = Boolean(address && address === giveaway.creator);

  const statusVariant = isExpired
    ? "destructive"
    : giveaway.status === "claimed"
      ? "secondary"
      : "default";

  const [whole = "0", frac = ""] = giveaway.amountPerClaim.split(".");
  const stroops = BigInt(whole) * 10_000_000n + BigInt(frac.padEnd(7, "0").slice(0, 7));

  const handleReclaim = async () => {
    if (!address || !isCreator || !giveaway) return;
    setReclaimStatus("submitting");
    setReclaimError(null);

    try {
      const res = await executeReclaimExpired({
        creatorAddress: address,
        balanceId: giveaway.id,
      });
      setReclaimTxHash(res.txHash);
      setReclaimStatus("success");
      void queryClient.invalidateQueries({ queryKey: ["giveaway", id] });
    } catch (err) {
      setReclaimStatus("error");
      setReclaimError(err instanceof Error ? err.message : "Reclaim failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Link
        href="/giveaways"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to giveaways
      </Link>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                {giveaway.title ?? `${giveaway.asset.code} Community Grant`}
              </CardTitle>
              <CardDescription className="mt-1">
                {giveaway.description ?? "Native claimable balance distribution on Stellar."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isCreator && (
                <Badge variant="outline" className="border-primary text-primary text-xs">
                  Creator View
                </Badge>
              )}
              <Badge variant={statusVariant} className="text-sm capitalize shrink-0">
                {isExpired ? "Expired" : giveaway.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Amount per claim
              </span>
              <div className="text-2xl font-extrabold text-primary">
                <Money value={stroops} asset={giveaway.asset.code} showFull />
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/giveaways/${giveaway.id}/claim`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto" disabled={isExpired}>
                  {isExpired ? "Claim expired" : "Claim giveaway"}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Creator
              </span>
              <div>
                <Address value={giveaway.creator} truncate={false} href className="text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Allowed claimers
              </span>
              <div className="font-medium">
                {giveaway.claimants.length} destination address{giveaway.claimants.length === 1 ? "" : "es"}
              </div>
            </div>

            {giveaway.claimableFrom && (
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Claimable from
                </span>
                <div className="font-medium">
                  {new Date(giveaway.claimableFrom).toLocaleString()}
                </div>
              </div>
            )}

            {giveaway.expiresAt && (
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Reclaimable after
                </span>
                <div className="font-medium">
                  {new Date(giveaway.expiresAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Eligible claimers list */}
          {giveaway.claimants.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Eligible claimers
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded border bg-muted/20 p-2">
                {giveaway.claimants.map((dest) => (
                  <div key={dest} className="text-xs font-mono py-0.5">
                    <Address value={dest} truncate={false} href />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creator View: Reclaim expired action */}
          {isCreator && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Creator Operations</h4>
                  <p className="text-xs text-muted-foreground">
                    Reclaim any unclaimed funds after the expiry predicate has elapsed.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleReclaim()}
                  disabled={!isExpired || reclaimStatus === "submitting"}
                  className="gap-1.5 text-xs"
                >
                  {reclaimStatus === "submitting" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reclaiming...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reclaim Expired</span>
                    </>
                  )}
                </Button>
              </div>

              {reclaimError && (
                <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{reclaimError}</span>
                </div>
              )}

              {reclaimStatus === "success" && reclaimTxHash && (
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Expired funds reclaimed successfully.</span>
                  </div>
                  <a
                    href={explorerTxUrl(reclaimTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline text-primary"
                  >
                    View on explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
