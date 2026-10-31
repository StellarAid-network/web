import * as fs from "node:fs";
import * as path from "node:path";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wallet-kit", () => ({
  connectWallet: vi
    .fn()
    .mockResolvedValue("GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ"),
  disconnectWallet: vi.fn().mockResolvedValue(undefined),
  getWalletAddress: vi
    .fn()
    .mockResolvedValue("GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ"),
  getWalletKitNetwork: vi.fn().mockResolvedValue({
    network: "TESTNET",
    networkPassphrase: "Test SDF Network ; September 2015",
  }),
  signWalletTransaction: vi.fn().mockResolvedValue("SIGNED_XDR"),
}));

import { PostCard } from "@/components/social/PostCard";
import { VirtualizedPostList } from "@/components/social/FeedTimeline";
import { AttestationChip } from "@/components/trust/AttestationChip";
import { ReputationBadge } from "@/components/trust/ReputationBadge";
import { getReputationScore } from "@/lib/giveaways/eligibility";
import { getLocaleMessages, SUPPORTED_LOCALES } from "@/lib/i18n";
import { DEMO_ADDRESS_ALICE, DEMO_ADDRESS_AMINA, type SocialPost } from "@/lib/mock/social";
import { escapeHtml, ipfsCidToUrl, safeExternalUrl, sanitizeUserText } from "@/lib/sanitize";
import { SECURITY_HEADERS } from "../next.config";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <NextIntlClientProvider locale="en" messages={getLocaleMessages("en")} timeZone="UTC">
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("Day 6 Web: Sanitization, CSP, and Secret Isolation", () => {
  it("strips script/style/HTML tags and rejects dangerous URL schemes", () => {
    const raw = `Hello <script>alert("xss")</script><b>community</b>!`;
    expect(sanitizeUserText(raw)).toBe("Hello community!");
    expect(escapeHtml(`<img src=x onerror="1">`)).toBe("&lt;img src=x onerror=&quot;1&quot;&gt;");

    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>1</script>")).toBeNull();
    expect(safeExternalUrl("https://stellar.org/foundation")).toBe(
      "https://stellar.org/foundation",
    );

    expect(ipfsCidToUrl("not-a-valid-cid/../../etc")).toBeNull();
    expect(ipfsCidToUrl("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")).toBe(
      "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    );
  });

  it("configures strict CSP and standard security headers in next.config.ts", () => {
    const headerMap = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));
    const csp = headerMap.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("provides complete English messages and scaffolding for all planned locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "ha", "yo", "ig", "fr", "es"]);
    for (const locale of SUPPORTED_LOCALES) {
      const filePath = path.resolve(__dirname, `../messages/${locale}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
      const msgs = getLocaleMessages(locale);
      expect(msgs.feed.title).toBe("Community feed");
      expect(msgs.report.submit).toBe("Submit report");
    }
  });
});

describe("Day 6 Web: Trust Badges, Hidden Placeholders, and Feed Virtualization", () => {
  it("renders ReputationBadge and AttestationChip with accessible labels", () => {
    renderWithProviders(
      <div>
        <ReputationBadge score={82} />
        <AttestationChip kind="verified_need" attestor={DEMO_ADDRESS_AMINA} />
      </div>,
    );

    expect(screen.getByTestId("reputation-badge")).toHaveTextContent("Reputation 82");
    expect(screen.getByTestId("reputation-badge")).toHaveTextContent("Community steward");
    expect(screen.getByTestId("attestation-chip")).toHaveTextContent("Verified need");
  });

  it("renders sanitized visible posts and hidden-content moderation placeholders", () => {
    const visiblePost: SocialPost = {
      id: "p-vis",
      author: DEMO_ADDRESS_ALICE,
      body: "Safe update <script>evil()</script> #aid",
      mediaHashes: [],
      status: "VISIBLE",
      createdAt: "2025-02-20T12:00:00.000Z",
      authorProfile: { displayName: "Adaeze", avatarHash: null },
      commentsCount: 1,
    };
    const hiddenPost: SocialPost = {
      ...visiblePost,
      id: "p-hid",
      body: "Hidden spam link",
      status: "HIDDEN",
    };

    renderWithProviders(
      <div>
        <PostCard post={visiblePost} />
        <PostCard post={hiddenPost} />
      </div>,
    );

    expect(screen.getByTestId("post-card")).toHaveTextContent("Safe update #aid");
    expect(screen.getByTestId("post-card")).not.toHaveTextContent("evil()");
    expect(screen.getByTestId("hidden-post-placeholder")).toHaveTextContent(
      "hidden by community moderators",
    );
    expect(screen.queryByText("Hidden spam link")).not.toBeInTheDocument();
  });

  it("virtualizes long feeds so only a bounded window of PostCards mounts in the DOM", () => {
    const manyPosts: SocialPost[] = Array.from({ length: 40 }, (_, i) => ({
      id: `post-many-${i}`,
      author: DEMO_ADDRESS_ALICE,
      body: `Community update item #${i}`,
      mediaHashes: [],
      status: "VISIBLE",
      createdAt: "2025-02-20T12:00:00.000Z",
      authorProfile: { displayName: "Adaeze", avatarHash: null },
      commentsCount: 0,
    }));

    renderWithProviders(<VirtualizedPostList posts={manyPosts} />);
    expect(screen.getByTestId("virtualized-feed-viewport")).toBeInTheDocument();
    const renderedCards = screen.getAllByTestId("post-card");
    expect(renderedCards.length).toBeLessThan(manyPosts.length);
  });
});

describe("Day 6 Web: Live Reputation Lookup in Giveaway Eligibility", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("queries /reputation/:address from the API instead of returning a hardcoded stub", async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(`/reputation/${DEMO_ADDRESS_ALICE}`)) {
        return Promise.resolve(
          new Response(JSON.stringify({ address: DEMO_ADDRESS_ALICE, score: 91 }), {
            status: 200,
          }),
        );
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const score = await getReputationScore(DEMO_ADDRESS_ALICE);
    expect(score).toBe(91);
  });
});
