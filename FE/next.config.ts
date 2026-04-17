import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['172.16.20.165', '172.16.20.142'],
  reactCompiler: true,
};

export default nextConfig;
