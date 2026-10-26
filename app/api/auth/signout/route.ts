import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "stellar-aid-session";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
