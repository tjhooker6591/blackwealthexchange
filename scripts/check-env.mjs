#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const args = process.argv.slice(2);
const argTarget =
  args.find((a) => a.startsWith("--env="))?.split("=")[1] ||
  args.find((a) => a.startsWith("--target="))?.split("=")[1];

const target = (argTarget || process.env.ENV_CHECK_TARGET || "local").toLowerCase();

if (!new Set(["local", "preview", "production"]).has(target)) {
  console.error(`Invalid env target: ${target}. Use local|preview|production.`);
  process.exit(2);
}

const cwd = process.cwd();
const envFile = path.join(cwd, ".env.local");
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

typeMapGuard();

const CONTRACT = {
  JWT_SECRET: {
    required: ["local", "preview", "production"],
    desc: "Primary auth secret for custom JWT auth routes.",
  },
  NEXTAUTH_SECRET: {
    required: ["local", "preview", "production"],
    desc: "NextAuth secret. Must match JWT_SECRET.",
  },
  NEXTAUTH_URL: {
    required: ["local", "preview", "production"],
    desc: "Canonical app URL for auth callbacks.",
  },
  APP_URL: {
    required: ["preview", "production"],
    optional: ["local"],
    desc: "Absolute app URL used by server-side link generation.",
  },
  NEXT_PUBLIC_APP_URL: {
    required: ["preview", "production"],
    optional: ["local"],
    desc: "Public app URL fallback used by client/server helpers.",
  },
  NEXT_PUBLIC_BASE_URL: {
    optional: ["local", "preview", "production"],
    desc: "Public base URL metadata/runtime config.",
  },
  MONGODB_URI: {
    required: ["local", "preview", "production"],
    desc: "Mongo connection string.",
  },
  MONGODB_DB: {
    required: ["local", "preview", "production"],
    desc: "Mongo database name.",
  },
  RESET_TOKEN_SECRET: {
    optional: ["local", "preview", "production"],
    desc: "Optional dedicated reset token secret.",
  },
  STRIPE_SECRET_KEY: {
    required: ["preview", "production"],
    optional: ["local"],
    desc: "Server-side Stripe key for checkout/session APIs.",
  },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    required: ["preview", "production"],
    optional: ["local"],
    desc: "Client-side Stripe publishable key.",
  },
  STRIPE_WEBHOOK_SECRET: {
    required: ["preview", "production"],
    optional: ["local"],
    desc: "Stripe webhook signature secret.",
  },
  PLATFORM_STRIPE_ACCOUNT_ID: {
    optional: ["local", "preview", "production"],
    desc: "Platform Stripe account id for connect operations.",
  },
};

const missing = [];
for (const [key, meta] of Object.entries(CONTRACT)) {
  if (!meta.required?.includes(target)) continue;
  const val = process.env[key];
  if (!val || !String(val).trim()) missing.push(key);
}

const warnings = [];

if (
  process.env.JWT_SECRET &&
  process.env.NEXTAUTH_SECRET &&
  process.env.JWT_SECRET !== process.env.NEXTAUTH_SECRET
) {
  warnings.push("JWT_SECRET and NEXTAUTH_SECRET are both set but do not match.");
}

const mongoUri = process.env.MONGODB_URI || "";
if (target !== "local" && /mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(mongoUri)) {
  warnings.push("MONGODB_URI points to localhost outside local target.");
}

if (target !== "local") {
  for (const key of ["NEXTAUTH_URL", "APP_URL", "NEXT_PUBLIC_APP_URL"]) {
    const v = (process.env[key] || "").trim();
    if (v && !/^https:\/\//i.test(v)) {
      warnings.push(`${key} should use https:// for ${target}.`);
    }
  }
}

console.log(`\nEnvironment preflight target: ${target}`);
console.log(`Loaded .env.local: ${fs.existsSync(envFile) ? "yes" : "no"}`);

if (missing.length) {
  console.error("\nMissing required variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
}

if (warnings.length) {
  console.warn("\nWarnings:");
  for (const w of warnings) {
    console.warn(`- ${w}`);
  }
}

if (!missing.length) {
  console.log("\nRequired variables: OK");
}

console.log("\nContract summary:");
for (const [k, v] of Object.entries(CONTRACT)) {
  const req = v.required?.join(",") || "-";
  const opt = v.optional?.join(",") || "-";
  console.log(`- ${k} | required: ${req} | optional: ${opt}`);
}

if (missing.length) process.exit(1);

function typeMapGuard() {
  // noop to keep lint/type tools quiet for this plain JS script.
}
