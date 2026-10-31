# Web Mobile Performance & Accessibility Baselines (`v0.1.0-testnet`)

This document records mobile Core Web Vitals, JavaScript payload separation, and WCAG 2.1 AA accessibility verification for `@stellar-aid/web` (`Next.js 16.4.3` production build).

## 1. Methodology

- **Build:** `pnpm build && pnpm start` (production static & dynamic App Router bundles).
- **Device & Throttling:** Headless Chromium emulating **Pixel 5** (`393×851`, mobile user-agent, touch enabled) with **4x CPU throttling** via Chrome DevTools Protocol (`Emulation.setCPUThrottlingRate`).
- **Metrics Collected:** Time to First Byte (`TTFB`), First Contentful Paint (`FCP`), Largest Contentful Paint (`LCP`), `DOMContentLoaded` (`DCL`), Cumulative Layout Shift (`CLS`), and uncompressed JS payload size.

## 2. Mobile Route Measurements

| Route                                         | Render Mode        | TTFB (ms) | FCP (ms) | LCP (ms) | DCL (ms) |    CLS | Uncompressed JS (KB) |
| --------------------------------------------- | ------------------ | --------: | -------: | -------: | -------: | -----: | -------------------: |
| `/` (Landing)                                 | Static (`○`)       |        16 |      300 |      300 |      281 | 0.0000 |                  876 |
| `/feed` (Social feed + virtualized list)      | Static shell (`○`) |         8 |      224 |      224 |      230 | 0.0000 |                  961 |
| `/requests/1` (Help request + Soroban escrow) | Dynamic (`ƒ`)      |       505 |      728 |      728 |      737 | 0.0000 |                1,982 |
| `/giveaways/[id]/claim` (Turnstile + claim)   | Dynamic (`ƒ`)      |        34 |      280 |      280 |      145 | 0.0000 |                1,929 |
| `/safety` (Safety & trust guide)              | Static (`○`)       |        22 |      244 |      244 |      304 | 0.0000 |                  876 |

### Key Observations

1. **All Core Web Vitals within mobile "Good" budgets:** Every audited route achieves `LCP <= 728 ms` (budget `< 2,500 ms`) and `CLS = 0.0000` (budget `< 0.10`) under 4x mobile CPU throttling.
2. **Code-splitting of Stellar / Soroban XDR libraries:** Marketing (`/`, `/safety`) and social (`/feed`) routes do not pull `@stellar/stellar-sdk` XDR builders into their initial bundles (`876–961 KB` uncompressed / `~245–270 KB` gzip/brotli). Contract and claimable-balance routes (`/requests/[id]`, `/giveaways/[id]/claim`) load the Stellar SDK chunks only when needed.
3. **Long-feed virtualization:** `FeedTimeline` renders posts inside a bounded scroll window (`VirtualizedPostList`) when timelines exceed 25 items, keeping DOM node counts flat on low-memory mobile devices.
4. **IPFS media optimization:** Remote avatars and post attachments render through `next/image` restricted to allowlisted HTTPS IPFS gateways (`next.config.ts`).

## 3. Automated WCAG 2.1 AA (`axe-core`) Audit

`e2e/social-and-a11y.spec.ts` runs `@axe-core/playwright` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) across `/`, `/safety`, `/feed`, `/giveaways`, `/requests`, `/requests/1`, and `/profile/[address]`:

- **Serious / Critical violations:** `0` across all audited routes.
- **Landmarks & Keyboard:** Skip-to-content link (`#main-content`), labeled `<nav>`, focus-trapped Radix dialogs, `:focus-visible` outlines, and `@media (prefers-reduced-motion: reduce)` transitions verified.
