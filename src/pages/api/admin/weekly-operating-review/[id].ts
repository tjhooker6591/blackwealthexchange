import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ObjectId } from "mongodb";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const a = await requireAdminFromRequest(req, res);
  if (!a) return;
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const id = String(req.query.id || "");
  if (!ObjectId.isValid(id))
    return res
      .status(400)
      .json({ ok: false, code: "INVALID_ID", message: "Invalid id" });
  const b: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const db = (await clientPromise).db(getMongoDbName());
  await db
    .collection("weekly_operating_reviews")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...b, updatedAt: new Date() } },
    );
  return res.status(200).json({ ok: true });
}
