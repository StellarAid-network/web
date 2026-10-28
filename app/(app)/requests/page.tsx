"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HandHeart, Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHelpRequests, type HelpRequestFilterOptions } from "@/lib/requests";
import { RequestCard } from "@/components/requests/RequestCard";

type FilterTab = NonNullable<HelpRequestFilterOptions["status"]>;

export default function RequestsPage(): React.ReactElement {
  const [statusFilter, setStatusFilter] = React.useState<FilterTab>("All");
  const [tagFilter, setTagFilter] = React.useState<string>("");

  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["help-requests", statusFilter, tagFilter],
    queryFn: () =>
      fetchHelpRequests({
        status: statusFilter,
        tag: tagFilter,
      }),
    staleTime: 10_000,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help Requests</h1>
          <p className="text-sm text-muted-foreground">
            Milestone-verified mutual-aid fundraising backed by non-custodial Soroban escrow.
          </p>
        </div>

        <Link href="/requests/create">
          <Button className="w-full sm:w-auto gap-2" data-testid="create-request-link">
            <Plus className="h-4 w-4" />
            Create help request
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as FilterTab)}
          className="w-full md:w-auto"
        >
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Open">Open</TabsTrigger>
            <TabsTrigger value="NearingGoal">Nearing goal</TabsTrigger>
            <TabsTrigger value="EndingSoon">Ending soon</TabsTrigger>
            <TabsTrigger value="Funded">Funded</TabsTrigger>
            <TabsTrigger value="Failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by tag or title..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="pl-8"
            aria-label="Filter help requests by tag or title"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 p-8 text-center">
          <p className="text-sm text-destructive">Failed to load help requests.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <div className="rounded-full bg-muted p-3">
            <HandHeart className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-base font-semibold">No help requests match this filter</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try switching filters or create a new milestone-based help request.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="requests-grid">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
