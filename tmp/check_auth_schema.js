const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db(dbName);
  for (const coll of ["users", "businesses", "sellers", "employers"]) {
    const docs = await db
      .collection(coll)
      .find(
        {},
        {
          projection: {
            email: 1,
            password: 1,
            passwordHash: 1,
            accountType: 1,
          },
        },
      )
      .limit(20)
      .toArray();
    let stats = {
      total: docs.length,
      password: 0,
      passwordHash: 0,
      plainMaybe: 0,
    };
    for (const d of docs) {
      if (d.password) stats.password++;
      if (d.passwordHash) stats.passwordHash++;
      if (typeof d.password === "string" && !d.password.startsWith("$2"))
        stats.plainMaybe++;
    }
    console.log(coll, stats);
  }
  await c.close();
})();
