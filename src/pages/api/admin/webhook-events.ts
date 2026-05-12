import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";
import { redactStripeId } from "@/lib/finance/ledger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const db = (await clientPromise).db(getMongoDbName());
  const rows = await db
    .collection("webhook_events_debug")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  res.status(200).json({
    rows: rows.map((r: any) => ({
      createdAt: r.createdAt || null,
      revenueStream: r.revenueStream || null,
      status: r.status || null,
      sessionId: redactStripeId(r.sessionId || null),
    })),
  });
}
