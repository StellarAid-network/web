"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Address } from "@/components/ui/Address";
import { Money } from "@/components/ui/Money";
import type { GiveawayItem } from "@/lib/giveaways";
import { Clock, Users } from "lucide-react";

interface GiveawayCardProps {
  giveaway: GiveawayItem;
}

export function GiveawayCard({ giveaway }: GiveawayCardProps): React.ReactElement {
  const isExpired =
    giveaway.status === "expired" ||
    (giveaway.expiresAt && new Date(giveaway.expiresAt).getTime() < Date.now());

  const statusVariant = isExpired
    ? "destructive"
    : giveaway.status === "claimed"
      ? "secondary"
      : "default";

  // Convert amount string to stroops (bigint) for Money component
  const [whole = "0", frac = ""] = giveaway.amountPerClaim.split(".");
  const stroops = BigInt(whole) * 10_000_000n + BigInt(frac.padEnd(7, "0").slice(0, 7));

  return (
    <Link href={`/giveaways/${giveaway.id}`} className="block focus:outline-none">
      <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            {giveaway.title ?? `${giveaway.asset.code} Giveaway`}
          </CardTitle>
          <Badge variant={statusVariant} className="capitalize">
            {isExpired ? "Expired" : giveaway.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Per claim:</span>
            <span className="text-lg font-bold">
              <Money value={stroops} asset={giveaway.asset.code} />
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>By:</span>
              <Address value={giveaway.creator} />
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {giveaway.claimants.length} claimer{giveaway.claimants.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {giveaway.expiresAt && (
            <div className="flex items-center gap-1 border-t pt-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires {new Date(giveaway.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
