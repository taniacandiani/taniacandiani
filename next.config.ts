import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
