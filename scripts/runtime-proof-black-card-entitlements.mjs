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
      ...(cookie && method !== "GET"
        ? { Origin: baseUrl, Referer: `${baseUrl}/` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, location: res.headers.get("location") };
}

const client = new MongoClient(mongoUri);
let standardId, eliteId;

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  standardId = new ObjectId();
  eliteId = new ObjectId();
  const ts = Date.now();
  const standardEmail = `proof-bc-standard-${ts}@example.com`;
  const eliteEmail = `proof-bc-elite-${ts}@example.com`;
  const now = new Date();

  await users.insertMany([
    {
      _id: standardId,
      email: standardEmail,
      accountType: "user",
      blackCardStatus: "active",
      blackCardTier: "standard",
      blackCardRewardsBalance: 400,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: eliteId,
      email: eliteEmail,
      accountType: "user",
      blackCardStatus: "active",
      blackCardTier: "elite",
      blackCardRewardsBalance: 400,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const standardToken = jwt.sign(
    { userId: String(standardId), email: standardEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );
  const eliteToken = jwt.sign(
    { userId: String(eliteId), email: eliteEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );

  const standardCookie = `session_token=${standardToken}; accountType=user`;
  const eliteCookie = `session_token=${eliteToken}; accountType=user`;

  const checks = [];
  checks.push({
    name: "vip_events_anon_unauthorized",
    expect: 401,
    ...(await req("/api/black-card/entitlements/check?benefit=vip_events")),
  });
  checks.push({
    name: "vip_events_standard_denied",
    expect: 200,
    ...(await req("/api/black-card/entitlements/check?benefit=vip_events", {
      cookie: standardCookie,
    })),
  });
  checks.push({
    name: "vip_events_elite_allowed",
    expect: 200,
    ...(await req("/api/black-card/entitlements/check?benefit=vip_events", {
      cookie: eliteCookie,
    })),
  });
  checks.push({
    name: "redeem_partner_offer_standard_forbidden",
    expect: 403,
    ...(await req("/api/black-card/rewards/redeem", {
      method: "POST",
      cookie: standardCookie,
      body: { rewardType: "partner_offer", referenceId: `proof-${ts}-s` },
    })),
  });
  checks.push({
    name: "redeem_partner_offer_elite_ok",
    expect: 200,
    ...(await req("/api/black-card/rewards/redeem", {
      method: "POST",
      cookie: eliteCookie,
      body: { rewardType: "partner_offer", referenceId: `proof-${ts}-e` },
    })),
  });

  const passed = checks.filter(
    (c) =>
      c.status === c.expect &&
      (c.name !== "vip_events_standard_denied" || c.json?.allowed === false) &&
      (c.name !== "vip_events_elite_allowed" || c.json?.allowed === true),
  ).length;

  console.log(
    JSON.stringify(
      {
        baseUrl,
        totals: {
          total: checks.length,
          passed,
          failed: checks.length - passed,
        },
        checks: checks.map((c) => ({
          name: c.name,
          expect: c.expect,
          status: c.status,
          allowed: c.json?.allowed,
          error: c.json?.error,
          pass: c.status === c.expect,
        })),
      },
      null,
      2,
    ),
  );

  if (checks.length !== passed) process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (standardId) {
      await db.collection("users").deleteOne({ _id: standardId });
      await db.collection("users").deleteOne({ _id: eliteId });
      await db
        .collection("black_card_redemptions")
        .deleteMany({ userId: { $in: [String(standardId), String(eliteId)] } });
      await db
        .collection("black_card_rewards_ledger")
        .deleteMany({ userId: { $in: [String(standardId), String(eliteId)] } });
      await db.collection("flow_events").deleteMany({
        userId: { $in: [String(standardId), String(eliteId)] },
        eventType: "black_card_rewards_redeemed",
      });
    }
  } catch {}
  await client.close().catch(() => {});
}
