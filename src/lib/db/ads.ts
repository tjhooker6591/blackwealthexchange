// src/lib/db/ads.ts
import { MongoClient, MongoClientOptions, ObjectId } from "mongodb"

// (Optional) define your Campaign shape; adjust fields as needed
export interface Campaign {
  _id: ObjectId
  name: string
  price: number
  paid?: boolean
  paidAt?: Date
}

declare global {
  // allow hot-reload in development to reuse client
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI!
const options: MongoClientOptions = {}  // fill in any options you need

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In dev, reuse the client across module reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In prod, create a new client for each invocation
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const client = await clientPromise
  const db = client.db() // or client.db("bwes-cluster")
  return db.collection<Campaign>("ads").findOne({ _id: new ObjectId(id) })
}

export async function markCampaignPaid(id: string): Promise<void> {
  const client = await clientPromise
  const db = client.db()
  await db
    .collection("ads")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { paid: true, paidAt: new Date() } }
    )
}
