import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Ensure id is a single string
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Convert the id string to an ObjectId
    const objectId = new ObjectId(id);

    const result = await db
      .collection("businesses")
      .updateOne({ _id: objectId }, { $set: { approved: true } });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Business not found or already approved" });
    }

    res.status(200).json({ message: "Business approved successfully" });
  } catch (error) {
    console.error("Error approving business:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
