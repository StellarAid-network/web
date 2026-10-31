# `@stellar-aid/web` Contributor Issue Backlog

Ready-to-claim issues for outside contributors following the `v0.1.0-testnet` milestone. Each issue specifies labels, target files, and clear acceptance criteria.

---

### WEB-01: Complete Hausa (`ha`) locale translation catalog

- **Labels:** `good first issue`, `help wanted`, `i18n`
- **Files:** `messages/ha.json`, `lib/i18n.ts`, `tests/day6-social-trust.test.tsx`
- **Acceptance Criteria:**
  1. Translate every key in `messages/en.json` into natural Hausa in `messages/ha.json` while preserving ICU placeholders (`{count}`, `{visible}`, `{total}`).
  2. Add a unit test verifying `getLocaleMessages("ha")` contains zero missing keys compared to `messages/en.json`.

### WEB-02: Complete Yoruba (`yo`) and Igbo (`ig`) locale translation catalogs

- **Labels:** `good first issue`, `help wanted`, `i18n`
- **Files:** `messages/yo.json`, `messages/ig.json`, `tests/day6-social-trust.test.tsx`
- **Acceptance Criteria:**
  1. Populate `messages/yo.json` and `messages/ig.json` with complete key parity against `messages/en.json`.
  2. Verify pluralization and placeholder interpolation render without `next-intl` warnings.

### WEB-03: Complete French (`fr`) and Spanish (`es`) locale translation catalogs

- **Labels:** `good first issue`, `help wanted`, `i18n`
- **Files:** `messages/fr.json`, `messages/es.json`, `tests/day6-social-trust.test.tsx`
- **Acceptance Criteria:**
  1. Translate all keys from `messages/en.json` into `messages/fr.json` and `messages/es.json`.
  2. Add a key-parity check script or Vitest assertion covering all 5 target locales.

### WEB-04: Language switcher preference in `/settings`

- **Labels:** `good first issue`, `ui`, `i18n`
- **Files:** `app/(app)/settings/page.tsx`, `lib/i18n.ts`
- **Acceptance Criteria:**
  1. Add an accessible `<select>` or radio group on `/settings` allowing users to choose among available non-empty locales (`en` and any completed locale files).
  2. Persist the selection in a cookie read by `getLocaleMessages` and add a component test.

### WEB-05: Expand Playwright `axe-core` WCAG 2.1 AA scans to `/about`, `/settings`, and creation forms

- **Labels:** `good first issue`, `a11y`, `testing`
- **Files:** `e2e/social-and-a11y.spec.ts`
- **Acceptance Criteria:**
  1. Add `/about`, `/settings`, `/giveaways/create`, and `/requests/create` to the `axe-core` route table in `e2e/social-and-a11y.spec.ts`.
  2. Assert zero `serious` or `critical` violations in both light and dark themes.

### WEB-06: Skeleton loading states for `/requests` and `/giveaways` discovery grids

- **Labels:** `good first issue`, `ui`
- **Files:** `app/(app)/requests/loading.tsx`, `app/(app)/giveaways/loading.tsx`, `components/ui/skeleton.tsx`
- **Acceptance Criteria:**
  1. Add Next.js route `loading.tsx` files using `<Skeleton>` cards that match `RequestCard` and `GiveawayCard` dimensions to prevent layout shift (`CLS < 0.02`).
  2. Respect `prefers-reduced-motion: reduce`.

### WEB-07: Host static `public/.well-known/stellar.toml` template for testnet preview

- **Labels:** `help wanted`, `security`
- **Files:** `public/.well-known/stellar.toml`, `README.md`
- **Acceptance Criteria:**
  1. Provide a documented testnet `stellar.toml` template declaring `WEB_AUTH_ENDPOINT` and `SIGNING_KEY` placeholders matching `README.md` §16.
  2. Verify CORS headers in `vercel.json` and `next.config.ts` allow SEP-10 wallet discovery.

### WEB-08: In-app notification bell & unread drawer wired to `/notifications`

- **Labels:** `help wanted`, `ui`
- **Files:** `components/layout/site-header.tsx`, `components/social/NotificationBell.tsx`, `tests/notifications.test.tsx`
- **Acceptance Criteria:**
  1. Display unread count from `GET /notifications?unreadOnly=true` when signed in via SEP-10.
  2. Allow marking items read via `POST /notifications/:id/read` with keyboard-accessible dialog/popover navigation.

### WEB-09: Search bar UI wired to `GET /search?q=`

- **Labels:** `help wanted`, `ui`
- **Files:** `components/layout/site-header.tsx`, `app/(app)/feed/page.tsx`
- **Acceptance Criteria:**
  1. Add a debounced search input querying `GET /search?q=` and grouping results into Requests, Giveaways, and Profiles.
  2. Include empty-result copy, keyboard navigation, and unit tests.

### WEB-10: SEP-24 fiat on/off-ramp anchor discovery links (post-85)

- **Labels:** `post-85`, `help wanted`
- **Files:** `app/(app)/wallet/page.tsx`
- **Acceptance Criteria:**
  1. Follow an approved RFC defining SEP-24 interactive anchor URL handoff for converting local currency and USDC without custodying user funds.
