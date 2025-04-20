// POST /api/affiliate/apply
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";          // ← NEW

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, website, audienceSize, notes } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Missing fields" });

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    /* --------------------- THE ONLY SECTION THAT CHANGED -------------------- */
    await db.collection("affiliates").insertOne({
      _id: new ObjectId(),      // you can drop this—Mongo will add one automatically
      name,
      email,
      website,
      audienceSize,
      notes,
      status: "pending",        // pending → approved / rejected
      referralCode: nanoid(6).toUpperCase(), // e.g. 4FHX9Q
      commissionTier: "standard",
      lifetimeEarnings: 0,
      clicks: 0,
      conversions: 0,
      paidAt: [],               // payout history array
      createdAt: new Date(),
    });
    /* ----------------------------------------------------------------------- */

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

