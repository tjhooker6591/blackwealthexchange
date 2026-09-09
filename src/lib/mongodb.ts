import { MongoClient, MongoClientOptions } from "mongodb";
import { getMongoUri } from "@/lib/env";

const options: MongoClientOptions = {
  // Widened from 2500ms (2026-09-09): too tight for a cold serverless
  // start reaching Atlas over the network for the first time, especially
  // now that some page bundles are larger after forcing webpack to inline
  // sanitize-html/htmlparser2 (next.config.ts) -- confirmed in production
  // as the root cause of business pages intermittently 404ing (the
  // connection attempt timed out, was silently caught, and fell through
  // to a "not found" response) even though the records genuinely exist.
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let cachedPromise: Promise<MongoClient> | null = null;

async function connectMongo(): Promise<MongoClient> {
  const uri = getMongoUri();

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  if (!cachedPromise) {
    const client = new MongoClient(uri, options);
    // A failed connect() must not be cached (2026-09-09): without this,
    // one transient timeout on a cold serverless instance permanently
    // breaks Mongo access for every subsequent request on that same
    // warm instance, since cachedPromise stays set to the rejected
    // promise until Vercel recycles the instance -- confirmed as a
    // major contributor to the intermittent-404 bug above.
    cachedPromise = client.connect().catch((err) => {
      cachedPromise = null;
      throw err;
    });
  }

  return cachedPromise;
}

const clientPromise = {
  then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?:
      | ((value: MongoClient) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return connectMongo().then(onfulfilled as any, onrejected as any);
  },
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ) {
    return connectMongo().catch(onrejected as any);
  },
} as Promise<MongoClient>;

export default clientPromise;
