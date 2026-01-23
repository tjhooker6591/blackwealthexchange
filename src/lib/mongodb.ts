import { MongoClient, MongoClientOptions } from "mongodb";

const options: MongoClientOptions = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * NOTE:
 * - Do NOT throw at import-time (breaks CI/build).
 * - Only create/connect when env exists.
 */
function createClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  const client = new MongoClient(uri, options);

  // Reuse in development to avoid exhausting connections
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  return client.connect();
}

/**
 * Default export stays the same type as before:
 * - Promise<MongoClient> when configured
 * - (will throw ONLY when awaited) if not configured
 */
const clientPromise = createClientPromise();

export default (clientPromise ??
  (Promise.reject(
    new Error("MongoDB env missing: set MONGODB_URI (and MONGODB_DB where used)"),
  ) as Promise<MongoClient>));
