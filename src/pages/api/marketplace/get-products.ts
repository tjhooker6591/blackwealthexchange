import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { page = "1", limit = "8", category = "All" } = req.query;

  try {
    await client.connect();
    const db = client.db("bwes-cluster");
    const collection = db.collection("products");

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter =
      category && category !== "All"
        ? { category: { $regex: new RegExp(category as string, "i") } }
        : {};

    const total = await collection.countDocuments(filter);
    const products = await collection
      .find(filter)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.status(200).json({ products, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  } finally {
    await client.close();
  }
}
