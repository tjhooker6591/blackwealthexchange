// src/pages/api/preview/[token]/interested.ts
//
// Public, unauthenticated -- the only action a business owner can take from
// their private preview page. Advances the prospect to "replied" and
// notifies the admin (see src/lib/acquisition/outreach.ts#recordInterested).
// This never activates or publishes anything; it only raises a human's
// hand for the admin to follow up with.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { recordInterested } from "@/lib/acquisition/outreach";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const token = String(req.query.token || "");
    const result = await recordInterested(db, token);
    if (!result.ok) return res.status(400).json(result);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/preview/interested] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
