import { NextApiRequest, NextApiResponse } from "next";
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

    const unapprovedJobs = await db
      .collection("jobs")
      .find({ status: "pending" })
      .toArray();

    res.status(200).json(unapprovedJobs);
  } catch (error) {
    console.error("Error fetching unapproved jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
