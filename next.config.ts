import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // These values are only available on the server (e.g. in getServerSideProps)
  serverRuntimeConfig: {
    mongoUri: process.env.MONGODB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string
  },

  // You can still expose safe, public vars (if you need them) here:
  publicRuntimeConfig: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL
  },

  // Prevent bundling Node.js built-ins in client code
  webpack: (config, { isServer }) => {
    // ✅ Add @ alias so "@/components/..." resolves from repo root
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src")
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false
      };
    }
    return config;
  }
};

export default nextConfig;
