import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js portal serves on port 3001; Wiki.js on 3000.
  // Caddy routes /wiki/* → Wiki.js, everything else → Next.js.
  async rewrites() {
    return [];
  },
  // Allow images served by Wiki.js
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "wiki",
        port: "3000",
      },
    ],
  },
};

export default nextConfig;
