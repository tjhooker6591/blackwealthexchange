import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const interests = await db
      .collection("consulting_interest")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json(interests);
  } catch (_error) {
    res.status(500).json({ message: "Failed to load consulting interests" });
  }
}
