/**
 * User-generated content sanitization, HTML escaping, and safe IPFS gateway URL helpers.
 *
 * Ensures untrusted off-chain strings (posts, comments, bios, request descriptions)
 * never inject executable markup or `javascript:`/`data:` URLs.
 */

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{20,100})$/;

/**
 * Escapes HTML special characters for safe interpolation in string contexts.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strips control characters, `<script>`/`<style>` blocks, and raw HTML tags from
 * user-generated plain text while preserving readable paragraphs and emoji.
 */
export function sanitizeUserText(input: string, maxLength = 2000): string {
  if (!input) return "";

  const withoutScripts = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    // Remove ASCII control characters except \n and \t
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return withoutScripts.slice(0, maxLength);
}

/**
 * Validates an external link so `javascript:`, `vbscript:`, or `data:` schemes are rejected.
 */
export function safeExternalUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates an IPFS CID and formats a gateway URL using an allowlisted HTTPS gateway.
 */
export function ipfsCidToUrl(
  cid: string | null | undefined,
  gateway = "https://ipfs.io",
): string | null {
  if (!cid) return null;
  const trimmed = cid.trim();
  if (!CID_PATTERN.test(trimmed)) {
    return null;
  }
  const safeBase = safeExternalUrl(gateway)?.replace(/\/$/, "") ?? "https://ipfs.io";
  return `${safeBase}/ipfs/${trimmed}`;
}
