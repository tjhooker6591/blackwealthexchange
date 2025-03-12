// pages/api/admin/rejectBusiness/[id].ts

import { ObjectId } from "mongodb"; // Import ObjectId from MongoDB
import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businessesCollection = db.collection("businesses");

    // Convert the string id to MongoDB ObjectId
    const objectId = new ObjectId(id);

    // Delete the business
    const result = await businessesCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Business rejected" });
    } else {
      res.status(404).json({ error: "Business not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error rejecting business" });
  }
}
