import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      title,
      company,
      location,
      type,
      description,
      salary,
      contactEmail,
      userId, // (optional enhancement: send this in request later)
      isFeatured, // default: false
      isPaid, // default: false
    } = req.body;

    if (
      !title ||
      !company ||
      !location ||
      !type ||
      !description ||
      !contactEmail
    ) {
      return res.status(400).json({ error: "Missing required job fields" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const job = {
      title,
      company,
      location,
      type,
      description,
      salary,
      contactEmail,
      createdAt: new Date(),
      userId: userId || null,
      isFeatured: !!isFeatured,
      isPaid: !!isPaid,
      status: "active",
    };

    const result = await db.collection("jobs").insertOne(job);

    return res.status(201).json({
      success: true,
      message: "Job posted successfully",
      jobId: result.insertedId,
    });
  } catch (err) {
    console.error("Job creation error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
