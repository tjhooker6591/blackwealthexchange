import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

interface ResponseData {
  message?: string;
  error?: string;
  status?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  if (!id || (Array.isArray(id) && id.length > 1)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const rawId = typeof id === "string" ? id : id[0];
    if (!ObjectId.isValid(rawId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `admin:reject-business:ip:${ip}`,
      30,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const businessesCollection = db.collection("businesses");
    const objectId = new ObjectId(rawId);

    const result = await businessesCollection.updateOne(
      { _id: objectId, approved: { $ne: true } },
      {
        $set: {
          approved: false,
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({
        message: "Business rejected",
        status: "rejected",
      });
    }

    return res.status(404).json({ error: "Business not found or not pending" });
  } catch (error) {
    console.error("Error rejecting business:", error);
    return res.status(500).json({ error: "Error rejecting business" });
  }
}
