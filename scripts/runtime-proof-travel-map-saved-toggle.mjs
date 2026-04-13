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

  return { status: res.status, json, text };
}

const client = new MongoClient(mongoUri);
let userId;
let businessId;

try {
  await client.connect();
  const db = client.db(dbName);

  const business = await db.collection("businesses").findOne(
    { status: { $nin: ["rejected", "archived"] } },
    { projection: { _id: 1 } },
  );

  if (!business?._id) {
    throw new Error("No active business found for travel map save test");
  }

  businessId = String(business._id);
  userId = new ObjectId();
  const stamp = Date.now();
  const userEmail = `proof-travel-map-${stamp}@example.com`;
  const now = new Date();

  await db.collection("users").insertOne({
    _id: userId,
    email: userEmail,
    accountType: "user",
    fullName: "Travel Map Proof User",
    createdAt: now,
    updatedAt: now,
  });

  const token = jwt.sign(
    { userId: String(userId), email: userEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );
  const cookie = `session_token=${token}; accountType=user`;

  const checks = [];

  checks.push({ name: "initial_saved_state", expect: 200, ...(await req(`/api/travel-map/saved?businessId=${businessId}`, { cookie })) });
  checks.push({ name: "save_business", expect: 200, ...(await req("/api/travel-map/saved", { method: "POST", cookie, body: { businessId } })) });
  checks.push({ name: "saved_state_after_save", expect: 200, ...(await req(`/api/travel-map/saved?businessId=${businessId}`, { cookie })) });
  checks.push({ name: "remove_saved_business", expect: 200, ...(await req("/api/travel-map/saved", { method: "DELETE", cookie, body: { businessId } })) });
  checks.push({ name: "saved_state_after_remove", expect: 200, ...(await req(`/api/travel-map/saved?businessId=${businessId}`, { cookie })) });

  const normalized = checks.map((c) => ({
    name: c.name,
    expect: c.expect,
    status: c.status,
    pass: c.status === c.expect,
    saved: c.json?.saved,
    removed: c.json?.removed,
    ok: c.json?.ok,
  }));

  const semanticPass =
    normalized[0]?.saved === false &&
    normalized[2]?.saved === true &&
    normalized[3]?.removed === true &&
    normalized[4]?.saved === false;

  const passed = normalized.filter((c) => c.pass).length;
  const summary = {
    baseUrl,
    businessId,
    totals: {
      total: normalized.length,
      passed,
      failed: normalized.length - passed,
    },
    semanticPass,
    checks: normalized,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (summary.totals.failed > 0 || !semanticPass) process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (userId) {
      await db.collection("travel_map_saved_places").deleteMany({
        userId: String(userId),
      });
      await db.collection("users").deleteOne({ _id: userId });
    }
  } catch {}
  await client.close().catch(() => {});
}
