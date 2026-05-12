import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getUserFromRequest } from "@/lib/auth";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";
const err = (res: NextApiResponse, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }
  const u = await getUserFromRequest(req);
  if (!u?.email) return err(res, 401, "UNAUTHORIZED", "Login required");
  const id = String(req.query.id || "").trim();
  const b: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const message = sanitizeRichHtml(String(b.message || "")).trim();
  if (!id || message.length < 3)
    return err(res, 400, "INVALID_INPUT", "id and message required");
  const db = (await clientPromise).db(getMongoDbName());
  const r = await db.collection("support_tickets").updateOne(
    { ticketId: id, email: u.email },
    {
      $set: { updatedAt: new Date(), status: "Waiting on User" },
      $push: {
        publicReplies: { from: "user", message, at: new Date() },
      } as any,
    },
  );
  if (!r.matchedCount) return err(res, 404, "NOT_FOUND", "Ticket not found");
  return res.status(200).json({ ok: true });
}
