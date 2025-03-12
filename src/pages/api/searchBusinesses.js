import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

export default async function handler(req, res) {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: "No search query provided" });
  }

  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const database = client.db("bwes-cluster");
    const businessesCollection = database.collection("businesses");

    // Search query to match business names or other fields
    const query = { business_name: { $regex: search, $options: "i" } }; // case-insensitive search
    const businesses = await businessesCollection.find(query).toArray();

    res.status(200).json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching businesses from MongoDB" });
  }
}
