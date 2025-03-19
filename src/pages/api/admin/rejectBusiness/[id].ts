import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";

interface ResponseData {
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Validate the id parameter
  if (!id || (Array.isArray(id) && id.length > 1)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businessesCollection = db.collection("businesses");

    // Convert the id (which may be a string or an array) to an ObjectId
    const objectId = new ObjectId(typeof id === "string" ? id : id[0]);

    // Delete the business
    const result = await businessesCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Business rejected" });
    } else {
      res.status(404).json({ error: "Business not found" });
    }
  } catch (error) {
    console.error("Error rejecting business:", error);
    res.status(500).json({ error: "Error rejecting business" });
  }
}
