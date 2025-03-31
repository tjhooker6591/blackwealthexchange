import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb+srv://bwes_admin:M4LmIzY5EjKPODPJ@bwes-cluster.3lko7.mongodb.net/?retryWrites=true&w=majority&appName=BWES-Cluster";
const client = new MongoClient(uri);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await client.connect();
    const db = client.db("bwes-cluster");
    const collection = db.collection("products");

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await client.close();
  }
}
