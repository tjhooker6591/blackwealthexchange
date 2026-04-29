import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdminFromRequest(req, res); if (!admin) return;
  if (req.method !== "GET") { res.setHeader("Allow", ["GET"]); return res.status(405).json({ ok:false, code:"METHOD_NOT_ALLOWED", message:"Method not allowed" }); }
  const db=(await clientPromise).db(getMongoDbName());
  const rows = await db.collection("support_tickets").aggregate([
    { $facet: {
      byStatus:[{$group:{_id:"$status",count:{$sum:1}}}],
      byPriority:[{$group:{_id:"$priority",count:{$sum:1}}}],
      byCategory:[{$group:{_id:"$category",count:{$sum:1}}}],
    }}
  ]).toArray();
  return res.status(200).json({ ok:true, ...(rows[0]||{byStatus:[],byPriority:[],byCategory:[]}) });
}
