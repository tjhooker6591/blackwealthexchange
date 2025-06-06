import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb"; // your MongoDB connection

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("bwes-cluster");
  const categories = await db.collection("businesses").distinct("category");
  res.status(200).json(categories.filter(Boolean).sort());
}
