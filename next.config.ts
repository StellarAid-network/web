import type { NextConfig } from "next";

const ipfsGateway = process.env.IPFS_GATEWAY_URL ?? "https://ipfs.io";
const isDev = process.env.NODE_ENV !== "production";

const ALLOWED_IPFS_HOSTS = Array.from(
  new Set([
    new URL(ipfsGateway).hostname,
    "ipfs.io",
    "gateway.pinata.cloud",
    "cloudflare-ipfs.com",
  ]),
);

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${ALLOWED_IPFS_HOSTS.map((h) => `https://${h}`).join(" ")}`,
  "font-src 'self' data:",
  "connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org https://soroban-testnet.stellar.org https://soroban.stellar.org https://challenges.cloudflare.com http://localhost:4000 http://127.0.0.1:4000",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: ALLOWED_IPFS_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/ipfs/**",
    })),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
