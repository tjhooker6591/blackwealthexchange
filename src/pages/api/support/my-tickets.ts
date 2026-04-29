import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
const err = (res: NextApiResponse, code: number, c: string, m: string) => res.status(code).json({ ok: false, code: c, message: m });
export default async function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method !== "GET") { res.setHeader("Allow", ["GET"]); return err(res,405,"METHOD_NOT_ALLOWED","Method not allowed"); }
const email = String(req.query.email || "").trim().toLowerCase(); const userId = String(req.query.userId || "").trim(); if (!email && !userId) return err(res,400,"MISSING_LOOKUP","email or userId required");
const db = (await clientPromise).db(getMongoDbName()); const q: any = email ? { email } : { userId }; const rows = await db.collection("support_tickets").find(q, { projection: { internalNotes: 0 } }).sort({ updatedAt: -1 }).limit(100).toArray(); return res.status(200).json({ ok: true, rows }); }
