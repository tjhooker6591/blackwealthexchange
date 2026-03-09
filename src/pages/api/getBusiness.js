import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { alias } = req.query;

  if (!alias) {
    return res.status(400).json({ error: "Alias is required" });
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    return res
      .status(500)
      .json({ error: "Mongo URI is not defined in environment variables" });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("bwes-cluster");
    const businessesCollection = database.collection("businesses");

    let business = await businessesCollection.findOne({ alias });

    // Some listings route by _id when alias is missing in source records.
    if (!business && ObjectId.isValid(alias)) {
      business = await businessesCollection.findOne({
        _id: new ObjectId(alias),
      });
    }

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    business.description = business.description || "No description available";
    business.phone = business.phone || "N/A";
    business.address = business.address || "Address not available";
    business.image = business.image || "/default-image.jpg";

    return res.status(200).json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return res.status(500).json({ error: "Error fetching business data" });
  } finally {
    await client.close();
  }
}
