import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-database");

    if (req.method === "GET") {
      const {
        search = "",
        category,
        page = "1",
        limit = "10"
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = {};

      if (search) {
        query.$or = [
          { business_name: { $regex: search, $options: "i" } },
          { alias: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { categories: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }
      if (category && category !== "All") {
        // match if category or categories field contains the category string (case-insensitive)
        query.$or = [
          ...(query.$or || []),
          { categories: { $regex: category, $options: "i" } },
          { category: { $regex: category, $options: "i" } },
        ];
      }

      // Count total for pagination
      const total = await db.collection("businesses").countDocuments(query);

      // Fetch paginated results
      const results = await db
        .collection("businesses")
        .find(query)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      res.status(200).json({ results, total });
    } else {
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
