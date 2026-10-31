"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div
      role="alert"
      className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {error.message ||
          "We could not load this view. Your wallet keys and on-chain escrow funds remain safe on Stellar."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button type="button" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/safety">Safety guide</Link>
        </Button>
      </div>
    </div>
  );
}
