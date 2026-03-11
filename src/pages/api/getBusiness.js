import { MongoClient, ObjectId } from "mongodb";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

function s(v) {
  return typeof v === "string" ? v.trim() : "";
}

function safeImage(raw) {
  const v = s(raw);
  if (!v) return "/house-draft.jpg";
  if (v.startsWith("/")) return v;
  return "/house-draft.jpg";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
    const database = client.db(process.env.MONGODB_DB || "bwes-cluster");

    await ensureApiRateLimitIndexes(database);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      database,
      `business:detail:ip:${ip}`,
      120,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const businessesCollection = database.collection("businesses");

    const projection = {
      alias: 1,
      business_name: 1,
      description: 1,
      phone: 1,
      address: 1,
      city: 1,
      state: 1,
      image: 1,
      website: 1,
      categories: 1,
      status: 1,
      verified: 1,
      isVerified: 1,
      amountPaid: 1,
      isComplete: 1,
      completenessScore: 1,
      latitude: 1,
      longitude: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    let business = await businessesCollection.findOne(
      { alias },
      { projection },
    );

    if (!business && ObjectId.isValid(alias)) {
      business = await businessesCollection.findOne(
        { _id: new ObjectId(alias) },
        { projection },
      );
    }

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const normalized = {
      _id: String(business._id),
      alias: s(business.alias),
      business_name: s(business.business_name),
      description: s(business.description) || "No description available",
      phone: s(business.phone) || "N/A",
      address: s(business.address) || "Address not available",
      city: s(business.city),
      state: s(business.state),
      image: safeImage(business.image),
      website: s(business.website),
      categories: Array.isArray(business.categories) ? business.categories : [],
      status: s(business.status),
      verified: business.verified === true,
      isVerified: business.isVerified === true,
      amountPaid: Number(business.amountPaid || 0),
      isComplete:
        typeof business.isComplete === "boolean"
          ? business.isComplete
          : undefined,
      completenessScore: Number(business.completenessScore || 0),
      latitude:
        typeof business.latitude === "number" ? business.latitude : undefined,
      longitude:
        typeof business.longitude === "number" ? business.longitude : undefined,
      createdAt: business.createdAt || null,
      updatedAt: business.updatedAt || null,
    };

    return res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching business:", error);
    return res.status(500).json({ error: "Error fetching business data" });
  } finally {
    await client.close();
  }
}
