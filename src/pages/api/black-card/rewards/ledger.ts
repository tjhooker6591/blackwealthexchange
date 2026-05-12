import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getBlackCardSession } from "@/lib/black-card-member";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = getBlackCardSession(req);
  if (!session)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const entries = await db
    .collection("black_card_rewards_ledger")
    .find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return res.status(200).json({
    ok: true,
    entries: entries.map((item) => ({
      id: String(item._id),
      type: String(item.type || "entry"),
      points: Number(item.points || 0),
      actionType: String(item.actionType || ""),
      rewardType: item.rewardType ? String(item.rewardType) : null,
      balanceAfter: Number(item.balanceAfter || 0),
      createdAt: item.createdAt || null,
    })),
  });
}
