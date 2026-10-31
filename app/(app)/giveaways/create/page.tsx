"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreateGiveawayForm,
  type CreateGiveawayFormValues,
} from "@/components/giveaways/CreateGiveawayForm";
import { GiveawayReviewModal } from "@/components/giveaways/GiveawayReviewModal";
import { ArrowLeft } from "lucide-react";

export default function CreateGiveawayPage(): React.ReactElement {
  const queryClient = useQueryClient();

  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState<CreateGiveawayFormValues>({
    assetCode: "USDC",
    amountPerClaim: "10.00",
    claimantsRaw: "",
    expiryDays: 7,
  });
  const [parsedClaimants, setParsedClaimants] = React.useState<string[]>([]);
  const [totalLocked, setTotalLocked] = React.useState<string>("0.00");

  const handleReview = (values: CreateGiveawayFormValues, claimants: string[], total: string) => {
    setFormValues(values);
    setParsedClaimants(claimants);
    setTotalLocked(total);
    setReviewOpen(true);
  };

  const handleSuccess = (_txHash: string) => {
    // Invalidate queries so the giveaways list refreshes
    void queryClient.invalidateQueries({ queryKey: ["giveaways"] });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      <Link
        href="/giveaways"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to giveaways
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Giveaway</h1>
        <p className="text-sm text-muted-foreground">
          Deposit funds into native Stellar claimable balances with an automatic reclamation window.
        </p>
      </div>

      <CreateGiveawayForm onReview={handleReview} />

      <GiveawayReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        assetCode={formValues.assetCode}
        amountPerClaim={formValues.amountPerClaim}
        claimants={parsedClaimants}
        expiryDays={formValues.expiryDays}
        totalLocked={totalLocked}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
