import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  getPersonalizationSession,
  resolveRequestedBusinessId,
} from "@/lib/personalization/session";
import { resolveBusinessDiscoveryAnalytics } from "@/lib/personalization/businessDiscoveryAnalytics";

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
    const businessId = await resolveRequestedBusinessId(
      db,
      session,
      String(req.query.businessId || ""),
    );
    if (!businessId) {
      return res.status(403).json({
        ok: false,
        code: "NO_AUTHORIZED_BUSINESS",
        message: "No business found for this account.",
      });
    }
    const result = await resolveBusinessDiscoveryAnalytics(db, { businessId });
    return res.status(200).json(result);
  } catch (err) {
    console.error(
      "[api/personalization/business-discovery-analytics] error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
