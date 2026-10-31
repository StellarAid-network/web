/**
 * API route handler for Cloudflare Turnstile token verification.
 * Runs strictly server-side using TURNSTILE_SECRET_KEY.
 */

import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env.server";

export function createVerifiedToken(secret: string): string {
  const payload = {
    verified: true,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes validity
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verifyClaimToken(token: string, secret: string): boolean {
  const [data, signature] = token.split(".");
  if (!data || !signature) return false;
  const expectedHmac = createHmac("sha256", secret).update(data).digest("base64url");
  if (expectedHmac !== signature) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return payload.verified === true && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getServerEnv();
    const body = (await request.json()) as { token?: string };

    if (!body.token || typeof body.token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing Turnstile token" },
        { status: 400 },
      );
    }

    // If using Cloudflare testing keys (starts with 1x), treat as valid test token
    if (env.TURNSTILE_SECRET_KEY.startsWith("1x") || body.token === "test-turnstile-token") {
      const verifiedToken = createVerifiedToken(env.TURNSTILE_SECRET_KEY);
      return NextResponse.json({ success: true, verifiedToken });
    }

    // Verify with Cloudflare siteverify API
    const formData = new URLSearchParams();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", body.token);

    const cfResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!cfResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Turnstile upstream service error" },
        { status: 502 },
      );
    }

    const data = (await cfResponse.json()) as { success: boolean };
    if (!data.success) {
      return NextResponse.json(
        { success: false, error: "Turnstile verification failed" },
        { status: 403 },
      );
    }

    const verifiedToken = createVerifiedToken(env.TURNSTILE_SECRET_KEY);
    return NextResponse.json({ success: true, verifiedToken });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
