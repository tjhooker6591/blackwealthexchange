import { MongoClient } from "mongodb";

// Pull the MongoDB connection string from environment variables
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("🛑 Define MONGODB_URI in .env.local");
}

// Create a MongoClient and reuse connections in development to prevent exhaustion
const client = new MongoClient(uri);
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = client.connect();
}

export default clientPromise;
