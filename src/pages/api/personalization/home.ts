import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getPersonalizationSession } from "@/lib/personalization/session";
import { resolvePersonalizedHome } from "@/lib/personalization/home";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = getPersonalizationSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const result = await resolvePersonalizedHome(db, {
      userId: session.userId,
    });
    if (!result.ok) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/personalization/home] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
