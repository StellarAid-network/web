import type { NextConfig } from "next";

const ipfsGateway = process.env.IPFS_GATEWAY_URL ?? "https://ipfs.io";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(ipfsGateway).hostname,
        pathname: "/ipfs/**",
      },
    ],
  },
};

export default nextConfig;
