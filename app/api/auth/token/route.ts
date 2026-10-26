import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const COOKIE_NAME = "stellar-aid-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as { transaction?: string };
  if (!body.transaction) {
    return NextResponse.json({ error: "transaction required" }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: body.transaction }),
  });

  const data = (await upstream.json()) as { token?: string; address?: string };

  if (!upstream.ok || !data.token) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // Store JWT in an httpOnly, SameSite=Strict cookie — never exposed to JS.
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, data.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return NextResponse.json({ address: data.address });
}
