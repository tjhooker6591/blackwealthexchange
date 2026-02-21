// pages/api/organizations/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI;

const DB_NAME = process.env.MONGO_DB_NAME || "bwes-cluster";

type ApiOk = { ok: true; item: any };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

let cached: any = (global as any).__mongoOrgOne;
if (!cached)
  cached = (global as any).__mongoOrgOne = { client: null, promise: null };

async function getClient() {
  if (cached.client) return cached.client;
  if (!cached.promise)
    cached.promise = new MongoClient(URI!, { maxPoolSize: 10 }).connect();
  cached.client = await cached.promise;
  return cached.client;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResp>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!URI) {
    return res.status(500).json({ ok: false, error: "Missing Mongo URI" });
  }

  const slug = String(req.query.slug || "").trim();
  if (!slug) {
    return res.status(400).json({ ok: false, error: "Missing slug" });
  }

  const client = await getClient();
  const col = client.db(DB_NAME).collection("organizations");

  const isObjectId =
    ObjectId.isValid(slug) && String(new ObjectId(slug)) === slug;

  const doc = await col.findOne(
    isObjectId ? { _id: new ObjectId(slug) } : { alias: slug },
    {
      projection: {
        name: 1,
        description: 1,
        address: 1,
        city: 1,
        state: 1,
        phone: 1,
        website: 1,
        orgType: 1,
        status: 1,
        source: 1,
        updatedAt: 1,
        alias: 1,
        entityType: 1,
      },
    },
  );

  if (!doc) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }

  return res.status(200).json({
    ok: true,
    item: { ...doc, _id: String(doc._id) },
  });
}
