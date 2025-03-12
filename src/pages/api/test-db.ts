import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb"; // Import MongoDB connection

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    console.log("🔍 API Route Hit - Fetching MongoDB Data...");

    // Connect to MongoDB
    const client = await clientPromise;
    console.log("✅ MongoDB Client Connected");

    const db = client.db("my_database"); // Change to "bees" if needed
    console.log("📂 Connected to Database:", db.databaseName);

    // Fetch users collection from MongoDB
    const users = await db.collection("users").find({}).toArray();
    console.log("👥 Users Fetched:", users);

    // Send JSON response with MongoDB data
    res.json(users);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    res.status(500).json({ error: "Failed to fetch data from MongoDB" });
  }
}
