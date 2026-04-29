import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
const err = (res: NextApiResponse, code: number, c: string, m: string) => res.status(code).json({ ok: false, code: c, message: m });
export default async function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method !== "GET") { res.setHeader("Allow", ["GET"]); return err(res,405,"METHOD_NOT_ALLOWED","Method not allowed"); }
const id = String(req.query.id || "").trim(); const email = String(req.query.email || "").trim().toLowerCase(); const userId = String(req.query.userId || "").trim(); if (!id) return err(res,400,"MISSING_ID","ticket id required"); if (!email && !userId) return err(res,400,"MISSING_LOOKUP","email or userId required");
const db = (await clientPromise).db(getMongoDbName()); const ticket = await db.collection("support_tickets").findOne({ ticketId:id, ...(email?{email}:{userId}) },{ projection:{ internalNotes:0 } }); if (!ticket) return err(res,404,"NOT_FOUND","Ticket not found"); return res.status(200).json({ ok:true, ticket }); }
