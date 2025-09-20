import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
        bodySizeLimit: '10mb',
  }},

};

export default nextConfig;
