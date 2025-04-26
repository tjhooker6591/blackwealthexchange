import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    await db.collection("jobs").updateOne(
      { _id: new ObjectId(id as string) },
      { $set: { status: "approved" } }
    );

    res.status(200).json({ message: "Job approved successfully" });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ error: "Failed to approve job" });
  }
}
