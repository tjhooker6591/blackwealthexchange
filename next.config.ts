import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,


  // ✅ Fix 404 for repo markdown URLs by redirecting to real pages
  async redirects() {
    return [
      {
        source: "/INTERN_ONBOARDING.md",
        destination: "/intern/welcome",
        permanent: false,
      },
      {
        source: "/INTERN_TASKS.md",
        destination: "/intern/tasks",
        permanent: false,
      },
    ];
  },

  // Prevent bundling Node.js built-ins in client code
  webpack: (config, { isServer }) => {
    // ✅ Add @ alias so "@/components/..." resolves from repo root
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
};

export default nextConfig;
