import type * as React from "react";

export default function SafetyPage(): React.ReactElement {
  return (
    <section className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">Safety &amp; trust</h1>
      <p className="mt-4 text-muted-foreground">
        StellarAid is a coordination tool, not a custodian. Funds move directly between wallets
        through audited contracts. Before contributing, review the request, its verifiers, and its
        on-chain history.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Reporting</h2>
      <p className="mt-4 text-muted-foreground">
        Use the in-app report action on any post or request. Reports route to moderators who can
        hide content and flag accounts for review.
      </p>
    </section>
  );
}
