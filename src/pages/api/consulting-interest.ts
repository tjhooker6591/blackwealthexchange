// pages/api/consulting-interest.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://bwes_admin:M4LmIzY5EjKPODPJ@bwes-cluster.3lko7.mongodb.net/bwes-cluster?retryWrites=true&w=majority&appName=BWES-Cluster";

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(uri);
  cachedClient = client;
  return client;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("bwes-cluster");
    await db.collection("consulting_interest").insertOne({
      name,
      email,
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to save interest." });
  }
}
