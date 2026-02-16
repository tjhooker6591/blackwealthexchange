// src/pages/api/admin/organizations/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

function requireAdmin(req: NextApiRequest) {
  const session = req.cookies.session_token;
  const accountType = req.cookies.accountType;
  return Boolean(session) && accountType === "admin";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!requireAdmin(req)) return res.status(401).json({ message: "Unauthorized" });
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

    const { ids } = req.body as { ids?: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Missing ids[]" });
    }

    const objectIds = ids
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ObjectId[];

    if (objectIds.length === 0) {
      return res.status(400).json({ message: "No valid ObjectIds" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db.collection("organizations").updateMany(
      { _id: { $in: objectIds }, entityType: "organization" },
      { $set: { status: "approved", approvedAt: new Date(), updatedAt: new Date() } }
    );

    return res.status(200).json({
      ok: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Approve organizations error:", err);
    return res.status(500).json({ message: "Failed to approve organizations" });
  }
}
