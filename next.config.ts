import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MONGO_URI: process.env.MONGO_URI,
  },
  reactStrictMode: true, // Optional but recommended for catching bugs
  swcMinify: true,        // Optional: improves build speed and performance
};

export default nextConfig;
