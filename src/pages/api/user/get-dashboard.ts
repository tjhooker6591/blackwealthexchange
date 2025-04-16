// File: /pages/api/user/get-dashboard.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow GET requests.
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract and validate the email query parameter.
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res
      .status(400)
      .json({ error: "Email is required and must be a string" });
  }

  try {
    // Connect to the MongoDB database.
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Look up the user by email in the users collection.
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve the fullName and counts for savedJobs, applications, and messages.
    const fullName = user.fullName || "User";

    // If the user document stores savedJobs as an array of job IDs (as strings),
    // query the "jobs" collection for the count of documents whose _id is in that array.
    let savedJobsCount = 0;
    if (user.savedJobs && Array.isArray(user.savedJobs)) {
      // Map savedJobs IDs to ObjectId instances (if needed).
      const ids = user.savedJobs.map((id: string) => new ObjectId(id));
      savedJobsCount = await db.collection("jobs").countDocuments({
        _id: { $in: ids },
      });
    }

    // Similarly, if the user document contains an "applications" array, count them.
    // Here, we assume that applications are stored in a dedicated collection.
    let applicationsCount = 0;
    if (user.applications && Array.isArray(user.applications)) {
      const ids = user.applications.map((id: string) => new ObjectId(id));
      // Change "applications" below to the appropriate collection name if different.
      applicationsCount = await db.collection("applications").countDocuments({
        _id: { $in: ids },
      });
    }

    // For messages, assume that the count is stored in an array in the user document.
    const messagesCount = Array.isArray(user.messages)
      ? user.messages.length
      : 0;

    // Return the real data as JSON.
    return res.status(200).json({
      fullName,
      savedJobs: savedJobsCount,
      applications: applicationsCount,
      messages: messagesCount,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
