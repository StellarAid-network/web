import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createVerifiedToken,
  verifyClaimToken,
  POST as turnstileHandler,
} from "@/app/api/turnstile/route";
import {
  POST as uploadHandler,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/app/api/upload/route";
import { checkGiveawayEligibility, getReputationScore } from "@/lib/giveaways/eligibility";
import type { GiveawayItem } from "@/lib/giveaways";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Day 4 Features: Turnstile Verification & Security", () => {
  const secretKey = "1x0000000000000000000000000000000AA";

  it("creates and verifies cryptographic claim tokens", () => {
    const token = createVerifiedToken(secretKey);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(2);

    // Verify valid token
    const isValid = verifyClaimToken(token, secretKey);
    expect(isValid).toBe(true);

    // Invalid secret
    expect(verifyClaimToken(token, "wrong_secret_key")).toBe(false);

    // Tampered token
    const tampered = token.slice(0, -3) + "xyz";
    expect(verifyClaimToken(tampered, secretKey)).toBe(false);
  });

  it("handles Turnstile verification API requests", async () => {
    // 1. Missing token -> 400
    const reqEmpty = new NextRequest("http://localhost:3000/api/turnstile", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const resEmpty = await turnstileHandler(reqEmpty);
    expect(resEmpty.status).toBe(400);

    // 2. Valid test token -> 200 with verifiedToken
    const reqValid = new NextRequest("http://localhost:3000/api/turnstile", {
      method: "POST",
      body: JSON.stringify({ token: "test-turnstile-token" }),
    });
    const resValid = await turnstileHandler(reqValid);
    expect(resValid.status).toBe(200);
    const dataValid = (await resValid.json()) as { success: boolean; verifiedToken: string };
    expect(dataValid.success).toBe(true);
    expect(verifyClaimToken(dataValid.verifiedToken, secretKey)).toBe(true);
  });
});

describe("Day 4 Features: IPFS Upload Route Skeleton", () => {
  it("enforces allowed MIME types and file limits", () => {
    expect(ALLOWED_MIME_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/png")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/webp")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("application/pdf")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("text/html")).toBe(false);
    expect(ALLOWED_MIME_TYPES.has("application/javascript")).toBe(false);

    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it("validates upload requests", async () => {
    // 1. Missing file -> 400
    const reqEmpty = {
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
      formData: async () => ({ get: () => null }),
    } as unknown as NextRequest;
    const resEmpty = await uploadHandler(reqEmpty);
    expect(resEmpty.status).toBe(400);

    // 2. Unsupported file type -> 400
    const reqBad = {
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
      formData: async () => ({
        get: (key: string) =>
          key === "file"
            ? {
                type: "text/javascript",
                size: 100,
                arrayBuffer: async () => new ArrayBuffer(100),
              }
            : null,
      }),
    } as unknown as NextRequest;
    const resBad = await uploadHandler(reqBad);
    expect(resBad.status).toBe(400);
    const badJson = (await resBad.json()) as { error: string };
    expect(badJson.error).toContain("Unsupported file type");

    // 3. Valid image -> 200 with deterministic CID
    const reqValid = {
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
      formData: async () => ({
        get: (key: string) =>
          key === "file"
            ? {
                type: "image/png",
                size: 200,
                arrayBuffer: async () => new Uint8Array([137, 80, 78, 71, 1, 2, 3]).buffer,
              }
            : null,
      }),
    } as unknown as NextRequest;
    const resValid = await uploadHandler(reqValid);
    expect(resValid.status).toBe(200);
    const validJson = (await resValid.json()) as { success: boolean; cid: string; url: string };
    expect(validJson.success).toBe(true);
    expect(validJson.cid).toMatch(/^bafybeig/);
    expect(validJson.url).toContain(validJson.cid);
  });
});

describe("Day 4 Features: Giveaway Eligibility & Reputation", () => {
  const sampleGiveaway: GiveawayItem = {
    id: "00000000abc123",
    creator: "GCFGKLCBV5IGJYGRR7FJNU53HFV5674PMQNNJT6HRAFGUAHZ7V3ZELXR",
    asset: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
    amount: "100.00",
    amountPerClaim: "10.00",
    claimants: ["GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ"],
    status: "open",
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/accounts/GB_UNFUNDED")) {
        return Promise.resolve(new Response(null, { status: 404, statusText: "Not Found" }));
      }
      if (url.includes("/operations")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              _embedded: {
                records: [{ created_at: "2024-01-01T00:00:00Z" }],
              },
            }),
            { status: 200 },
          ),
        );
      }
      if (url.includes("/accounts/")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              balances: [
                { asset_type: "native", balance: "25.0000000" },
                {
                  asset_type: "credit_alphanum4",
                  asset_code: "USDC",
                  asset_issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
                  balance: "100.00",
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      return originalFetch(input);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("evaluates eligibility correctly for funded account", async () => {
    const report = await checkGiveawayEligibility(
      "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
      sampleGiveaway,
    );

    expect(report.eligible).toBe(true);
    expect(report.accountAgeEligible).toBe(true);
    expect(report.balanceEligible).toBe(true);
    expect(report.needsTrustline).toBe(true);
    expect(report.hasTrustline).toBe(true);
  });

  it("marks unfunded accounts as ineligible", async () => {
    const report = await checkGiveawayEligibility("GB_UNFUNDED", sampleGiveaway);
    expect(report.eligible).toBe(false);
    expect(report.reasons[0]).toContain("unfunded");
  });

  it("returns reputation score for accounts", async () => {
    const score = await getReputationScore(
      "GBTYIQPBLDAXZ3DGFY5KAYFHRVGOF5V5GU263RTRVQQOAIICCW5S4VEQ",
    );
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThan(0);
  });
});

describe("Day 4 Guardrail: Server Secrets Environment Isolation", () => {
  it("ensures no server-only secret env vars are referenced in client code", () => {
    const clientDirs = [
      path.resolve(__dirname, "../components"),
      path.resolve(__dirname, "../hooks"),
      path.resolve(__dirname, "../stores"),
      path.resolve(__dirname, "../lib/giveaways"),
    ];

    const forbiddenSecrets = ["TURNSTILE_SECRET_KEY", "IPFS_PINNING_JWT", "SENTRY_AUTH_TOKEN"];

    function scanDir(dir: string): string[] {
      let files: string[] = [];
      if (!fs.existsSync(dir)) return files;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(scanDir(fullPath));
        } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const allClientFiles = clientDirs.flatMap(scanDir);
    expect(allClientFiles.length).toBeGreaterThan(5);

    for (const file of allClientFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const secret of forbiddenSecrets) {
        const found = content.includes(secret);
        if (found) {
          throw new Error(`Forbidden server secret "${secret}" found in client file: ${file}`);
        }
        expect(found).toBe(false);
      }
    }
  });
});
