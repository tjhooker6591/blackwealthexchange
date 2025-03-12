import { MongoClient } from "mongodb";

// Fetch Mongo URI from environment variables
const uri = process.env.MONGO_URI; // Updated to use MONGO_URI

if (!uri) {
  throw new Error("⚠️ MONGO_URI is not defined in .env.local");
}

// MongoDB client
const client = new MongoClient(uri);

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to avoid multiple connections
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new connection
  clientPromise = client.connect();
}

export default clientPromise;
