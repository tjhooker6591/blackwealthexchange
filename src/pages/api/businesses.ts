import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-database"); // ✅ Change this to your actual DB name

    if (req.method === "GET") {
      const businesses = await db.collection("businesses").find({}).toArray();
      res.status(200).json(businesses);
    } else {
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
