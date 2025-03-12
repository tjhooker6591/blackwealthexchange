import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const client = await clientPromise;
  const db = client.db("bees");

  if (req.method === "GET") {
    const products = await db.collection("products").find({}).toArray();
    res.json(products);
  } else if (req.method === "POST") {
    const newProduct = req.body;
    const result = await db.collection("products").insertOne(newProduct);
    res.json(result);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
