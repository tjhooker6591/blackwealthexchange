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
  bundlePagesRouterDependencies: true,
  transpilePackages: ["sanitize-html", "htmlparser2"],
  experimental: {
    esmExternals: "loose",
  },
  // src/instrumentation.ts requires sharp through a runtime-obfuscated
  // string so webpack's static analysis can't see it (see the webpack()
  // comment below for why). That same obfuscation also hides the
  // dependency from Vercel/Next's serverless output file tracer, which
  // also relies on static analysis to decide which node_modules files to
  // include in each deployed function -- so sharp's files were being
  // silently pruned from every deployed bundle even though the package
  // was actually installed (confirmed 2026-09-08: production 500s on
  // every route with "Cannot find module 'sharp'" even from a completely
  // clean Vercel-native rebuild). Force-including it here bypasses that.
  outputFileTracingIncludes: {
    // Both globs are required: sharp's JS lives under node_modules/sharp,
    // but its actual platform-compiled binary ships in a separate
    // node_modules/@img/sharp-<platform>-<arch> package (confirmed
    // 2026-09-08 -- node_modules/sharp/**/* alone traced 0 bytes of the
    // real .node binding). Including the whole @img scope covers whatever
    // platform package npm resolves on the build machine, since that
    // varies by Vercel's build architecture.
    "/**": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*",
      "./node_modules/detect-libc/**/*",
      "./node_modules/semver/**/*",
    ],
  },
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
