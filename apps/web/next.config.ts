import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@goalpost/shared", "@goalpost/server"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
