# 🖥 stellar-aid / web

**The StellarAid web app: connect a Stellar wallet, create giveaways, post and fund help requests, and take part in community mutual aid.**

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Project structure](#project-structure)
8. [Key flows](#key-flows)
9. [Wallet integration](#wallet-integration)
10. [Talking to the API and the chain](#talking-to-the-api-and-the-chain)
11. [Anti-abuse](#anti-abuse)
12. [Styling and design system](#styling-and-design-system)
13. [Accessibility and internationalization](#accessibility-and-internationalization)
14. [Scripts](#scripts)
15. [Testing](#testing)
16. [Deployment](#deployment)
17. [Performance and security](#performance-and-security)
18. [Troubleshooting](#troubleshooting)
19. [Contributing](#contributing)
20. [License](#license)

---

## Features

| Area | What users can do |
|---|---|
| **Wallet** | Connect Freighter, xBull, Albedo, and others via Stellar Wallets Kit. Switch accounts and networks. |
| **Giveaways** | Create giveaways (first come or time-limited), browse open giveaways, claim with anti-bot checks. |
| **Help requests** | Post a need with a goal, deadline, and milestones. Contribute through escrow. Track progress. Request a refund when a goal fails. |
| **Donations** | Send direct tips to any profile. |
| **Social** | Profiles, avatars, bios, feed, comments, follows. |
| **Trust** | Reputation badges, verified-need attestations, report content, public contribution history. |
| **Money in/out** | Links to SEP-24 anchor flows for converting local currency and USDC *(Phase 5)*. |

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query |
| Client state | Zustand (wallet, session, UI) |
| Forms and validation | React Hook Form + zod |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| Chain access | `@stellar-aid/sdk` (wraps `@stellar/stellar-sdk`) |
| Backend | [`api`](https://github.com/StellarAid-network/api) through a generated, typed OpenAPI client |
| Bot protection | Cloudflare Turnstile |
| Tests | Vitest, Testing Library, Playwright |
| Hosting | Vercel |
| Monitoring | Sentry |

---

## Architecture

```
┌────────────────────────── web (Next.js) ──────────────────────────┐
│                                                                   │
│  UI components ──► hooks ──► TanStack Query ──┬──► api client ──► api
│        │                                      │                   │
│        │                                      └──► @stellar-aid/sdk ──► Horizon / Soroban RPC
│        ▼                                                          │
│  Zustand (wallet) ──► Wallets Kit ──► user's wallet (signing)     │
│                                                                   │
│  Route handlers (server): IPFS upload · Turnstile verify · SEP-10 │
└───────────────────────────────────────────────────────────────────┘
```

Principles:

- **The wallet signs, the app never sees keys.** All money movement is an unsigned XDR built by the SDK and signed in the user's wallet.
- **Reads come from two places:** the API (feed, profiles, search) and the chain via the SDK (live balances, escrow state). The chain wins any disagreement about money.
- **Server-only secrets** (IPFS key, Turnstile secret) live in Next.js route handlers, never in client code.
- `web` imports shared logic **only** from `@stellar-aid/sdk`. It never imports from `api`.

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- A Stellar wallet extension such as [Freighter](https://www.freighter.app/), set to **Testnet**
- A running [`api`](https://github.com/StellarAid-network/api) instance (local or hosted), unless using the mock mode below

---

## Getting started

```bash
git clone https://github.com/StellarAid-network/web.git
cd web
pnpm install

cp .env.example .env.local
# edit .env.local (see the next section)

pnpm dev
```

Open <http://localhost:3000>.

**Fund a testnet account:** switch Freighter to Testnet, copy your address, and fund it with [Friendbot](https://lab.stellar.org/account/fund).

**Add a USDC trustline** (testnet) from the in-app *Wallet → Assets* screen before receiving USDC.

### Running without the API (mock mode)

For frontend-only work on giveaways and donations (these need only the SDK):

```bash
NEXT_PUBLIC_API_MODE=mock pnpm dev
```

Mock mode serves fixture data for the feed and profiles. On-chain features still use the real testnet.

### Using a local SDK build

```bash
# in ../sdk
pnpm build && pnpm link --global
# in web/
pnpm link --global @stellar-aid/sdk
```

---

## Environment variables

Copy `.env.example` to `.env.local`. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. **Never put secrets in them.**

| Variable | Scope | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_STELLAR_NETWORK` | client | ✅ | `testnet`, `mainnet`, or `local` |
| `NEXT_PUBLIC_RPC_URL` | client | ➖ | Soroban RPC override (defaults from SDK) |
| `NEXT_PUBLIC_HORIZON_URL` | client | ➖ | Horizon override (defaults from SDK) |
| `NEXT_PUBLIC_API_URL` | client | ✅ | Base URL of the `api` service |
| `NEXT_PUBLIC_API_MODE` | client | ➖ | `live` (default) or `mock` |
| `NEXT_PUBLIC_APP_URL` | client | ✅ | Public URL of this app (SEP-10 home domain, links) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | client | ✅ | Cloudflare Turnstile site key |
| `NEXT_PUBLIC_SENTRY_DSN` | client | ➖ | Sentry DSN |
| `TURNSTILE_SECRET_KEY` | **server** | ✅ | Turnstile verification secret |
| `IPFS_PINNING_JWT` | **server** | ✅ | Pinata (or similar) API token for media uploads |
| `IPFS_GATEWAY_URL` | server | ➖ | Gateway used to render media |
| `SENTRY_AUTH_TOKEN` | **server / CI** | ➖ | Source map upload |

---

## Project structure

```
web/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Landing, about, safety guide
│   ├── (app)/
│   │   ├── feed/                 # Social feed
│   │   ├── giveaways/            # List, detail, create, claim
│   │   ├── requests/             # Help requests: list, detail, create, contribute
│   │   ├── profile/[address]/    # Public profiles
│   │   ├── wallet/               # Balances, trustlines, history
│   │   └── settings/
│   ├── api/                      # Route handlers (server-only secrets)
│   │   ├── upload/               # IPFS upload proxy
│   │   ├── turnstile/            # Bot-check verification
│   │   └── auth/                 # SEP-10 relay to the api
│   ├── layout.tsx
│   └── providers.tsx             # Query, wallet, theme providers
├── components/
│   ├── ui/                       # shadcn/ui primitives + Money, Address
│   ├── wallet/                   # ConnectButton, NetworkBadge, NetworkMismatchBanner
│   ├── giveaways/                # CreateGiveawayForm, GiveawayCard, GiveawayReviewModal, EligibilityChecklist
│   ├── requests/                 # GoalProgress, MilestoneList, ContributeForm, CreateRequestForm, RequestCard
│   ├── social/                   # FeedTimeline, PostCard, CommentThread, ProfileView, ReportDialog
│   └── trust/                    # ReputationBadge, AttestationChip
├── hooks/                        # use-wallet, use-session, use-toast
├── lib/
│   ├── stellar.ts                # SDK instance and config
│   ├── api-client/               # Generated OpenAPI client (do not edit)
│   ├── wallet-kit.ts             # Wallets Kit setup
│   ├── i18n.ts                   # next-intl message loader (messages/*.json)
│   ├── sanitize.ts               # Safe text / URL sanitization helpers
│   ├── giveaways.ts              # Claimable-balance & eligibility helpers
│   ├── requests.ts               # Help request & Soroban simulation helpers
│   ├── social.ts                 # Feed, profile, comment, and report fetchers
│   └── format.ts                 # Amounts, dates, addresses
├── messages/                     # Locale catalogs (en complete; ha, yo, ig, fr, es targets)
├── docs/                         # performance.md, CONTRIBUTING-web.md, backlog.md
├── stores/                       # Zustand stores
├── styles/
├── public/
├── e2e/                          # Playwright + axe-core WCAG 2.1 AA tests
├── tests/                        # Vitest tests
├── vercel.json                   # Vercel preview/production deployment config
├── .env.example
└── next.config.ts
```

---

## Key flows

### Create a giveaway

1. User fills the form (asset, amount per claim, claimers or a first-come cap, window).
2. The app runs `evaluateEligibility` and balance checks, then shows a **review screen**: total locked, expiry, and what happens to unclaimed funds.
3. `sdk.giveaways.buildCreate` returns an unsigned transaction.
4. Wallet signs, the app submits, and shows a confirmation with the explorer link.
5. The giveaway appears in the feed once indexed. The page also reads directly from Horizon, so it shows up immediately for the creator.

### Claim a giveaway

1. Turnstile challenge passes (server verified).
2. App checks eligibility (account age, minimum balance, optional reputation threshold).
3. Ensure a **trustline** exists for the asset. If not, the app offers a combined change-trust and claim transaction.
4. Wallet signs, and the claim is submitted.

### Fund a help request

1. Request page reads escrow state from the contract (goal, raised, deadline, milestones).
2. Contribution form validates amount and balance, and shows the **refund policy** in plain language.
3. SDK simulates the Soroban call, so fees and errors are shown **before** the wallet prompt.
4. After submission, progress updates optimistically and then reconciles with chain state.

### Refund after a failed goal

If a request failed, contributors see a **Claim refund** button that calls `refund`. The UI explains the status and never hides it.

---

## Wallet integration

- Setup lives in `lib/wallet-kit.ts` using Stellar Wallets Kit with the modules you enable (Freighter, xBull, Albedo, Lobstr, and so on).
- The kit's selected network **must match** `NEXT_PUBLIC_STELLAR_NETWORK`. The app blocks actions and shows a clear banner on mismatch.
- **Sign-in:** the app requests a SEP-10 challenge from the API, the wallet signs it, and the API returns a short-lived session token (stored in an httpOnly cookie via a route handler).
- Signing requests include **human-readable context** in the UI before the wallet opens, so users know what they are approving.

---

## Talking to the API and the chain

**API client:** generated from the API's OpenAPI spec.

```bash
pnpm gen:api     # fetches the spec from NEXT_PUBLIC_API_URL and regenerates lib/api-client
```

**Chain reads:** use SDK functions inside TanStack Query hooks with appropriate `staleTime` (short for balances, longer for historical data).

**Cache rules**

- Feed and profiles: cached, revalidated on focus.
- Escrow balances and request state: short staleTime plus refetch after any submitted transaction.
- After a transaction, invalidate related queries, and don't trust only optimistic state.

---

## Anti-abuse

| Layer | Mechanism |
|---|---|
| Bots | Cloudflare Turnstile, verified in a server route before the app builds a claim |
| Sybil | SDK eligibility rules: minimum account age, minimum balance, optional reputation threshold |
| Spam | API rate limits, report flow, hidden-content states in the UI |
| Scams | Request pages show escrow rules, attestations, reputation, and creator history prominently |
| Phishing | Strict CSP, verified domain banner, never ask for secret keys. The app only uses wallet signing |

---

## Styling and design system

- Tailwind with design tokens defined in `tailwind.config.ts` and CSS variables for light and dark themes.
- shadcn/ui primitives are copied into `components/ui` and customized there.
- Mobile-first: most users will be on phones, and every screen is designed for ~360px width first.
- Use semantic components (`<Money>`, `<Address>`, `<GoalProgress>`) rather than ad hoc formatting, so amounts and addresses render consistently.

---

## Accessibility and internationalization

- Target **WCAG 2.1 AA**: keyboard navigation, focus states, labels, sufficient contrast, and reduced-motion support.
- Do not rely on color alone to convey state (for example funded vs failed).
- i18n via `next-intl`, with message files in `messages/<locale>.json`. English first, with Hausa, Yoruba, Igbo, French, and Spanish as early targets.
- Format currency, dates, and numbers by locale. Keep **on-chain precision** (7 decimals) in tooltips and details.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm test` | Vitest unit and component tests |
| `pnpm test:e2e` | Playwright end-to-end & `axe` accessibility tests (`PLAYWRIGHT_RUN=true pnpm test:e2e`) |
| `pnpm gen:api` | Regenerate the API client |
| `pnpm analyze` | Bundle analysis |

---

## Testing

- **Unit and component** (Vitest + Testing Library): formatting, hooks, forms, and components with a mocked SDK.
- **End-to-end** (Playwright): core journeys against testnet or a local quickstart, using a **test wallet adapter** that signs with a throwaway key so tests never need a browser extension.
  - Connect wallet, create giveaway, claim giveaway
  - Create request, contribute, goal failed, refund
- **Visual and accessibility checks**: `axe` assertions in Playwright for key pages.

```bash
pnpm test
pnpm test:e2e
```

---

## Deployment

**Hosting:** Vercel, with two projects: `web-testnet` and `web-mainnet`.

| Environment | Branch | Network |
|---|---|---|
| Preview | every PR | testnet |
| Staging | `main` | testnet |
| Production | tagged release | mainnet |

Checklist before a production release:

- [ ] `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` and matching SDK version
- [ ] Contract addresses in the SDK match `contracts/deployments/mainnet.json`
- [ ] CSP and security headers verified
- [ ] Turnstile and IPFS keys set as server-only secrets
- [ ] Sentry source maps uploaded
- [ ] Domain verified and `stellar.toml` hosted (for SEP-10 home domain)

Hosting `/.well-known/stellar.toml` (with CORS enabled) is required for SEP-10 and anchor integrations.

---

## Performance and security

**Performance**

- Server Components by default, and client components only where interaction needs them.
- Subpath SDK imports so server-only code never reaches the client bundle.
- Images through `next/image` with IPFS gateway allowlisting.
- Paginate and virtualize long feeds (see [docs/performance.md](./docs/performance.md) for mobile Core Web Vitals baselines).

**Security**

- Strict Content Security Policy and standard security headers set in `next.config.ts`.
- No secret keys anywhere in the app. All signing happens in the wallet.
- Sanitize all user-generated content, and render markdown safely.
- Verify Turnstile tokens and rate-limit upload routes.
- Dependencies are monitored by Dependabot or Renovate.

Report vulnerabilities privately: [SECURITY.md](https://github.com/StellarAid-network/.github/blob/main/SECURITY.md).

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| "Wrong network" banner | Wallet is on a different network than `NEXT_PUBLIC_STELLAR_NETWORK`. Switch the wallet. |
| Transaction fails with `op_no_trust` | Recipient or claimer lacks a trustline for the asset. Add one first. |
| Account not found | Account is unfunded. Use Friendbot on testnet. |
| Simulation error on contribute | Check balance, deadline, and token allowlist. The error message maps to a contract error. |
| Feed missing a new item | Indexer has not caught up yet. Wait a few seconds or check the API health endpoint. |
| CORS errors from the API | Ensure `api` allows this origin in its `CORS_ORIGINS` setting. |
| Wallet popup never appears | Extension locked or blocked by the browser. Unlock it and retry. |

---

## Contributing

1. Pick an issue from [docs/backlog.md](./docs/backlog.md) or open one. UI changes should include screenshots or a short recording.
2. Branch from `main`, and keep PRs focused.
3. Run `pnpm lint && pnpm typecheck && pnpm test` before pushing.
4. Follow Conventional Commits and the PR template.
5. Changes that need a new SDK or API capability should link the related PR in that repo.

See [docs/CONTRIBUTING-web.md](./docs/CONTRIBUTING-web.md) and the org [Contributing guide](https://github.com/StellarAid-network/.github/blob/main/CONTRIBUTING.md).

---

## License

MIT. See [LICENSE](./LICENSE).
