import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGODB_URI / MONGO_URI");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "bwes-cluster";
const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const targets = [
  { re: /pamfa.*hoodie/i, stock: 25 },
  { re: /pamfa.*sneaker/i, stock: 25 },
];

let modified = 0;
for (const t of targets) {
  const r = await db.collection("products").updateMany(
    { name: { $regex: t.re } },
    {
      $set: {
        stock: t.stock,
        inventory: t.stock,
        updatedAt: new Date(),
      },
    },
  );
  modified += r.modifiedCount;
}

const sample = await db
  .collection("products")
  .find({ name: { $regex: /pamfa/i } })
  .project({ name: 1, stock: 1, inventory: 1, status: 1, _id: 0 })
  .toArray();

console.log(JSON.stringify({ db: dbName, modified, sample }, null, 2));
await client.close();
