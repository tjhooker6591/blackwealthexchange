import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const items = await db
    .collection("black_card_admin_audit")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return res.status(200).json({
    ok: true,
    items: items.map((item: any) => ({
      id: String(item._id),
      targetType: item.targetType || null,
      targetId: item.targetId ? String(item.targetId) : null,
      action: String(item.action || "action"),
      orderId: item.orderId ? String(item.orderId) : null,
      membershipId: item.membershipId ? String(item.membershipId) : null,
      cardId: item.cardId ? String(item.cardId) : null,
      actorId: item.actorId || null,
      reason: item.reason || null,
      before: item.before || null,
      after: item.after || null,
      createdAt: item.createdAt || null,
    })),
    meta: { requestedBy: admin.email || admin.userId || "admin" },
  });
}
