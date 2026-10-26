import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const account = request.nextUrl.searchParams.get("account");
  if (!account) {
    return NextResponse.json({ error: "account param required" }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/auth/challenge?account=${encodeURIComponent(account)}`);
  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
