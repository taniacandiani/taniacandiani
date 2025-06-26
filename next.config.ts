import type { NextConfig } from "next";
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
};

export default withPayload(nextConfig);
