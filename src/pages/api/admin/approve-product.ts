import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(productId), status: "pending" }, // Ensure only pending products get approved
      { $set: { status: "active", isPublished: true } },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Product not found or already approved" });
    }

    return res.status(200).json({ message: "Product approved successfully" });
  } catch (error) {
    console.error("Approval Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
