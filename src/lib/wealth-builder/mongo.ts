import { Db, MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __wealthMongoClientPromise__: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }
  return uri;
}

function getDbName(): string {
  return process.env.MONGODB_DB || "bwes-cluster";
}

async function getClient(): Promise<MongoClient> {
  if (!global.__wealthMongoClientPromise__) {
    global.__wealthMongoClientPromise__ = new MongoClient(getMongoUri()).connect();
  }
  return global.__wealthMongoClientPromise__;
}

export async function getWealthDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getDbName());
}
