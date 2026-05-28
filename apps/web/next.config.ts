import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@checkmate/shared", "@checkmate/server"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
