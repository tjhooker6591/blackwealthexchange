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

  const db = (await clientPromise).db(getMongoDbName());
  const last = await db
    .collection("webhook_events_debug")
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  return res.status(200).json({
    lastWebhookReceivedAt: last?.createdAt || null,
    lastEventId: redactStripeId(last?.eventId || null),
    lastEventType: last?.eventType || null,
    lastProcessingStatus: last?.status || null,
  });
}
