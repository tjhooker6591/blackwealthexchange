import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getUserFromRequest } from "@/lib/auth";
const err = (res: NextApiResponse, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }
  const u = await getUserFromRequest(req);
  if (!u?.email) return err(res, 401, "UNAUTHORIZED", "Login required");
  const db = (await clientPromise).db(getMongoDbName());
  const rows = await db
    .collection("support_tickets")
    .find({ email: u.email }, { projection: { internalNotes: 0 } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
  return res.status(200).json({ ok: true, rows });
}
