import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MONGO_URI: process.env.MONGO_URI,
  },
  reactStrictMode: true, // Recommended for catching bugs
  // swcMinify: true, // ❌ Removed because it's no longer supported
};

export default nextConfig;
