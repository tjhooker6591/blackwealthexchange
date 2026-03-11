import { MongoClient, MongoClientOptions } from "mongodb";
import { getMongoUri } from "@/lib/env";

const options: MongoClientOptions = {};

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
    cachedPromise = client.connect();
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
