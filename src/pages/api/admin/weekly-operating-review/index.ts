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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const b: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const db = (await clientPromise).db(getMongoDbName());
  const doc = { ...b, createdAt: new Date(), updatedAt: new Date() };
  const r = await db.collection("weekly_operating_reviews").insertOne(doc);
  return res.status(201).json({ ok: true, id: String(r.insertedId) });
}
