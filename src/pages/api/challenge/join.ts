import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

function buildReferralCode(name: string) {
  const clean = (name || "MEMBER").replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/)[0] || "MEMBER";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `BWE-${clean.toUpperCase().slice(0, 12)}-${suffix}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const {
      name,
      email,
      city,
      state,
      source,
      sourceDetail,
      wantsToRefer,
      ownsBusiness,
      businessName,
      referredBy,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ ok: false, error: "Name and email are required." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const members = db.collection("challenge_members");
    await members.createIndex({ email: 1 }, { unique: true });
    await members.createIndex({ referralCode: 1 }, { unique: true, sparse: true });

    const normalizedEmail = String(email).trim().toLowerCase();
    const referralCode = buildReferralCode(String(name));
    const now = new Date();

    const doc = {
      name: String(name).trim(),
      email: normalizedEmail,
      city: String(city || "").trim(),
      state: String(state || "").trim().toUpperCase(),
      referralCode,
      referredBy: String(referredBy || "").trim(),
      source: String(source || "challenge-page").trim(),
      sourceDetail: String(sourceDetail || "").trim(),
      wantsToRefer: Boolean(wantsToRefer),
      ownsBusiness: Boolean(ownsBusiness),
      businessName: String(businessName || "").trim(),
      createdAt: now,
      updatedAt: now,
    };

    await members.insertOne(doc);

    const protoHeader = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
    const proto = protoHeader || (hostHeader.includes("localhost") ? "http" : "https");
    const base = hostHeader ? `${proto}://${hostHeader}` : "https://www.blackwealthexchange.com";

    return res.status(200).json({
      ok: true,
      message: "You joined the challenge.",
      referralCode,
      referralLink: `${base}/challenge?ref=${encodeURIComponent(referralCode)}`,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ ok: false, error: "That email is already registered for the challenge." });
    }
    console.error("[/api/challenge/join]", error);
    return res.status(500).json({ ok: false, error: "Unable to join challenge right now. Please try again." });
  }
}
