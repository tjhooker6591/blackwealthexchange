import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const businesses = await db.collection("businesses").find({
      $or: [{ approved: false }, { status: "pending" }]
    }).toArray();

    return res.status(200).json({ businesses });
  } catch (error) {
    console.error("Error fetching pending businesses:", error);
    return res.status(500).json({ error: "Error fetching pending businesses" });
  }
}
