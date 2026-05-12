import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const a = await requireAdminFromRequest(req, res);
  if (!a) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const db = (await clientPromise).db(getMongoDbName());
  const row = await db
    .collection("weekly_operating_reviews")
    .find({})
    .sort({ weekStart: -1, createdAt: -1 })
    .limit(1)
    .toArray();
  return res.status(200).json({ ok: true, review: row[0] || null });
}
