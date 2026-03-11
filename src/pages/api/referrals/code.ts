import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type SessionPayload = {
  userId?: string;
  id?: string;
  email?: string;
  accountType?: string;
};

function makeCode(seed: string) {
  const hex = crypto
    .createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, 8);
  return `BWE-${hex.toUpperCase()}`;
}

async function ensureIndexes(db: any) {
  await db
    .collection("referral_codes")
    .createIndex({ code: 1 }, { unique: true });
  await db
    .collection("referral_codes")
    .createIndex({ ownerId: 1 }, { unique: true });
}

function getSession(req: NextApiRequest): SessionPayload | null {
  const token = req.cookies.session_token;
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const ownerId = session.userId || session.id;
  const ownerEmail = (session.email || "").toLowerCase().trim();
  if (!ownerId || !ownerEmail) {
    return res.status(400).json({ error: "Invalid session payload" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureIndexes(db);

  if (req.method === "GET") {
    const existing = await db.collection("referral_codes").findOne({ ownerId });
    if (!existing)
      return res.status(404).json({ error: "Referral code not found" });
    return res
      .status(200)
      .json({ code: existing.code, ownerEmail: existing.ownerEmail });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const existing = await db.collection("referral_codes").findOne({ ownerId });
  if (existing) {
    return res.status(200).json({
      code: existing.code,
      ownerEmail: existing.ownerEmail,
      reused: true,
    });
  }

  const baseSeed = `${ownerId}:${ownerEmail}:${Date.now()}`;
  let code = makeCode(baseSeed);

  // collision-safe retry
  for (let i = 0; i < 4; i++) {
    const clash = await db.collection("referral_codes").findOne({ code });
    if (!clash) break;
    code = makeCode(`${baseSeed}:${i + 1}`);
  }

  await db.collection("referral_codes").insertOne({
    ownerId,
    ownerEmail,
    accountType: session.accountType || "user",
    code,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return res.status(200).json({ code, ownerEmail, reused: false });
}
