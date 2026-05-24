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
  const id = String(req.query.id || "");
  if (!id)
    return res
      .status(400)
      .json({ ok: false, code: "BAD_REQUEST", message: "id required" });
  const db = (await clientPromise).db(getMongoDbName());
  const key = ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { ticketId: id };
  if (req.method === "GET") {
    const row = await db.collection("executive_priorities").findOne(key as any);
    if (!row)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Not found" });
    return res.status(200).json({ ok: true, row });
  }
  if (req.method === "PATCH") {
    const b =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    b.updatedAt = new Date();
    await db
      .collection("executive_priorities")
      .updateOne(key as any, { $set: b });
    return res.status(200).json({ ok: true });
  }
  if (req.method === "DELETE") {
    await db.collection("executive_priorities").updateOne(key as any, {
      $set: { status: "archived", updatedAt: new Date() },
    });
    return res.status(200).json({ ok: true });
  }
  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({
    ok: false,
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
  });
}
