import fs from "fs";
import { MongoClient } from "mongodb";

const MARKER = "TEST_BC_LIFECYCLE_1778713983";

function getEnv(key, blob) {
  const m = blob.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].replace(/^"|"$/g, "") : "";
}

async function main() {
  const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const uri = getEnv("MONGODB_URI", env);
  const dbName = getEnv("MONGODB_DB", env);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const queries = {
    users: { email: { $regex: MARKER.toLowerCase(), $options: "i" } },
    black_card_digital_requests: {
      $or: [
        { email: { $regex: MARKER, $options: "i" } },
        { fullName: { $regex: MARKER, $options: "i" } },
      ],
    },
    black_card_cards: { email: { $regex: MARKER, $options: "i" } },
    black_card_memberships: { email: { $regex: MARKER, $options: "i" } },
    black_card_audit_events: {
      $or: [
        { actorEmail: { $regex: MARKER, $options: "i" } },
        { email: { $regex: MARKER, $options: "i" } },
        { requestId: "6a050782082e8dd6997f7bf6" },
      ],
    },
  };

  for (const [collection, query] of Object.entries(queries)) {
    const count = await db.collection(collection).countDocuments(query);
    console.log(`${collection}: ${count}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error("count script failed");
  console.error(err?.message || err);
  process.exit(1);
});
