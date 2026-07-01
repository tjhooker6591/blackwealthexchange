const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });
const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
const candidates = [
  "password",
  "Password123",
  "password123",
  "12345678",
  "test1234",
  "letmein",
  "blackwealth123",
  "admin123",
];
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db(dbName);
  const users = await db
    .collection("users")
    .find(
      { password: { $type: "string" } },
      { projection: { email: 1, password: 1 } },
    )
    .limit(50)
    .toArray();
  for (const u of users) {
    for (const p of candidates) {
      if (await bcrypt.compare(p, u.password)) {
        console.log("MATCH", u.email, p);
        await c.close();
        return;
      }
    }
  }
  console.log("NO_MATCH");
  await c.close();
})();
