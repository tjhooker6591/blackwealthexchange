import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    // Update the business document as needed
    const result = await db.collection("businesses").updateOne(
      { _id: id },
      { $set: { approved: true } }
    );

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
