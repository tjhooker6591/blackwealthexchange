import path from "path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "example.com" },
      { protocol: "https", hostname: "*.example.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
      {
        source: "/all-sponsors",
        destination: "/business-directory/sponsored-business",
        permanent: false,
      },
      {
        source: "/advertise",
        destination: "/advertise-with-us",
        permanent: false,
      },
      {
        source: "/events/rsvp",
        destination: "/events",
        permanent: false,
      },
      {
        source: "/view-internships",
        destination: "/internships",
        permanent: false,
      },
      {
        source: "/resources/inclusive-job-desriptions",
        destination: "/resources/inclusive-job-descriptions",
        permanent: true,
      },
      {
        source: "/resources/hiring-black-talent",
        destination: "/resources",
        permanent: false,
      },
      {
        source: "/resources/internship-pipeline-guide",
        destination: "/resources",
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

    // src/instrumentation.ts deliberately requires sharp through a
    // runtime-obfuscated string (not a static "sharp" literal) so webpack
    // won't try to bundle/trace sharp's own source during the
    // instrumentation-hook compilation pass -- serverExternalPackages
    // above does not cover that pass the way it does ordinary server
    // routes (confirmed 2026-09-07: a plain `require("sharp")` there broke
    // the build with real Module-not-found errors from sharp's internals).
    // That intentional obfuscation is exactly what makes webpack unable to
    // statically resolve the require target, so it reports "Critical
    // dependency: require function is used in a way in which dependencies
    // cannot be statically extracted" for this one file. Known-safe,
    // suppressed here rather than left to print on every dev server start.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /src[\\/]instrumentation\.ts$/,
        message: /Critical dependency/,
      },
    ];
    return config;
  },
};

export default nextConfig;
