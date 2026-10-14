import type * as React from "react";

export default function AboutPage(): React.ReactElement {
  return (
    <section className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">About StellarAid</h1>
      <p className="mt-4 text-muted-foreground">
        StellarAid is an open-source mutual aid network built on Stellar. It provides transparent
        tooling for giveaways, help requests, milestone-based contributions, and portable
        reputation, so support can flow to the people who need it with clear, verifiable records.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Principles</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>Transparency: every movement of funds is verifiable on-chain.</li>
        <li>Consent: recipients control what is shared publicly.</li>
        <li>Community: humans review and verify, contracts enforce the rules.</li>
      </ul>
    </section>
  );
}
