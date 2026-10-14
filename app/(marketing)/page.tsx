import type * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Transparent giveaways",
    body: "Distribute funds with on-chain rules, verifiable claims, and public receipts.",
  },
  {
    title: "Community help requests",
    body: "Raise a request, gather verifiers, and let contributors fund milestones as they complete.",
  },
  {
    title: "Portable reputation",
    body: "Build a public, non-transferable track record of giving and receiving support.",
  },
] as const;

export default function LandingPage(): React.ReactElement {
  return (
    <div className="container flex flex-col gap-20 py-16 md:py-24">
      <section className="flex flex-col items-center text-center">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Built on Stellar Soroban
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          Community mutual aid, on-chain and accountable.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          StellarAid connects people who need help with people who can give, with transparent,
          verifiable flows for giveaways, requests, contributions, and reputation.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/feed">Explore the community</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">How it works</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
