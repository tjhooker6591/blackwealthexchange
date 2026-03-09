import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

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
    .createIndex({ code: 1, event: 1, createdAt: -1 });
  await db.collection("referral_events").createIndex({ ip: 1, createdAt: -1 });
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
