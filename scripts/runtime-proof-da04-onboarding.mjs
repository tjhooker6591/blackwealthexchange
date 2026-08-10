#!/usr/bin/env node
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGO_DB_NAME;

if (!MONGO_URI || !DB_NAME) {
  console.error("Missing MONGODB_URI/MONGODB_ATLAS_URI or MONGODB_DB/MONGO_DB_NAME");
  process.exit(1);
}

const stamp = Date.now();
const password = "Da04Proof!1";

const roles = [
  {
    key: "user",
    email: `da04-user-${stamp}@example.com`,
    signupBody: {
      email: `da04-user-${stamp}@example.com`,
      password,
      accountType: "user",
    },
    expectedSignupRoute: "/business-directory",
    expectedLoginDefaultRoute: "/dashboard",
    collections: ["users"],
  },
  {
    key: "business",
    email: `da04-business-${stamp}@example.com`,
    signupBody: {
      email: `da04-business-${stamp}@example.com`,
      password,
      accountType: "business",
      businessName: "DA04 Proof Business",
      businessAddress: "123 Proof Ave",
      businessPhone: "4045551000",
    },
    expectedSignupRoute: "/business-directory?mode=claim",
    expectedLoginDefaultRoute: "/dashboard",
    collections: ["businesses"],
  },
  {
    key: "seller",
    email: `da04-seller-${stamp}@example.com`,
    signupBody: {
      email: `da04-seller-${stamp}@example.com`,
      password,
      accountType: "seller",
      businessName: "DA04 Proof Store",
    },
    expectedSignupRoute: "/marketplace/become-a-seller",
    expectedLoginDefaultRoute: "/marketplace/dashboard",
    collections: ["sellers"],
  },
  {
    key: "employer",
    email: `da04-employer-${stamp}@example.com`,
    signupBody: {
      email: `da04-employer-${stamp}@example.com`,
      password,
      accountType: "employer",
    },
    expectedSignupRoute: "/employer/jobs",
    expectedLoginDefaultRoute: "/employer",
    collections: ["employers"],
  },
];

function parseSetCookie(headers) {
  const raw = headers.get("set-cookie");
  if (!raw) return "";
  return raw
    .split(/,(?=\s*[A-Za-z0-9!#$%&'*+.^_`|~-]+=)/)
    .map((part) => part.split(";")[0].trim())
    .join("; ");
}

async function req(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}

  return {
    status: res.status,
    location: res.headers.get("location"),
    cookie: parseSetCookie(res.headers),
    text,
    json,
  };
}

const results = [];
const cleanup = [];
const client = new MongoClient(MONGO_URI);

try {
  await client.connect();
  const db = client.db(DB_NAME);

  for (const role of roles) {
    const signup = await req("/api/auth/signup", {
      method: "POST",
      body: role.signupBody,
    });

    const authCookie = signup.cookie;
    const meAfterSignup = authCookie
      ? await req("/api/auth/me", { cookie: authCookie })
      : null;
    const signupRoute = authCookie
      ? await req(role.expectedSignupRoute, { cookie: authCookie })
      : null;
    const login = await req("/api/auth/login", {
      method: "POST",
      body: {
        email: role.email,
        password,
        accountType: role.key,
      },
    });
    const loginCookie = login.cookie;
    const loginDefault = loginCookie
      ? await req(role.expectedLoginDefaultRoute, { cookie: loginCookie })
      : null;

    results.push({
      role: role.key,
      signupStatus: signup.status,
      signupApiAccountType: signup.json?.accountType || null,
      signupAuthMeStatus: meAfterSignup?.status || null,
      signupAuthMeAccountType: meAfterSignup?.json?.user?.accountType || null,
      signupRoute: role.expectedSignupRoute,
      signupRouteStatus: signupRoute?.status || null,
      signupRouteLocation: signupRoute?.location || null,
      loginStatus: login.status,
      loginApiAccountType: login.json?.user?.accountType || null,
      loginDefaultRoute: role.expectedLoginDefaultRoute,
      loginDefaultStatus: loginDefault?.status || null,
      loginDefaultLocation: loginDefault?.location || null,
      pass:
        signup.status === 201 &&
        meAfterSignup?.status === 200 &&
        signupRoute?.status === 200 &&
        login.status === 200 &&
        loginDefault?.status === 200,
    });

    cleanup.push({ email: role.email, collections: role.collections });
  }

  const summary = {
    baseUrl: BASE_URL,
    stamp,
    totals: {
      total: results.length,
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
    },
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (summary.totals.failed > 0) {
    process.exitCode = 1;
  }
} finally {
  try {
    const db = client.db(DB_NAME);
    for (const item of cleanup) {
      for (const collectionName of item.collections) {
        await db.collection(collectionName).deleteMany({ email: item.email });
      }
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
  await client.close().catch(() => {});
}
