import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://bwes_admin:M4LmIzY5EjKPODPJ@bwes-cluster.3lko7.mongodb.net/?retryWrites=true&w=majority&appName=BWES-Cluster";
const client = new MongoClient(uri);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    await client.connect();
    const db = client.db("bwes-cluster");
    const collection = db.collection("products");

    const product = await collection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Failed to get product:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await client.close();
  }
}
