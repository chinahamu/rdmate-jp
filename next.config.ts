import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable standalone output on Windows to prevent symlink EPERM errors during local builds
  output: process.platform === 'win32' ? undefined : 'standalone',
};

export default nextConfig;
