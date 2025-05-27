import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Helper to safely escape user input for regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: "No search query provided" });
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const database = client.db("bwes-cluster");
    const businessesCollection = database.collection("businesses");

    // Escape regex special characters in the search string!
    const safeSearch = escapeRegex(search);
    const query = { business_name: { $regex: safeSearch, $options: "i" } };

    const businesses = await businessesCollection.find(query).toArray();
    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching businesses from MongoDB" });
  }
}

