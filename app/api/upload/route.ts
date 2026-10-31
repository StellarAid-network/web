/**
 * Upload route handler skeleton for pinning media/documents to IPFS.
 * Runs server-side only with IPFS_PINNING_JWT credentials.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env.server";
import { createHash } from "node:crypto";

// Allowed MIME types: images and PDF documents
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// Maximum file size: 10 MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Simple in-memory rate limiter per IP: max 10 uploads per 60 seconds
const uploadRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploadRateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    uploadRateLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }

  if (entry.count >= 10) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const env = getServerEnv();

    // 1. Rate limiting check
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    // 2. Parse multipart form data
    let formData: { get: (name: string) => unknown };
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Missing or invalid multipart form data" },
        { status: 400 },
      );
    }
    const file = formData.get("file") as {
      type: string;
      size: number;
      arrayBuffer?: () => Promise<ArrayBuffer>;
    } | null;

    if (!file || typeof file !== "object" || !("size" in file) || !("type" in file)) {
      return NextResponse.json(
        { error: "Missing or invalid file in upload request" },
        { status: 400 },
      );
    }

    // 3. MIME type validation
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed: images (jpeg, png, webp, gif) and PDF.`,
        },
        { status: 400 },
      );
    }

    // 4. File size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds 10MB limit (received ${(file.size / 1024 / 1024).toFixed(2)}MB).`,
        },
        { status: 400 },
      );
    }

    const buffer =
      typeof file.arrayBuffer === "function"
        ? Buffer.from(await file.arrayBuffer())
        : Buffer.from("");

    // 5. Pin to IPFS (or deterministic hash fallback for local / tests)
    let cid: string;
    const gateway = env.IPFS_GATEWAY_URL || "https://ipfs.io";

    if (
      env.IPFS_PINNING_JWT &&
      env.IPFS_PINNING_JWT !== "placeholder_jwt" &&
      !env.IPFS_PINNING_JWT.startsWith("test")
    ) {
      const pinataFormData = new FormData();
      pinataFormData.append("file", file as unknown as Blob);

      const pinRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.IPFS_PINNING_JWT}`,
        },
        body: pinataFormData,
      });

      if (!pinRes.ok) {
        return NextResponse.json({ error: "Failed to pin file to IPFS provider" }, { status: 502 });
      }

      const pinData = (await pinRes.json()) as { IpfsHash: string };
      cid = pinData.IpfsHash;
    } else {
      // Deterministic CID placeholder based on SHA-256 of uploaded content
      const hash = createHash("sha256").update(buffer).digest("hex");
      cid = `bafybeig${hash.slice(0, 51)}`;
    }

    return NextResponse.json({
      success: true,
      cid,
      url: `${gateway}/ipfs/${cid}`,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal upload error" },
      { status: 500 },
    );
  }
}
