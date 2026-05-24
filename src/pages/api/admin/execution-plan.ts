import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

const KEY = "bwe-90-day-plan";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  const db = (await clientPromise).db(getMongoDbName());
  const col = db.collection("execution_plan");

  if (req.method === "GET") {
    const row = await col.findOne({ key: KEY });
    return res.status(200).json({ ok: true, row: row || null });
  }

  if (req.method === "PATCH") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const now = new Date();
    const patch = {
      currentPhase: String(
        body.currentPhase || "Phase 1 (Days 1-30): Stabilize + Instrument",
      ),
      topActions: Array.isArray(body.topActions)
        ? body.topActions.slice(0, 10)
        : [],
      ownerReviewNeeded: Array.isArray(body.ownerReviewNeeded)
        ? body.ownerReviewNeeded.slice(0, 10)
        : [],
      updatedAt: now,
    };
    await col.updateOne(
      { key: KEY },
      { $set: { key: KEY, ...patch }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({
    ok: false,
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
  });
}
