// /pages/api/sponsored-businesses.ts

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const client = await clientPromise;
    const db = client.db(); // uses default DB from connection string

    const businesses = await db
      .collection("businesses")
      .find({ sponsored: true })
      .sort({ tier: 1 }) // top sponsors first
      .toArray();

    res.status(200).json(businesses);
  } catch (error) {
    console.error("Failed to fetch sponsored businesses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default handler; // ✅ This must be included
