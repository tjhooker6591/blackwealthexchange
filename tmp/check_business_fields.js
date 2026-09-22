const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db(dbName);
  const docs = await db
    .collection("businesses")
    .find(
      {},
      {
        projection: {
          email: 1,
          business_email: 1,
          ownerEmail: 1,
          password: 1,
          accountType: 1,
        },
      },
    )
    .limit(10)
    .toArray();
  console.log(JSON.stringify(docs, null, 2));
  await c.close();
})();
