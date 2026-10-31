import type * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, EyeOff, Lock, ShieldCheck, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Safety & Trust Guide",
  description:
    "How StellarAid protects contributors and recipients with non-custodial Soroban escrow, wallet-only signing, and transparent attestations.",
};

export default function SafetyPage(): React.ReactElement {
  return (
    <article className="container max-w-3xl space-y-10 py-12">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Non-Custodial Mutual Aid
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Safety &amp; trust guide</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          StellarAid is an open coordination tool, never a custodian. Funds move directly between
          your Stellar wallet and audited-style Soroban smart contracts or protocol-native claimable
          balances. Read these rules before signing any transaction.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Core safety rules">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2>1. Never share your secret key</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            StellarAid will <strong>never</strong> ask for a 56-character <code>S...</code> secret
            key or recovery phrase. Anyone asking for your seed phrase in comments, DMs, or external
            links is running a scam.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2>2. Read every wallet prompt</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Before approving in Freighter, xBull, or Albedo, confirm the network badge matches{" "}
            <strong>Testnet</strong> (or Mainnet once launched), verify the token amount, and match
            the contract address against published deployments.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          How escrow &amp; refunds protect contributors
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>
              <strong>All-or-nothing funding goal:</strong> Contributions to a Help Request stay
              locked in the on-chain <code>help_request</code> contract until the goal is reached
              before the deadline.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>
              <strong>Guaranteed on-chain refunds:</strong> If a request misses its deadline, is
              cancelled by its creator, or enters a disputed state with unreleased funds, every
              contributor can claim their proportional refund directly from the contract—even if the
              StellarAid website is offline.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>
              <strong>Milestone verification:</strong> Funded requests release funds per milestone
              only after configured community verifiers submit on-chain approvals.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>
              <strong>Time-bounded giveaways:</strong> Unclaimed giveaway balances automatically
              become reclaimable by the creator once the expiry window passes.
            </span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Evaluating requests before you give
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Check three public signals on every{" "}
          <Link href="/requests" className="font-medium text-primary underline underline-offset-4">
            Help Request
          </Link>{" "}
          and{" "}
          <Link href="/feed" className="font-medium text-primary underline underline-offset-4">
            Community Profile
          </Link>
          :
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong>Verified-need attestations:</strong> Look for non-expired{" "}
            <code>verified_need</code> chips signed on-chain by trusted NGOs or community verifiers.
          </li>
          <li>
            <strong>Content-hash integrity:</strong> If off-chain text was edited without matching
            the SHA-256 hash committed on-chain, the app displays an explicit tamper warning.
          </li>
          <li>
            <strong>Portable reputation history:</strong> Inspect the creator&apos;s past completed
            milestones, giveaways, and account age on Stellar Explorer.
          </li>
        </ol>
      </section>

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
          <EyeOff className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h2>What moderators can—and cannot—do</h2>
        </div>
        <div className="mt-3 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
          <div>
            <p className="font-semibold text-foreground">Moderators CAN:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Review community reports in an audited queue.</li>
              <li>
                Hide abusive, fraudulent, or spam posts, comments, and off-chain descriptions.
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Moderators can NEVER:</p>
            <ul className="mt-1 list-disc space-y-1 text-muted-foreground">
              <li>Move, confiscate, redirect, or freeze escrowed funds.</li>
              <li>
                Block contributors from calling <code>refund</code> on-chain.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t pt-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Reporting scams or security vulnerabilities</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use the <strong>Report</strong> button on any post, comment, help request, or profile to
          alert moderators to impersonation, phishing links, or fabricated evidence. Found a
          software or smart-contract vulnerability? Do not open a public issue—follow our{" "}
          <a
            href="https://github.com/StellarAid-network/.github/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            private security disclosure policy
          </a>
          .
        </p>
      </section>
    </article>
  );
}
