require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
if (!uri) throw new Error("Missing MONGODB_URI");

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchTokens(search, includeBlack = true) {
  const stop = new Set([
    ...(includeBlack ? ["black"] : []),
    "owned",
    "owner",
    "business",
    "businesses",
    "company",
    "companies",
    "near",
    "me",
    "help",
    "find",
  ]);

  return search
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !stop.has(t))
    .slice(0, 8);
}

function buildTokenSearchClause(tokens, fields) {
  if (!tokens.length) return null;
  return {
    $and: tokens.map((token) => {
      const rx = new RegExp(escapeRegex(token), "i");
      return { $or: fields.map((field) => ({ [field]: rx })) };
    }),
  };
}

function buildTokenAnyClause(tokens, fields) {
  if (!tokens.length) return null;
  return {
    $or: tokens.map((token) => {
      const rx = new RegExp(escapeRegex(token), "i");
      return { $or: fields.map((field) => ({ [field]: rx })) };
    }),
  };
}

async function run() {
  const client = await new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  }).connect();

  const db = client.db(dbName);
  const col = db.collection("businesses");

  const searchFields = [
    "business_name",
    "alias",
    "description",
    "categories",
    "display_categories",
    "category",
    "address",
    "city",
    "state",
    "country",
  ];

  const queries = [
    "black dentist atlanta",
    "black owned restaurant houston",
    "black nonprofit chicago",
  ];

  const out = {};

  for (const q of queries) {
    out[q] = {};

    for (const mode of ["current", "after"]) {
      const tokens = normalizeSearchTokens(q, mode === "current");
      const and = [
        {
          $or: [
            { status: "approved" },
            { status: "verified" },
            { status: "active" },
            { status: { $exists: false } },
            { status: "" },
            { status: null },
          ],
        },
        {
          $or: [
            { isComplete: true },
            { completenessScore: { $gte: 70 } },
            { qualityScore: { $gte: 70 } },
          ],
        },
      ];

      let strictClause = null;
      if (tokens.length) {
        strictClause = buildTokenSearchClause(tokens, searchFields);
        and.push(strictClause);
      }

      const strictQuery = { $and: and };
      const strictCount = await col.countDocuments(strictQuery);
      const strictTop = await col
        .find(strictQuery)
        .limit(5)
        .project({ business_name: 1, city: 1, state: 1, categories: 1, _id: 0 })
        .toArray();

      let fallbackCount = strictCount;
      let fallbackTop = strictTop;

      if (strictCount === 0 && tokens.length > 1) {
        const baseAnd = strictClause
          ? and.filter((c) => c !== strictClause)
          : and;
        const anyClause = buildTokenAnyClause(tokens, searchFields);
        const fallbackQuery = anyClause
          ? { $and: [...baseAnd, anyClause] }
          : strictQuery;

        fallbackCount = await col.countDocuments(fallbackQuery);
        fallbackTop = await col
          .find(fallbackQuery)
          .limit(5)
          .project({
            business_name: 1,
            city: 1,
            state: 1,
            categories: 1,
            _id: 0,
          })
          .toArray();
      }

      out[q][mode] = {
        tokens,
        strictCount,
        fallbackCount,
        strictTop,
        fallbackTop,
      };
    }
  }

  console.log(JSON.stringify(out, null, 2));
  await client.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
