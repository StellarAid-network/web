"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { fetchGiveaways } from "@/lib/giveaways";
import { GiveawayCard } from "@/components/giveaways/GiveawayCard";
import { Gift, Plus } from "lucide-react";

export default function GiveawaysPage(): React.ReactElement {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = React.useState<string>("explore");

  const {
    data: giveaways = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["giveaways", address],
    queryFn: () => fetchGiveaways(address),
    staleTime: 30_000,
  });

  const exploreGiveaways = giveaways.filter((g) => g.status === "open");
  const createdGiveaways = address
    ? giveaways.filter((g) => g.creator.toLowerCase() === address.toLowerCase())
    : [];
  const claimableGiveaways = address
    ? giveaways.filter((g) =>
        g.claimants.some((c) => c.toLowerCase() === address.toLowerCase()),
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giveaways</h1>
          <p className="text-sm text-muted-foreground">
            Native claimable-balance distributions funding mutual aid and grants.
          </p>
        </div>
        <Link href="/giveaways/create">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Create giveaway
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="created">Created by me</TabsTrigger>
          <TabsTrigger value="claimable">For me</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/50 p-8 text-center">
            <p className="text-sm text-destructive">Failed to load giveaways.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : (
          <>
            <TabsContent value="explore" className="pt-4">
              {exploreGiveaways.length === 0 ? (
                <EmptyState
                  title="No open giveaways right now"
                  description="Be the first to distribute funds to community members!"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {exploreGiveaways.map((giveaway) => (
                    <GiveawayCard key={giveaway.id} giveaway={giveaway} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="created" className="pt-4">
              {!address ? (
                <EmptyState
                  title="Connect your wallet"
                  description="Connect your wallet to see giveaways created by you."
                />
              ) : createdGiveaways.length === 0 ? (
                <EmptyState
                  title="You haven't created any giveaways yet"
                  description="Create a native claimable balance to distribute tokens."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {createdGiveaways.map((giveaway) => (
                    <GiveawayCard key={giveaway.id} giveaway={giveaway} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="claimable" className="pt-4">
              {!address ? (
                <EmptyState
                  title="Connect your wallet"
                  description="Connect your wallet to check for claimable balances."
                />
              ) : claimableGiveaways.length === 0 ? (
                <EmptyState
                  title="No giveaways claimable for your account"
                  description="When someone sends you a claimable balance, it will appear here."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {claimableGiveaways.map((giveaway) => (
                    <GiveawayCard key={giveaway.id} giveaway={giveaway} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <div className="rounded-full bg-muted p-3">
        <Gift className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
