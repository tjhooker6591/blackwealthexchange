import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const members = db.collection("challenge_members");

    const [totalMembers, recentSignups, byCity, byState, topReferrers, sourceBreakdown, businessOwnerInterestCount] = await Promise.all([
      members.countDocuments({}),
      members.find({}).sort({ createdAt: -1 }).limit(25).toArray(),
      members.aggregate([{ $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]).toArray(),
      members.aggregate([{ $group: { _id: "$state", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]).toArray(),
      members.aggregate([{ $match: { referredBy: { $ne: "" } } }, { $group: { _id: "$referredBy", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]).toArray(),
      members.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
      members.countDocuments({ ownsBusiness: true }),
    ]);

    return res.status(200).json({ ok: true, totalMembers, byCity, byState, recentSignups, topReferrers, sourceBreakdown, businessOwnerInterestCount });
  } catch (e) {
    console.error("[/api/admin/challenge]", e);
    return res.status(500).json({ ok: false, error: "Unable to load challenge dashboard data." });
  }
}
