import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Fetch businesses where approved is false
    const unapprovedBusinesses = await db
      .collection("businesses")
      .find({ approved: false })
      .toArray();

    res.status(200).json(unapprovedBusinesses);
  } catch (error) {
    console.error("Error fetching unapproved businesses:", error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
}
