import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Job ID is required." });
  }

  const client = await clientPromise;
  const db = client.db("bwes-cluster");
  const jobs = db.collection("jobs");

  const rawCookie = req.headers.cookie || "";
  const parsed = cookie.parse(rawCookie || "");
  const token = parsed.token;

  if (!token) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  let userIdFromToken;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userIdFromToken = decoded.userId;
  } catch {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }

  try {
    const jobObjectId = new ObjectId(id);

    const job = await jobs.findOne({ _id: jobObjectId });
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.userId?.toString() !== userIdFromToken) {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized access to job" });
    }

    switch (req.method) {
      case "GET": {
        return res.status(200).json({ success: true, job });
      }

      case "PUT": {
        const {
          title,
          company,
          location,
          type,
          description,
          salary,
          promotionDuration,
        } = req.body;

        const updateFields: Partial<Record<string, unknown>> = {
          title,
          company,
          location,
          type,
          description,
          salary,
          updatedAt: new Date().toISOString(),
        };

        // ✅ Handle promotion
        if (promotionDuration) {
          const days = parseInt(promotionDuration, 10);
          const now = new Date();
          const featureEndDate = new Date(now.setDate(now.getDate() + days));

          updateFields.isFeatured = true;
          updateFields.featureEndDate = featureEndDate;
        }

        await jobs.updateOne({ _id: jobObjectId }, { $set: updateFields });

        return res
          .status(200)
          .json({ success: true, message: "Job updated successfully" });
      }

      case "DELETE": {
        await jobs.deleteOne({ _id: jobObjectId });
        return res
          .status(200)
          .json({ success: true, message: "Job deleted successfully" });
      }

      default:
        return res
          .status(405)
          .json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Job handler error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
