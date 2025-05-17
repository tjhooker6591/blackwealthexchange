import { MongoClient, MongoClientOptions, ObjectId } from "mongodb";

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
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Fetch a campaign by its ID, projecting only the necessary fields.
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  const client = await clientPromise;
  const db = client.db();
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

/**
 * Mark a campaign as paid, storing the Stripe payment intent ID.
 */
export async function markCampaignPaid(
  id: string,
  paymentIntentId: string,
): Promise<void> {
  const client = await clientPromise;
  const db = client.db();
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
