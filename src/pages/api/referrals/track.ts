import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ensureApiRateLimitIndexes, hitApiRateLimit } from "@/lib/apiRateLimit";

const allowedEvents = new Set([
  "invite_sent",
  "invite_accepted",
  "referred_signup",
  "referred_first_purchase",
  "referred_business_listing",
  "referred_seller_signup",
  "referred_employer_signup",
]);

function getIp(req: NextApiRequest) {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

async function ensureIndexes(db: any) {
  await db
    .collection("referral_events")
    .createIndex({ code: 1, event: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("referral_events")
    .createIndex({ ip: 1, createdAt: -1 })
    .catch(() => null);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = String(req.body?.code || "")
    .trim()
    .toUpperCase();
  const event = String(req.body?.event || "").trim();
  const context =
    req.body?.context && typeof req.body.context === "object"
      ? req.body.context
      : null;

  if (!code || !code.startsWith("BWE-")) {
    return res.status(400).json({ error: "Invalid referral code" });
  }

  if (!allowedEvents.has(event)) {
    return res.status(400).json({ error: "Invalid referral event" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureIndexes(db);

  const codeDoc = await db.collection("referral_codes").findOne({ code });
  if (!codeDoc) {
    return res.status(404).json({ error: "Referral code not found" });
  }

  const ip = getIp(req);

  // Phase 8 -- P8-08 Bot/Scraper/Fraud/Abuse Defense. This endpoint is
  // intentionally unauthenticated (a real anonymous visitor triggers
  // invite/signup events before they have an account), but had no
  // throttling at all -- anyone could fabricate an unlimited number of
  // referral_events for any valid code, including the higher-value event
  // types (referred_first_purchase, referred_business_listing) that feed
  // directly into Phase 6's "measured"/"attributed" economic-impact
  // metrics (src/lib/economicImpact/referralImpact.ts). Rate limiting by
  // IP and by code raises the bar against bulk fabrication; it does not
  // by itself verify that a claimed event's underlying real-world action
  // actually occurred (that would require each event to be triggered
  // server-side by the real action's own route, not accepted as a
  // client-asserted claim -- a larger architecture change out of scope
  // for this pass, documented in the Phase 8 control record).
  await ensureApiRateLimitIndexes(db).catch(() => null);
  const ipLimit = await hitApiRateLimit(db, `referral-track:ip:${ip}`, 30, 10);
  const codeLimit = await hitApiRateLimit(
    db,
    `referral-track:code:${code}`,
    60,
    10,
  );
  if (ipLimit.blocked || codeLimit.blocked) {
    res.setHeader(
      "Retry-After",
      String(Math.max(ipLimit.retryAfterSeconds, codeLimit.retryAfterSeconds)),
    );
    return res.status(429).json({ error: "Too many requests." });
  }

  await db.collection("referral_events").insertOne({
    code,
    ownerId: codeDoc.ownerId,
    ownerEmail: codeDoc.ownerEmail,
    ownerAccountType: codeDoc.accountType || "user",
    event,
    context,
    ip,
    userAgent: req.headers["user-agent"] || null,
    createdAt: new Date(),
  });

  return res.status(200).json({ success: true });
}
