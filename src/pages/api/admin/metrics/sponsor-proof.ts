import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { safeCount } from "@/lib/adminMetrics";
const err = (res: NextApiResponse, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }
  const db = (await clientPromise).db(getMongoDbName());
  const now = new Date();
  const active = await safeCount(db, "featured_sponsor_schedule", {
    weekStart: { $lte: now },
    weekEnd: { $gte: now },
  });
  const scheduled = await safeCount(db, "featured_sponsor_schedule", {
    weekStart: { $gt: now },
  });
  const expired = await safeCount(db, "featured_sponsor_schedule", {
    weekEnd: { $lt: now },
  });
  const adTickets = await safeCount(db, "support_tickets", {
    category: "Advertising/Sponsorship",
    status: { $nin: ["Resolved", "Closed"] },
  });
  return res.status(200).json({
    ok: true,
    metrics: {
      activeCampaigns: active,
      scheduledCampaigns: scheduled,
      expiredCampaigns: expired,
      placementProof: { value: 0, sourceStatus: "needs_mapping" },
      impressions: { value: 0, sourceStatus: "needs_tracking" },
      clicks: { value: 0, sourceStatus: "needs_tracking" },
      leads: { value: 0, sourceStatus: "needs_tracking" },
      creativeStatus: { value: 0, sourceStatus: "needs_mapping" },
      paymentStatus: { value: 0, sourceStatus: "needs_mapping" },
      supportTickets: adTickets,
      renewalOpportunities: await safeCount(db, "featured_sponsor_schedule", {
        weekEnd: {
          $gte: now,
          $lte: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        },
      }),
    },
  });
}
