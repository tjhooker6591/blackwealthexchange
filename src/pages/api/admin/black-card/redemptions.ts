import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const statusFilter = String(req.query.status || "")
      .trim()
      .toLowerCase();
    const userIdFilter = String(req.query.userId || "").trim();
    const query: Record<string, unknown> = {};
    if (statusFilter) query.status = statusFilter;
    if (userIdFilter) query.userId = userIdFilter;

    const items = await db
      .collection("black_card_redemptions")
      .find(query)
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
    const status = String(req.body?.status || "")
      .trim()
      .toLowerCase();
    if (
      !redemptionId ||
      !["approved", "rejected", "fulfilled"].includes(status)
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "redemptionId and valid status required" });
    }

    const existing = await db
      .collection("black_card_redemptions")
      .findOne({ _id: new ObjectId(redemptionId) });

    if (!existing)
      return res.status(404).json({ ok: false, error: "Redemption not found" });

    const current = String(existing.status || "pending").toLowerCase();
    const allowedTransitions: Record<string, string[]> = {
      pending: ["approved", "rejected"],
      approved: ["fulfilled"],
      rejected: [],
      fulfilled: [],
    };

    if (!allowedTransitions[current]?.includes(status)) {
      return res.status(409).json({
        ok: false,
        error: `Invalid transition from ${current} to ${status}`,
        code: "INVALID_STATUS_TRANSITION",
      });
    }

    const result = await db
      .collection("black_card_redemptions")
      .findOneAndUpdate(
        { _id: new ObjectId(redemptionId) },
        {
          $set: {
            status,
            reviewedAt: new Date(),
            reviewedBy: admin.email || null,
          },
        },
        { returnDocument: "after" },
      );

    if (current === "pending" && status === "rejected") {
      const pointsRefund = Number(existing.pointsCost || existing.value || 0);
      if (pointsRefund > 0 && existing.userId) {
        const userId = String(existing.userId);
        if (!ObjectId.isValid(userId)) {
          return res
            .status(400)
            .json({ ok: false, error: "Invalid redemption userId" });
        }
        const user = await db
          .collection("users")
          .findOne(
            { _id: new ObjectId(userId) },
            { projection: { blackCardRewardsBalance: 1 } },
          );

        if (user) {
          const nextBalance =
            Number(user.blackCardRewardsBalance || 0) + pointsRefund;
          await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                blackCardRewardsBalance: nextBalance,
                updatedAt: new Date(),
              },
            },
          );

          await db.collection("black_card_rewards_ledger").insertOne({
            userId,
            type: "credit",
            points: pointsRefund,
            actionType: "redemption_refund",
            rewardType: String(existing.rewardType || "reward"),
            referenceId: redemptionId,
            balanceAfter: nextBalance,
            createdAt: new Date(),
          });
        }
      }
    }

    await db.collection("flow_events").insertOne({
      eventType: "black_card_redemption_reviewed",
      redemptionId,
      status,
      previousStatus: current,
      reviewedBy: admin.email || null,
      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true, item: result });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
