import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const jobs = await db
      .collection("jobs")
      .find({ status: "approved" }) // ✅ Only approved jobs
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ jobs });
  } catch (error) {
    console.error("Failed to fetch job listings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
