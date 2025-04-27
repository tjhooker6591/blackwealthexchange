import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { businessId } = req.body;

  if (!businessId) {
    return res.status(400).json({ error: "Business ID is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db.collection("businesses").updateOne(
      { _id: new ObjectId(businessId) },
      { $set: { approved: true, status: "active" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Business not found or already approved" });
    }

    return res.status(200).json({ message: "Business approved successfully" });
  } catch (error) {
    console.error("Approval Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
