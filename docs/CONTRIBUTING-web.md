# Contributing to `@stellar-aid/web`

Thank you for helping build StellarAid's web application! Read [`README.md`](../README.md) first—the README is our specification.

## 1. Repository Boundaries & Hard Rules

1. **Wallet-only signing:** Never prompt for, accept, or store Stellar secret keys (`S...`) or seed phrases anywhere in `web`. Build unsigned XDRs with `@stellar-aid/sdk` and pass them to `signWalletTransaction` (`lib/wallet-kit.ts`).
2. **Never import from `api`:** Shared validation, formatting, and contract helpers come exclusively from `@stellar-aid/sdk`. HTTP types come from `lib/api-client/schema.d.ts` (regenerated via `pnpm gen:api`—never hand-edited).
3. **Server-only secrets:** `TURNSTILE_SECRET_KEY` and `IPFS_PINNING_JWT` may only be read in `lib/env.server.ts` and `app/api/**/route.ts`.
4. **Chain wins on money:** Optimistic UI updates after a transaction must always invalidate queries and reconcile against Soroban RPC / Horizon state.

## 2. Adding or Updating a Page / Component

1. **Server Components first:** Keep `app/**/page.tsx` as Server Components whenever possible; push interactive state into focused `"use client"` components under `components/<domain>/`.
2. **Semantic primitives:** Always render token amounts with `<Money>` (`components/ui/Money.tsx`), Stellar public keys with `<Address>` (`components/ui/Address.tsx`), and escrow progress with `<GoalProgress>`.
3. **Internationalization (`next-intl`):** Add new user-facing copy to `messages/en.json` rather than hard-coding English strings in JSX. Keep locale keys mirrored when contributing translations (`ha`, `yo`, `ig`, `fr`, `es`).
4. **Mobile-first & WCAG 2.1 AA:**
   - Design for a `360px` viewport first.
   - Maintain `>= 4.5:1` contrast on text/badges, visible `:focus-visible` outlines, explicit `<Label htmlFor>` bindings, and `prefers-reduced-motion` support.
   - Never rely on color alone to distinguish escrow states (`Open`, `Funded`, `Failed`, `Completed`).

## 3. Regenerating the OpenAPI Client

Whenever `api/openapi/openapi.json` changes:

```bash
pnpm gen:api
```

Commit the updated `lib/api-client/schema.d.ts` alongside any UI changes that consume the new fields.

## 4. Pre-PR Verification Checklist

Run every check locally before opening a pull request:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
PLAYWRIGHT_RUN=true pnpm test:e2e
```

Include desktop + `360px` mobile screenshots (or a short screen recording) in your PR description when modifying UI layouts.
