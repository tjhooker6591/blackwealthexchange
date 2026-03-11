import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { ObjectId } from "mongodb";

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

  const id = String(req.query.id || "").trim();
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `admin:approve-job:ip:${ip}`,
      30,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const result = await db.collection("jobs").updateOne(
      { _id: new ObjectId(id), status: "pending" },
      {
        $set: {
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
        .json({ error: "Job not found or no longer pending" });
    }

    return res.status(200).json({ message: "Job approved successfully" });
  } catch (error) {
    console.error("Approval error:", error);
    return res.status(500).json({ error: "Failed to approve job" });
  }
}
