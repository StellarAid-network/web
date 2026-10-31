"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import {
  contributeToHelpRequest,
  fetchHelpRequestById,
  type HelpRequestItem,
} from "@/lib/requests";
import { GoalProgress } from "@/components/requests/GoalProgress";
import { ContributeForm } from "@/components/requests/ContributeForm";

const FALLBACK_CONTRIBUTOR = "GCKFBEIYV2U22IO2GUOWGQPTZXGHOA7STAK2OX7WNOBPGXBJWBK6NY7F";

export default function ContributeRequestPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const requestId = params?.id ?? "1";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address } = useWallet();

  const [optimisticRaised, setOptimisticRaised] = React.useState<bigint | null>(null);

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["help-request", requestId],
    queryFn: () => fetchHelpRequestById(requestId),
  });

  const handleContribute = async (amountStroops: bigint) => {
    if (!request) return;

    // 1. Optimistic progress bar update
    const currentRaised = BigInt(request.raised || "0");
    setOptimisticRaised(currentRaised + amountStroops);

    // 2. Execute contribution & update store
    const contributor = address ?? FALLBACK_CONTRIBUTOR;
    const updated: HelpRequestItem = await contributeToHelpRequest({
      requestId: request.id,
      contributor,
      amountStroops,
    });

    // 3. Reconcile cache with chain state (chain wins)
    queryClient.setQueryData(["help-request", requestId], updated);
    await queryClient.invalidateQueries({ queryKey: ["help-request", requestId] });
    await queryClient.invalidateQueries({ queryKey: ["help-requests"] });

    router.push(`/requests/${request.id}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/50 p-8 text-center">
          <p className="text-sm text-destructive">Help request not found.</p>
        </div>
      </div>
    );
  }

  const displayedRaised = optimisticRaised !== null ? optimisticRaised.toString() : request.raised;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Link href={`/requests/${request.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to request #{request.id}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h1 className="text-xl font-bold">{request.title}</h1>
          <GoalProgress
            raised={displayedRaised}
            goal={request.goal}
            token={request.token}
            status={request.status}
            deadline={request.deadline}
          />
        </CardContent>
      </Card>

      <ContributeForm request={request} onContribute={handleContribute} />
    </div>
  );
}
