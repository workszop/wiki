import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // allow better-sqlite3 (native module) to be bundled server-side
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
