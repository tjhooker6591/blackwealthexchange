import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";
const err = (res: NextApiResponse, code: number, c: string, m: string) => res.status(code).json({ ok: false, code: c, message: m });
export default async function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method !== "POST") { res.setHeader("Allow", ["POST"]); return err(res,405,"METHOD_NOT_ALLOWED","Method not allowed"); }
const id = String(req.query.id || "").trim(); const b:any = typeof req.body === "string" ? JSON.parse(req.body||"{}") : (req.body||{}); const email = String(b.email || "").trim().toLowerCase(); const userId = String(b.userId || "").trim(); const message = sanitizeRichHtml(String(b.message || "")).trim();
if (!id || !message || message.length < 3) return err(res,400,"INVALID_INPUT","id and message are required"); if (!email && !userId) return err(res,400,"MISSING_LOOKUP","email or userId required");
const db = (await clientPromise).db(getMongoDbName()); const r = await db.collection("support_tickets").updateOne({ ticketId:id, ...(email?{email}:{userId}) }, { $set:{ updatedAt:new Date(), status:"waiting_on_user" }, $push:{ publicReplies:{ from:"user", message, at:new Date() } as any } });
if (!r.matchedCount) return err(res,404,"NOT_FOUND","Ticket not found"); return res.status(200).json({ ok:true }); }
