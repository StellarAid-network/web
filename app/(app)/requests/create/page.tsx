"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { createHelpRequest } from "@/lib/requests";
import {
  CreateRequestForm,
  type CreateRequestFormSubmitPayload,
} from "@/components/requests/CreateRequestForm";

const FALLBACK_CREATOR = "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ";

export default function CreateRequestPage(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address } = useWallet();

  const handleCreate = async (payload: CreateRequestFormSubmitPayload) => {
    const creator = address ?? FALLBACK_CREATOR;
    const created = await createHelpRequest({
      creator,
      recipient: creator,
      title: payload.title,
      description: payload.description,
      tags: payload.tags,
      media: payload.media,
      token: payload.token,
      goalStroops: payload.goalStroops,
      deadlineIso: payload.deadlineIso,
      milestones: payload.milestones,
    });

    await queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    router.push(`/requests/${created.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a Help Request</h1>
        <p className="text-sm text-muted-foreground">
          Deploy a non-custodial Soroban escrow with milestone verification and SHA-256 content
          integrity.
        </p>
      </div>

      <CreateRequestForm onSubmitRequest={handleCreate} />
    </div>
  );
}
