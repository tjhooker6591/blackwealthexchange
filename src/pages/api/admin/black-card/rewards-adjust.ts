import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

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

  const userId = String(req.body?.userId || "").trim();
  const pointsDelta = Number(req.body?.pointsDelta || 0);
  const reason = String(req.body?.reason || "").trim();

  if (
    !userId ||
    !Number.isFinite(pointsDelta) ||
    pointsDelta === 0 ||
    !reason
  ) {
    return res.status(400).json({
      ok: false,
      error: "userId, pointsDelta, and reason are required",
    });
  }

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ ok: false, error: "Invalid userId" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  const user = await db
    .collection("users")
    .findOne(
      { _id: new ObjectId(userId) },
      { projection: { blackCardRewardsBalance: 1, email: 1 } },
    );

  if (!user)
    return res.status(404).json({ ok: false, error: "User not found" });

  const current = Number(user.blackCardRewardsBalance || 0);
  const next = current + pointsDelta;

  await db
    .collection("users")
    .updateOne(
      { _id: user._id },
      { $set: { blackCardRewardsBalance: next, updatedAt: now } },
    );

  await db.collection("black_card_rewards_ledger").insertOne({
    userId: String(user._id),
    type: pointsDelta > 0 ? "credit" : "debit",
    points: pointsDelta,
    actionType: "admin_adjustment",
    reason,
    balanceAfter: next,
    createdAt: now,
    actorEmail: admin.email || null,
  });

  await db.collection("flow_events").insertOne({
    eventType: "black_card_admin_rewards_adjusted",
    userId: String(user._id),
    actorEmail: admin.email || null,
    pointsDelta,
    reason,
    balanceAfter: next,
    createdAt: now,
  });

  return res.status(200).json({ ok: true, balance: next });
}
