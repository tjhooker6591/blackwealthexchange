import { MongoClient } from "mongodb";
import { getHouseSponsorImageMap } from "./house-sponsor-image-map.mjs";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGODB_URI / MONGO_URI");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "bwes-cluster";
const { mapping: houseMap, resolution, fallbackExists } = getHouseSponsorImageMap();

const names = Object.keys(houseMap);

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

let scheduleUpdated = 0;
for (const [name, img] of Object.entries(houseMap)) {
  const r = await db.collection("featured_sponsor_schedule").updateMany(
    { businessName: name },
    {
      $set: {
        creativeUrl: img,
        updatedAt: new Date(),
      },
    },
  );
  scheduleUpdated += r.modifiedCount;
}

let reqUpdated = 0;
for (const [name, img] of Object.entries(houseMap)) {
  const r = await db.collection("advertising_requests").updateMany(
    { business: name },
    {
      $set: {
        adImage: img,
        creativeAssets: [img],
        updatedAt: new Date(),
      },
    },
  );
  reqUpdated += r.modifiedCount;
}

const check = await db
  .collection("featured_sponsor_schedule")
  .find({ businessName: { $in: names } })
  .project({ businessName: 1, creativeUrl: 1, _id: 0 })
  .toArray();

console.log(
  JSON.stringify(
    {
      db: dbName,
      fallbackExists,
      resolution,
      scheduleUpdated,
      requestsUpdated: reqUpdated,
      sample: check.slice(0, 20),
    },
    null,
    2,
  ),
);

await client.close();
