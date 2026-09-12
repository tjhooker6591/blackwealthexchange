import { MongoClient, MongoClientOptions, ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";

export interface Campaign {
  _id: ObjectId;
  name: string;
  price: number;
  paid?: boolean;
  paidAt?: Date | null;
  paymentIntentId?: string | null;
  /** URL path to the banner image, e.g. "/ads/banner-ad.jpg" */
  banner?: string;
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options: MongoClientOptions = {};

function getMongoConfig(): { uri: string; dbName: string } | null {
  const uri = process.env.MONGODB_URI;

  // ✅ Do NOT throw at import time; return null if not configured.
  // dbName has a safe default (matching getMongoDbName() elsewhere) --
  // this was requiring MONGODB_DB to be explicitly set or every campaign
  // lookup returned null and markCampaignPaid threw outright, the same
  // root cause confirmed 2026-09-12 for /business/[slug] and Travel Map.
  if (!uri) return null;

  return { uri, dbName: getMongoDbName() };
}

function getClientPromise(uri: string): Promise<MongoClient> {
  // preserve your dev global caching behavior
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri, options);
  return client.connect();
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const cfg = getMongoConfig();
  if (!cfg) return null; // ✅ prevents CI/build crash

  const client = await getClientPromise(cfg.uri);
  const db = client.db(cfg.dbName);

  return db.collection<Campaign>("ads").findOne(
    { _id: new ObjectId(id) },
    {
      projection: {
        name: 1,
        price: 1,
        paid: 1,
        paidAt: 1,
        paymentIntentId: 1,
        banner: 1,
      },
    },
  );
}

export async function markCampaignPaid(
  id: string,
  paymentIntentId: string,
): Promise<void> {
  const cfg = getMongoConfig();
  if (!cfg) {
    // In prod you WANT this configured; throwing here is appropriate because
    // this function is only called during real request/webhook execution.
    throw new Error("MongoDB env vars missing: set MONGODB_URI and MONGODB_DB");
  }

  const client = await getClientPromise(cfg.uri);
  const db = client.db(cfg.dbName);

  await db.collection<Campaign>("ads").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        paid: true,
        paidAt: new Date(),
        paymentIntentId,
      },
    },
  );
}
