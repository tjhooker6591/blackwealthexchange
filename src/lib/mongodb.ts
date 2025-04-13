import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

/* eslint-disable no-var */
declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}
/* eslint-enable no-var */

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so it's not re-created on hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, don't use global
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
