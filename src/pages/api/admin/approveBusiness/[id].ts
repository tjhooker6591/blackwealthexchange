// pages/api/admin/approveBusiness/[id].ts

import { ObjectId } from "mongodb";  // Import ObjectId from MongoDB
import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businessesCollection = db.collection("businesses");

    // Convert the string id to MongoDB ObjectId
    const objectId = new ObjectId(id);

    // Update the business to mark it as verified
    const result = await businessesCollection.updateOne(
      { _id: objectId }, // Use ObjectId to query by the business's _id
      { $set: { isVerified: true } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Business approved" });
    } else {
      res.status(404).json({ error: "Business not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error approving business" });
  }
}