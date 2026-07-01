#!/usr/bin/env node
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!mongoUri || !dbName || !secret) {
  console.error("Missing MONGODB_URI/MONGODB_DB/JWT_SECRET|NEXTAUTH_SECRET");
  process.exit(1);
}

async function req(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
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
    setCookie: res.headers.get("set-cookie"),
    json,
    text,
  };
}

const checks = [];
const client = new MongoClient(mongoUri);
let userId, adminId;

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  userId = new ObjectId();
  adminId = new ObjectId();
  const now = new Date();

  const stamp = Date.now();
  const userEmail = `proof-user-${stamp}@example.com`;
  const adminEmail = `proof-admin-${stamp}@example.com`;

  await users.insertMany([
    {
      _id: userId,
      email: userEmail,
      accountType: "user",
      fullName: "Proof User",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: adminId,
      email: adminEmail,
      accountType: "admin",
      fullName: "Proof Admin",
      createdAt: now,
      updatedAt: now,
      isAdmin: true,
    },
  ]);

  const userToken = jwt.sign(
    { userId: String(userId), email: userEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );
  const adminToken = jwt.sign(
    {
      userId: String(adminId),
      email: adminEmail,
      accountType: "admin",
      isAdmin: true,
    },
    secret,
    { expiresIn: "1h" },
  );
  const invalidToken = `${userToken}corrupt`;

  const userCookie = `session_token=${userToken}; accountType=user`;
  const adminCookie = `session_token=${adminToken}; accountType=admin`;
  const invalidCookie = `session_token=${invalidToken}; accountType=user`;

  checks.push({
    name: "auth_me_user",
    expect: 200,
    ...(await req("/api/auth/me", { cookie: userCookie })),
  });
  checks.push({
    name: "auth_me_invalid_token",
    expect: 401,
    ...(await req("/api/auth/me", { cookie: invalidCookie })),
  });
  checks.push({
    name: "admin_black_card_as_user_redirect",
    expect: 307,
    ...(await req("/admin/black-card", { cookie: userCookie })),
  });
  checks.push({
    name: "admin_black_card_as_admin_ok",
    expect: 200,
    ...(await req("/admin/black-card", { cookie: adminCookie })),
  });
  checks.push({
    name: "wealth_dashboard_as_user_ok",
    expect: 200,
    ...(await req("/wealth-builder/dashboard", { cookie: userCookie })),
  });
  checks.push({
    name: "logout_user",
    expect: 200,
    ...(await req("/api/auth/logout", { method: "POST", cookie: userCookie })),
  });

  const passed = checks.filter((c) => c.status === c.expect).length;
  const summary = {
    baseUrl,
    totals: { total: checks.length, passed, failed: checks.length - passed },
    checks: checks.map((c) => ({
      name: c.name,
      expect: c.expect,
      status: c.status,
      location: c.location,
      hasClearCookieHeader:
        c.name === "logout_user"
          ? Boolean(c.setCookie && c.setCookie.includes("session_token="))
          : undefined,
      pass: c.status === c.expect,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (summary.totals.failed > 0) process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (userId) {
      await db.collection("users").deleteOne({ _id: userId });
      await db.collection("users").deleteOne({ _id: adminId });
    }
  } catch {}
  await client.close().catch(() => {});
}
