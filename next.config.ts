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
  images: {
    remotePatterns: [
      {
        protocol: 'https', // ou 'http' se você não usa SSL
        hostname: process.env.MINIO_ENDPOINT, // Ex: 'minio.seuservidor.com'
        pathname: `/${process.env.MINIO_BUCKET_NAME}/**`, // Ex: '/mangas/**'
      },
    ],
  },

};

export default nextConfig;
