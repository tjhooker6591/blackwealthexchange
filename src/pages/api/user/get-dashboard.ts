import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res
      .status(400)
      .json({ error: "Email is required and must be a string" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fullName = user.fullName || "User";
    const savedJobs = user.savedJobs?.length || 0;
    const applications = user.applications?.length || 0;
    const messages = user.messages?.length || 0;

    return res
      .status(200)
      .json({ fullName, savedJobs, applications, messages });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
