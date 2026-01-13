import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Helper to safely escape user input for regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(req, res) {
  const { search, category } = req.query;

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const database = client.db("bwes-cluster");
    const businessesCollection = database.collection("businesses");

    let query = {};

    if (search && category && category !== "All") {
      // Both search and category present
      const safeSearch = escapeRegex(search);
      const safeCategory = escapeRegex(category);
      query = {
        $and: [
          { business_name: { $regex: safeSearch, $options: "i" } },
          {
            $or: [
              { categories: { $regex: safeCategory, $options: "i" } },
              { category: { $regex: safeCategory, $options: "i" } },
            ],
          },
        ],
      };
    } else if (search) {
      // Only search present
      const safeSearch = escapeRegex(search);
      query = { business_name: { $regex: safeSearch, $options: "i" } };
    } else if (category && category !== "All") {
      // Only category present
      const safeCategory = escapeRegex(category);
      query = {
        $or: [
          { categories: { $regex: safeCategory, $options: "i" } },
          { category: { $regex: safeCategory, $options: "i" } },
        ],
      };
    } else {
      // No search or category: return up to 50 businesses
      const businesses = await businessesCollection
        .find({})
        .limit(50)
        .toArray();
      await client.close();
      return res.status(200).json(businesses);
    }

    const businesses = await businessesCollection.find(query).toArray();
    await client.close();
    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching businesses from MongoDB" });
  }
}
