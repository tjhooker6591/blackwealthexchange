import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const items = await db
      .collection("black_card_redemptions")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({
      ok: true,
      items: items.map((item) => ({
        id: String(item._id),
        userId: String(item.userId || ""),
        rewardType: String(item.rewardType || "reward"),
        pointsCost: Number(item.pointsCost || item.value || 0),
        status: String(item.status || "pending"),
        createdAt: item.createdAt || null,
      })),
    });
  }

  if (req.method === "PATCH") {
    const redemptionId = String(req.body?.redemptionId || "").trim();
    const status = String(req.body?.status || "").trim().toLowerCase();
    if (!redemptionId || !["approved", "rejected", "fulfilled"].includes(status)) {
      return res.status(400).json({ ok: false, error: "redemptionId and valid status required" });
    }

    const result = await db.collection("black_card_redemptions").findOneAndUpdate(
      { _id: new ObjectId(redemptionId) },
      { $set: { status, reviewedAt: new Date(), reviewedBy: admin.email || null } },
      { returnDocument: "after" },
    );

    if (!result) return res.status(404).json({ ok: false, error: "Redemption not found" });

    await db.collection("flow_events").insertOne({
      eventType: "black_card_redemption_reviewed",
      redemptionId,
      status,
      reviewedBy: admin.email || null,
      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true, item: result });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
