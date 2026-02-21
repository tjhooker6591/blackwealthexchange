import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ⚠️ Runtime config is deprecated in Next.js 15+ and removed in Next.js 16.
  // Keep for now if you still rely on it, but plan to migrate to process.env usage
  // in server-only code (API routes / getServerSideProps) instead.
  serverRuntimeConfig: {
    mongoUri: process.env.MONGODB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string,
  },

  publicRuntimeConfig: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  },

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
