import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const objectId = new ObjectId(id);

    const result = await db.collection("businesses").updateOne(
      { _id: objectId },
      {
        $set: {
          approved: true,
          status: "approved",
          approvedAt: new Date(),
          approvedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Business not found or already approved" });
    }

    return res.status(200).json({ message: "Business approved successfully" });
  } catch (error) {
    console.error("Error approving business:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
