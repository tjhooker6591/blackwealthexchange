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
    const creators = db.collection("challenge_creators");

    const [totalMembers, recentSignups, byCity, byState, topReferrers, sourceBreakdown, businessOwnerInterestCount, creatorInterestCount, exportRows] = await Promise.all([
      members.countDocuments({}),
      members.find({}).sort({ createdAt: -1 }).limit(25).toArray(),
      members.aggregate([{ $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]).toArray(),
      members.aggregate([{ $group: { _id: "$state", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]).toArray(),
      members.aggregate([{ $match: { referredBy: { $ne: "" } } }, { $group: { _id: "$referredBy", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]).toArray(),
      members.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
      members.countDocuments({ ownsBusiness: true }),
      creators.countDocuments({}),
      members.find({}).sort({ createdAt: -1 }).limit(5000).toArray(),
    ]);

    if (String(req.query.format || "").toLowerCase() === "csv") {
      const header = ["name","email","city","state","referralCode","referredBy","source","wantsToRefer","ownsBusiness","businessName","createdAt"];
      const rows = exportRows.map((m: any) => [
        m.name || "",
        m.email || "",
        m.city || "",
        m.state || "",
        m.referralCode || "",
        m.referredBy || "",
        m.source || "",
        String(Boolean(m.wantsToRefer)),
        String(Boolean(m.ownsBusiness)),
        m.businessName || "",
        m.createdAt ? new Date(m.createdAt).toISOString() : "",
      ]);
      const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [header.map(esc).join(","), ...rows.map((r: string[]) => r.map(esc).join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=challenge-members.csv");
      return res.status(200).send(csv);
    }

    return res.status(200).json({ ok: true, totalMembers, byCity, byState, recentSignups, topReferrers, sourceBreakdown, businessOwnerInterestCount, creatorInterestCount });
  } catch (e) {
    console.error("[/api/admin/challenge]", e);
    return res.status(500).json({ ok: false, error: "Unable to load challenge dashboard data." });
  }
}
