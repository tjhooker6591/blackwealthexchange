import { MongoClient } from "mongodb";
import { getHouseSponsorImageMap } from "./house-sponsor-image-map.mjs";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGODB_URI / MONGO_URI");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "bwes-cluster";
const { mapping, resolution, fallbackExists } = getHouseSponsorImageMap();
const house = Object.entries(mapping);

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

for (const [name, img] of house) {
  await db.collection("featured_sponsor_schedule").updateMany(
    { businessName: name },
    {
      $set: {
        creativeUrl: img,
        updatedAt: new Date(),
      },
    },
  );

  await db.collection("advertising_requests").updateMany(
    { business: name },
    {
      $set: {
        adImage: img,
        creativeAssets: [img],
        updatedAt: new Date(),
      },
    },
  );
}

console.log(
  JSON.stringify(
    {
      db: dbName,
      fallbackExists,
      resolution,
      message: "House sponsor seed complete with file-verified image paths.",
    },
    null,
    2,
  ),
);
await client.close();
