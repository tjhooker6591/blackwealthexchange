import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

type ConsultingStatus = "pending" | "approved" | "rejected" | "flagged";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const interests = await db
      .collection("consulting_interest")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // ✅ Ensure every entry has a status (defaults to "pending")
    const normalized = interests.map((x: any) => ({
      ...x,
      status: (x.status as ConsultingStatus) ?? "pending",
    }));

    res.status(200).json(normalized);
  } catch (_error) {
    res.status(500).json({ message: "Failed to load consulting interests" });
  }
}
