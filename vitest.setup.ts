import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";

vi.mock("server-only", () => ({}));

// Restore standards-compliant Blob and File in jsdom environment
if (!globalThis.Blob?.prototype?.arrayBuffer) {
  globalThis.Blob = NodeBlob as unknown as typeof globalThis.Blob;
  globalThis.File = NodeFile as unknown as typeof globalThis.File;
}

process.env.NEXT_PUBLIC_STELLAR_NETWORK ??= "testnet";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:4000";
process.env.NEXT_PUBLIC_API_MODE ??= "live";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??= "1x00000000000000000000AA";
process.env.TURNSTILE_SECRET_KEY ??= "1x0000000000000000000000000000000AA";
process.env.IPFS_PINNING_JWT ??= "test_jwt";

afterEach(() => {
  cleanup();
});
