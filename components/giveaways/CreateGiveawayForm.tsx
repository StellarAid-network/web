"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, AlertCircle } from "lucide-react";

export const CreateGiveawayFormSchema = z.object({
  assetCode: z.enum(["USDC", "XLM"]),
  amountPerClaim: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,7})?$/, "Must be a valid positive number up to 7 decimals")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than zero"),
  claimantsRaw: z
    .string()
    .min(1, "At least one claimer address is required")
    .refine((val) => {
      const addresses = val
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (addresses.length === 0) return false;
      if (addresses.length > 100) return false;
      return addresses.every((addr) => /^G[A-Z0-9]{55}$/.test(addr));
    }, "All entries must be valid Stellar public keys (G...), max 100 claimers"),
  expiryDays: z.coerce.number().int().min(1).max(30).default(7),
});

export type CreateGiveawayFormValues = z.infer<typeof CreateGiveawayFormSchema>;

interface CreateGiveawayFormProps {
  onReview: (
    values: CreateGiveawayFormValues,
    parsedClaimants: string[],
    totalLocked: string,
  ) => void;
  disabled?: boolean;
}

export function CreateGiveawayForm({
  onReview,
  disabled,
}: CreateGiveawayFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateGiveawayFormValues>({
    resolver: zodResolver(CreateGiveawayFormSchema),
    defaultValues: {
      assetCode: "USDC",
      amountPerClaim: "10.00",
      claimantsRaw: "",
      expiryDays: 7,
    },
  });

  const amountPerClaim = watch("amountPerClaim");
  const claimantsRaw = watch("claimantsRaw");
  const assetCode = watch("assetCode");

  const parsedClaimants = React.useMemo(() => {
    return claimantsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => /^G[A-Z0-9]{55}$/.test(s));
  }, [claimantsRaw]);

  const totalLocked = React.useMemo(() => {
    const num = parseFloat(amountPerClaim);
    if (isNaN(num) || num <= 0 || parsedClaimants.length === 0) return "0.00";
    return (num * parsedClaimants.length).toFixed(2);
  }, [amountPerClaim, parsedClaimants]);

  const onSubmit = (values: CreateGiveawayFormValues) => {
    const addresses = values.claimantsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onReview(values, addresses, totalLocked);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giveaway Parameters</CardTitle>
          <CardDescription>
            Specify the token, amount per person, and destination addresses.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="assetCode">Asset</Label>
            <div className="flex gap-4">
              <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <input
                  type="radio"
                  value="USDC"
                  {...register("assetCode")}
                  className="text-primary"
                />
                <div>
                  <span className="font-semibold">USDC</span>
                  <p className="text-xs text-muted-foreground">Digital Dollar (Stablecoin)</p>
                </div>
              </label>

              <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <input
                  type="radio"
                  value="XLM"
                  {...register("assetCode")}
                  className="text-primary"
                />
                <div>
                  <span className="font-semibold">XLM</span>
                  <p className="text-xs text-muted-foreground">Native Stellar Lumens</p>
                </div>
              </label>
            </div>
          </div>

          {/* Amount per claim */}
          <div className="space-y-2">
            <Label htmlFor="amountPerClaim">Amount per claim ({assetCode})</Label>
            <Input
              id="amountPerClaim"
              type="text"
              placeholder="e.g. 10.00"
              {...register("amountPerClaim")}
              disabled={disabled}
            />
            {errors.amountPerClaim && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> {errors.amountPerClaim.message}
              </p>
            )}
          </div>

          {/* Claimants */}
          <div className="space-y-2">
            <Label htmlFor="claimantsRaw">
              Allowed claimers ({parsedClaimants.length} valid address
              {parsedClaimants.length === 1 ? "" : "es"})
            </Label>
            <textarea
              id="claimantsRaw"
              rows={4}
              placeholder="Paste Stellar addresses (G...), separated by commas or newlines"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("claimantsRaw")}
              disabled={disabled}
            />
            {errors.claimantsRaw ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> {errors.claimantsRaw.message}
              </p>
            ) : (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" /> Each claimant must have an active Stellar wallet
                account.
              </p>
            )}
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="expiryDays">Reclamation window (days)</Label>
            <Input
              id="expiryDays"
              type="number"
              min={1}
              max={30}
              {...register("expiryDays")}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              After this duration, you can reclaim any remaining unclaimed funds.
            </p>
          </div>

          {/* Live Summary */}
          <div className="space-y-1 rounded-lg bg-muted/60 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total locked:</span>
              <span className="font-bold">
                {totalLocked} {assetCode}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recipients:</span>
              <span>{parsedClaimants.length} person(s)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || parsedClaimants.length === 0}
      >
        Review Giveaway
      </Button>
    </form>
  );
}
