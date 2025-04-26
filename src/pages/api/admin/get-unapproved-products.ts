import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const unapprovedProducts = await db.collection("products")
      .find({ status: "pending" })   // ✅ Only fetch products truly pending
      .toArray();

    return res.status(200).json({ products: unapprovedProducts });
  } catch (error) {
    console.error("Error fetching unapproved products:", error);
    return res.status(500).json({ error: "Failed to fetch unapproved products" });
  }
}
