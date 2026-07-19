import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "bwes-cluster");
const docs = await db
  .collection("users")
  .find(
    {
      $or: [
        { accountType: "admin" },
        { role: "admin" },
        { roles: "admin" },
        { isAdmin: true },
      ],
    },
    {
      projection: {
        _id: 1,
        accountType: 1,
        role: 1,
        roles: 1,
        isAdmin: 1,
        email: 1,
      },
    },
  )
  .limit(10)
  .toArray();
const out = docs.map((d) => ({
  _id: `${String(d._id).slice(0, 4)}…${String(d._id).slice(-4)}`,
  accountType: d.accountType || null,
  role: d.role || null,
  roles: Array.isArray(d.roles) ? d.roles : null,
  isAdmin: d.isAdmin === true,
  emailDomain: d.email ? String(d.email).split("@")[1] : null,
}));
console.log(JSON.stringify(out, null, 2));
await client.close();
