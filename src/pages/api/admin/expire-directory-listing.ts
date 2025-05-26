import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { listingId } = req.body;
    if (!listingId)
      return res.status(400).json({ error: "No listingId provided" });

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Mark listing as expired and clear featured slot info
    await db.collection("directory_listings").updateOne(
      { _id: new ObjectId(listingId) },
      {
        $set: {
          status: "expired",
          featuredSlot: null,
          featuredStartDate: null,
          featuredEndDate: null,
        },
        $unset: { queuePosition: "" },
      },
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[expire-directory-listing] Error:", err);
    res.status(500).json({ error: "Expire failed" });
  }
}
