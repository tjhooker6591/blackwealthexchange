import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

const JWT_SECRET = getJwtSecret();

function getSessionUserId(req: NextApiRequest): string | null {
  const rawCookie = req.headers.cookie || "";
  const parsed = cookie.parse(rawCookie || "");
  const token = parsed.session_token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return decoded.userId || null;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, error: "Job ID is required." });
  }

  const client = await clientPromise;
  const db = client.db("bwes-cluster");
  const jobs = db.collection("jobs");

  try {
    const jobObjectId = new ObjectId(id);

    if (req.method === "GET") {
      const updated = await jobs.findOneAndUpdate(
        { _id: jobObjectId, status: "approved" },
        { $inc: { viewCount: 1 } },
        {
          returnDocument: "after",
          projection: {
            title: 1,
            company: 1,
            location: 1,
            type: 1,
            description: 1,
            salary: 1,
            createdAt: 1,
            isFeatured: 1,
            appliedCount: 1,
            viewCount: 1,
            employerEmail: 1,
            companyWebsite: 1,
            companyDescription: 1,
          },
        },
      );

      const job = updated;
      if (!job) {
        return res.status(404).json({ success: false, error: "Job not found" });
      }

      return res.status(200).json({ success: true, job });
    }

    const userIdFromToken = getSessionUserId(req);
    if (!userIdFromToken) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const job = await jobs.findOne({ _id: jobObjectId });
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.userId?.toString() !== userIdFromToken) {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized access to job" });
    }

    if (req.method === "PUT") {
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

      if (promotionDuration) {
        const days = parseInt(promotionDuration, 10);
        if (Number.isFinite(days) && days > 0) {
          const featureEndDate = new Date(
            Date.now() + days * 24 * 60 * 60 * 1000,
          );
          updateFields.isFeatured = true;
          updateFields.featureEndDate = featureEndDate;
        }
      }

      await jobs.updateOne({ _id: jobObjectId }, { $set: updateFields });

      return res
        .status(200)
        .json({ success: true, message: "Job updated successfully" });
    }

    if (req.method === "DELETE") {
      await jobs.deleteOne({ _id: jobObjectId });
      return res
        .status(200)
        .json({ success: true, message: "Job deleted successfully" });
    }

    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  } catch (error) {
    console.error("Job handler error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
