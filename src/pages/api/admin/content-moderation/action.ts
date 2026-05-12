import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ObjectId } from "mongodb";

const mapCollection: Record<string, string> = {
  products: "products",
  jobs: "jobs",
  businesses: "businesses",
  ads: "advertising_requests",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const targetType = String(req.body?.targetType || "");
  const targetId = String(req.body?.targetId || "");
  const action = String(req.body?.action || ""); // approve/reject/hold/remove
  const reason = String(req.body?.reason || "").trim();
  if (!targetType || !targetId || !action || !reason)
    return res
      .status(400)
      .json({ ok: false, error: "targetType,targetId,action,reason required" });

  const collectionName = mapCollection[targetType];
  if (!collectionName)
    return res.status(400).json({ ok: false, error: "Unsupported targetType" });
  if (!ObjectId.isValid(targetId))
    return res.status(400).json({ ok: false, error: "Invalid targetId" });

  const nextStatus =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : action === "remove"
          ? "removed"
          : "flagged";

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();
  const result = await db.collection(collectionName).updateOne(
    { _id: new ObjectId(targetId) },
    {
      $set: {
        status: nextStatus,
        moderationNote: reason,
        moderatedAt: now,
        moderatedBy: admin.email || admin.userId || "admin",
        updatedAt: now,
      },
    },
  );
  if (!result.matchedCount)
    return res.status(404).json({ ok: false, error: "Target not found" });

  await db.collection("admin_moderation_audit").insertOne({
    targetType,
    targetId,
    action,
    nextStatus,
    reason,
    actorId: admin.userId || null,
    actorEmail: admin.email || null,
    createdAt: now,
  });

  return res.status(200).json({ ok: true, targetType, targetId, nextStatus });
}
