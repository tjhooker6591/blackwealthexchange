require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
if (!uri) throw new Error("Missing MONGODB_URI");

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeText(v) {
  return typeof v === "string" ? v : "";
}

function normalizeSearchTokens(search, includeBlackStopword) {
  const stopwords = new Set([
    ...(includeBlackStopword ? ["black"] : []),
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
    .filter((t) => !stopwords.has(t))
    .slice(0, 8);
}

function scoreTokenMatch(text, token) {
  if (!text || !token) return 0;
  if (text === token) return 35;
  if (text.startsWith(token)) return 18;
  if (text.includes(token)) return 10;
  return 0;
}

function relevanceScoreBusiness(item, search, includeBlackStopword) {
  const q = search.toLowerCase().trim();
  if (!q) return 0;

  const tokens = normalizeSearchTokens(q, includeBlackStopword);

  const name = safeText(item?.business_name).toLowerCase();
  const alias = safeText(item?.alias).toLowerCase();
  const category =
    `${safeText(item?.category)} ${safeText(item?.categories)} ${safeText(item?.display_categories)}`.toLowerCase();
  const description = safeText(item?.description).toLowerCase();
  const location =
    `${safeText(item?.city)} ${safeText(item?.state)} ${safeText(item?.address)}`.toLowerCase();

  let score = 0;
  if (name === q) score += 120;
  if (name.startsWith(q)) score += 70;
  if (name.includes(q)) score += 40;

  for (const token of tokens) {
    const tokenWeight = token === "black" ? 0.35 : 1;
    score += scoreTokenMatch(name, token) * 2 * tokenWeight;
    score += scoreTokenMatch(alias, token) * tokenWeight;
    score += scoreTokenMatch(category, token) * 1.4 * tokenWeight;
    score += scoreTokenMatch(description, token) * 0.8 * tokenWeight;
    score += scoreTokenMatch(location, token) * 0.8 * tokenWeight;
  }

  if (item?.isVerified === true || item?.verified === true) score += 10;
  if (Number(item?.amountPaid || 0) > 0) score += 4;

  return score;
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

async function runOne(col, q, includeBlackStopword) {
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

  const search = q.trim().slice(0, 120);
  const searchTokens = search
    ? normalizeSearchTokens(search, includeBlackStopword)
    : [];
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

  let searchTokenClause = null;
  if (search && searchTokens.length) {
    searchTokenClause = buildTokenSearchClause(searchTokens, searchFields);
    if (searchTokenClause) and.push(searchTokenClause);
  }

  const strictQuery = and.length ? { $and: and } : {};
  let query = strictQuery;
  let total = await col.countDocuments(query);
  let mode = "strict";

  if (search && total === 0 && searchTokens.length > 1) {
    const baseAnd = searchTokenClause
      ? and.filter((clause) => clause !== searchTokenClause)
      : and;
    const tokenAnyClause = buildTokenAnyClause(searchTokens, searchFields);
    query = tokenAnyClause
      ? { $and: [...baseAnd, tokenAnyClause] }
      : strictQuery;
    total = await col.countDocuments(query);
    mode = "fallback";
  }

  const candidateLimit = 200;
  const candidates = await col
    .find(query)
    .sort({ createdAt: -1, business_name: 1 })
    .limit(candidateLimit)
    .toArray();

  const ranked = candidates
    .map((item) => ({
      item,
      score: relevanceScoreBusiness(item, search, includeBlackStopword),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.item?.amountPaid || 0) - Number(a.item?.amountPaid || 0);
    })
    .slice(0, 10)
    .map((x) => ({
      business_name: x.item.business_name,
      city: x.item.city,
      state: x.item.state,
      categories: x.item.categories,
      score: x.score,
    }));

  return { tokens: searchTokens, mode, total, top10: ranked };
}

async function main() {
  const client = await new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  }).connect();
  const col = client.db(dbName).collection("businesses");

  const queries = [
    "black dentist atlanta",
    "black owned restaurant houston",
    "black nonprofit chicago",
  ];
  const out = {};

  for (const q of queries) {
    out[q] = {
      before: await runOne(col, q, true),
      after: await runOne(col, q, false),
    };
  }

  console.log(JSON.stringify(out, null, 2));
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
