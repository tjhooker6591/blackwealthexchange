#!/usr/bin/env node
// scripts/security/qa-seed-accounts.mjs
//
// Phase 8 -- Fortress Security & Adversarial Assurance. Creates/removes a
// fixed set of disposable QA identities used ONLY for adversarial
// security testing, across every role BWE has. These are the ONLY
// accounts Phase 8 destructive/adversarial tests may target -- never a
// real customer account, never the protected owner identity
// (tjameshooker@gmail.com).
//
// All QA accounts use the qa.p8.<role>.<letter>@bwe.local email pattern
// so they are trivially distinguishable from real users and trivially
// removable. Idempotent: safe to re-run.
//
// Usage:
//   node scripts/security/qa-seed-accounts.mjs           # create/update
//   node scripts/security/qa-seed-accounts.mjs --cleanup # remove all qa.p8.* rows

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import fs from "node:fs";

function mongoUri() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    (() => {
      try {
        const t = fs.readFileSync("connect.js", "utf8");
        const m = t.match(/"mongodb\+srv:[^"]+"/);
        return m ? m[0].slice(1, -1) : "";
      } catch {
        return "";
      }
    })()
  );
}

const CLEANUP = process.argv.includes("--cleanup");
const QA_PASSWORD = "QaSecurity8!Pass";
const EMAIL_DOMAIN = "@bwe.local";
const EMAIL_PREFIX = "qa.p8.";

async function main() {
  const uri = mongoUri();
  if (!uri) {
    console.error("No MONGODB_URI available.");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "bwes-cluster");

  if (CLEANUP) {
    const emailRx = new RegExp(`^${EMAIL_PREFIX.replace(".", "\\.")}`, "i");
    for (const coll of [
      "users",
      "businesses",
      "sellers",
      "employers",
      "admins",
    ]) {
      const res = await db
        .collection(coll)
        .deleteMany({ email: emailRx })
        .catch(() => ({ deletedCount: 0 }));
      console.log(`[cleanup] ${coll}: removed ${res.deletedCount || 0}`);
    }
    // Remove any QA-generated relationship/activity rows tagged during testing.
    for (const coll of [
      "saved_businesses",
      "saved_products",
      "saved_searches",
      "saved_opportunities",
      "follows",
      "business_reviews",
      "business_updates",
      "collections",
      "collection_items",
      "notifications",
      "messages",
      "referral_codes",
      "referral_events",
      "business_claims",
      "ownership_reviews",
    ]) {
      const res = await db
        .collection(coll)
        .deleteMany({
          $or: [
            { userId: { $regex: "^qa-p8-" } },
            { email: emailRx },
            { ownerEmail: emailRx },
          ],
        })
        .catch(() => ({ deletedCount: 0 }));
      if (res.deletedCount)
        console.log(`[cleanup] ${coll}: removed ${res.deletedCount}`);
    }
    console.log("[cleanup] done.");
    await client.close();
    return;
  }

  const hash = await bcrypt.hash(QA_PASSWORD, 10);
  const now = new Date();

  const accounts = [
    {
      coll: "users",
      email: `${EMAIL_PREFIX}user.a${EMAIL_DOMAIN}`,
      accountType: "user",
      isAdmin: false,
    },
    {
      coll: "users",
      email: `${EMAIL_PREFIX}user.b${EMAIL_DOMAIN}`,
      accountType: "user",
      isAdmin: false,
    },
    {
      coll: "businesses",
      email: `${EMAIL_PREFIX}business.a${EMAIL_DOMAIN}`,
      accountType: "business",
      businessName: "QA Phase 8 Business A",
      businessAddress: "1 QA Way",
      businessPhone: "5555550001",
    },
    {
      coll: "businesses",
      email: `${EMAIL_PREFIX}business.b${EMAIL_DOMAIN}`,
      accountType: "business",
      businessName: "QA Phase 8 Business B",
      businessAddress: "2 QA Way",
      businessPhone: "5555550002",
    },
    {
      coll: "sellers",
      email: `${EMAIL_PREFIX}seller.a${EMAIL_DOMAIN}`,
      accountType: "seller",
      storeName: "QA Phase 8 Seller A",
    },
    {
      coll: "sellers",
      email: `${EMAIL_PREFIX}seller.b${EMAIL_DOMAIN}`,
      accountType: "seller",
      storeName: "QA Phase 8 Seller B",
    },
    {
      coll: "employers",
      email: `${EMAIL_PREFIX}employer.a${EMAIL_DOMAIN}`,
      accountType: "employer",
    },
    {
      coll: "employers",
      email: `${EMAIL_PREFIX}employer.b${EMAIL_DOMAIN}`,
      accountType: "employer",
    },
    {
      coll: "users",
      email: `${EMAIL_PREFIX}admin${EMAIL_DOMAIN}`,
      accountType: "admin",
      isAdmin: true,
    },
    {
      coll: "users",
      email: `${EMAIL_PREFIX}compromised${EMAIL_DOMAIN}`,
      accountType: "user",
      isAdmin: false,
    },
  ];

  for (const acct of accounts) {
    const { coll, ...fields } = acct;
    await db.collection(coll).updateOne(
      { email: fields.email },
      {
        $set: {
          ...fields,
          password: hash,
          updatedAt: now,
          isPremium: false,
          currentPlan: "free",
          premiumStatus: "inactive",
        },
        $setOnInsert: { createdAt: now, tokenVersion: 0 },
      },
      { upsert: true },
    );
    console.log(`[seed] ${coll}: ${fields.email}`);
  }

  console.log(`\nAll QA accounts share password: ${QA_PASSWORD}`);
  console.log(
    "Run with --cleanup to remove all qa.p8.* accounts and their generated data.",
  );
  await client.close();
}

main().catch((err) => {
  console.error("[qa-seed-accounts] failed:", err);
  process.exit(1);
});
