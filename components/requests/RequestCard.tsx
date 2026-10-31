"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Address } from "@/components/ui/Address";
import { GoalProgress } from "./GoalProgress";
import type { HelpRequestItem } from "@/lib/requests";

export interface RequestCardProps {
  request: HelpRequestItem;
}

export function RequestCard({ request }: RequestCardProps): React.ReactElement {
  return (
    <Card
      className="flex flex-col justify-between transition-shadow hover:shadow-md"
      data-testid={`request-card-${request.id}`}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Creator:</span>
          <Address value={request.creator} />
        </div>

        <CardTitle className="line-clamp-2 text-base">
          <Link href={`/requests/${request.id}`} className="hover:underline">
            {request.title}
          </Link>
        </CardTitle>

        <p className="line-clamp-2 text-xs text-muted-foreground">{request.description}</p>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <GoalProgress
          raised={request.raised}
          goal={request.goal}
          token={request.token}
          status={request.status}
          deadline={request.deadline}
          compact
        />

        {request.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {request.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[11px] font-normal">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {request.milestones.length} milestone{request.milestones.length === 1 ? "" : "s"}
        </span>

        <Link href={`/requests/${request.id}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
