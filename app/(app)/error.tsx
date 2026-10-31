"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppSegmentErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div
      role="alert"
      className="container flex min-h-[55vh] max-w-lg flex-col items-center justify-center gap-4 py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Unable to load this screen</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {error.message ||
          "The Stellar RPC or off-chain API may be temporarily unreachable. Any escrowed funds remain unaffected on-chain."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button type="button" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
        <Button asChild variant="outline">
          <Link href="/feed">Go to feed</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/safety">Safety &amp; refunds</Link>
        </Button>
      </div>
    </div>
  );
}
