import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Cloudflare Workers can't run sharp
  },
};

export default nextConfig;
