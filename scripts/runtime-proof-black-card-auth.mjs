#!/usr/bin/env node
import "dotenv/config";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

const BASE = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const MONGO_URI = process.env.MONGODB_URI;

if (!SECRET) {
  console.error("Missing JWT_SECRET/NEXTAUTH_SECRET");
  process.exit(1);
}
if (!MONGO_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const dbNameFromUri = (() => {
  try {
    const u = new URL(MONGO_URI);
    return u.pathname?.replace(/^\//, "") || "test";
  } catch {
    return "test";
  }
})();
const DB_NAME =
  process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || dbNameFromUri;

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(DB_NAME);

const email = "proof.blackcard.member@bwe.local";
const now = new Date();
const userId = new ObjectId();

await db.collection("users").updateOne(
  { email },
  {
    $set: {
      email,
      fullName: "Proof BlackCard Member",
      blackCardTier: "standard",
      blackCardStatus: "active",
      blackCardMemberSince: now,
      blackCardPlanExpiresAt: new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 30,
      ),
      blackCardRewardsBalance: 0,
      updatedAt: now,
    },
    $setOnInsert: {
      _id: userId,
      createdAt: now,
    },
  },
  { upsert: true },
);

const user = await db
  .collection("users")
  .findOne({ email }, { projection: { _id: 1, email: 1 } });
const token = jwt.sign(
  { userId: String(user._id), email: user.email },
  SECRET,
  { expiresIn: "2h" },
);
const cookie = `session_token=${token}`;

async function call(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(method !== "GET" ? { Origin: BASE, Referer: `${BASE}/` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    json = body;
  }
  return { status: res.status, json };
}

const proof = {};

proof.entitlementAllow = await call(
  "/api/black-card/entitlements/check?benefit=selected_events",
);
proof.entitlementDeny = await call(
  "/api/black-card/entitlements/check?benefit=vip_events",
);

proof.earn1 = await call("/api/black-card/rewards/earn", {
  method: "POST",
  body: JSON.stringify({
    actionType: "referral_business",
    referenceId: `proof-${Date.now()}-rb`,
  }),
});
proof.earn2 = await call("/api/black-card/rewards/earn", {
  method: "POST",
  body: JSON.stringify({
    actionType: "membership_renewal",
    referenceId: `proof-${Date.now()}-mr`,
  }),
});
proof.earn3 = await call("/api/black-card/rewards/earn", {
  method: "POST",
  body: JSON.stringify({
    actionType: "event_join",
    referenceId: `proof-${Date.now()}-ej`,
  }),
});

proof.ledger = await call("/api/black-card/rewards/ledger");
proof.redeemAllowed = await call("/api/black-card/rewards/redeem", {
  method: "POST",
  body: JSON.stringify({
    rewardType: "marketplace_fee_credit",
    referenceId: `proof-${Date.now()}-redeem-ok`,
  }),
});
proof.redeemDeniedTier = await call("/api/black-card/rewards/redeem", {
  method: "POST",
  body: JSON.stringify({
    rewardType: "ad_credit",
    referenceId: `proof-${Date.now()}-redeem-deny`,
  }),
});

console.log(JSON.stringify(proof, null, 2));

await client.close();
