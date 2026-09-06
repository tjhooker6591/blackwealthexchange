// src/pages/api/referrals/stats.ts
//
// Phase 5 -- Referrals dashboard data. Aggregates the caller's own real
// referral_events (written by the pre-existing
// src/pages/api/referrals/track.ts and by src/pages/api/auth/signup.ts's
// referred_signup capture) -- never fabricated counts.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession } from "@/lib/network/shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const events = await db
    .collection("referral_events")
    .find({ ownerId: session.userId })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const byEvent: Record<string, number> = {};
  for (const event of events) {
    const key = String(event.event || "unknown");
    byEvent[key] = (byEvent[key] || 0) + 1;
  }

  return res.status(200).json({
    totalEvents: events.length,
    byEvent,
    recent: events.slice(0, 20).map((event: any) => ({
      event: event.event,
      createdAt:
        event.createdAt instanceof Date
          ? event.createdAt.toISOString()
          : event.createdAt || null,
    })),
  });
}
