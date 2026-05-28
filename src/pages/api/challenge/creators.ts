import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    if (!body.name || !body.email) {
      return res.status(400).json({ ok: false, error: "Name and email are required." });
    }
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const col = db.collection("challenge_creators");
    await col.createIndex({ email: 1 });
    const now = new Date();
    await col.insertOne({
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      city: String(body.city || "").trim(),
      state: String(body.state || "").trim().toUpperCase(),
      platform: String(body.platform || "").trim(),
      handle: String(body.handle || "").trim(),
      followerCount: String(body.followerCount || "").trim(),
      contentCategory: String(body.contentCategory || "").trim(),
      whySupport: String(body.whySupport || "").trim(),
      createdAt: now,
      updatedAt: now,
    });
    return res.status(200).json({ ok: true, message: "Creator interest submitted." });
  } catch (e) {
    console.error("[/api/challenge/creators]", e);
    return res.status(500).json({ ok: false, error: "Unable to submit right now." });
  }
}
