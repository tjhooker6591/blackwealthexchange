require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function safeText(v) {
  return typeof v === "string" ? v : "";
}

const CITY_STATE_ALIASES = { atlanta: "GA", houston: "TX", chicago: "IL" };

function normalizeSearchTokens(search) {
  const stopwords = new Set([
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
function tokenPatterns(token) {
  const t = token.toLowerCase().trim();
  if (!t) return [];
  if (CITY_STATE_ALIASES[t]) return [t, CITY_STATE_ALIASES[t].toLowerCase()];
  if (t === "dentist") return ["dentist", "dental", "dentistry"];
  if (t === "restaurant")
    return ["restaurant", "restaurants", "cafe", "eatery"];
  if (t === "nonprofit")
    return ["nonprofit", "non-profit", "non profit", "charity", "foundation"];
  return [t];
}
function isLocationToken(token) {
  const t = token.toLowerCase().trim();
  if (!t) return false;
  if (CITY_STATE_ALIASES[t]) return true;
  return /^[a-z]{2}$/.test(t);
}
function buildLocationTokenConditions(token, fields) {
  const t = token.toLowerCase().trim();
  if (!t) return [];
  if (CITY_STATE_ALIASES[t]) {
    const cityRx = new RegExp(escapeRegex(t), "i");
    const stateCode = CITY_STATE_ALIASES[t].toUpperCase();
    const out = [];
    if (fields.includes("city")) out.push({ city: cityRx });
    if (fields.includes("address")) out.push({ address: cityRx });
    if (fields.includes("country")) out.push({ country: cityRx });
    if (fields.includes("state")) out.push({ state: stateCode });
    return out;
  }
  if (/^[a-z]{2}$/.test(t))
    return fields.includes("state") ? [{ state: t.toUpperCase() }] : [];
  const rx = new RegExp(escapeRegex(t), "i");
  return fields.map((f) => ({ [f]: rx }));
}
function buildTokenSearchClause(tokens, fields) {
  if (!tokens.length) return null;
  const locationFields = ["city", "state", "address", "country"];
  return {
    $and: tokens.map((token) => {
      if (isLocationToken(token))
        return { $or: buildLocationTokenConditions(token, locationFields) };
      return {
        $or: tokenPatterns(token).flatMap((p) => {
          const rx = new RegExp(escapeRegex(p), "i");
          return fields.map((f) => ({ [f]: rx }));
        }),
      };
    }),
  };
}
function buildTokenAnyClause(tokens, fields) {
  if (!tokens.length) return null;
  return {
    $or: tokens.map((token) => ({
      $or: tokenPatterns(token).flatMap((p) => {
        const rx = new RegExp(escapeRegex(p), "i");
        return fields.map((f) => ({ [f]: rx }));
      }),
    })),
  };
}
function buildLocationClause(tokens) {
  if (!tokens.length) return null;
  const fields = ["city", "state", "address", "country"];
  const cond = tokens.flatMap((token) =>
    buildLocationTokenConditions(token, fields),
  );
  return cond.length ? { $or: cond } : null;
}

function scoreTokenMatch(text, token) {
  if (!text || !token) return 0;
  if (text === token) return 35;
  if (text.startsWith(token)) return 18;
  if (text.includes(token)) return 10;
  return 0;
}
function relevanceScoreBusiness(item, search) {
  const q = search.toLowerCase().trim();
  if (!q) return 0;
  const tokens = normalizeSearchTokens(q);
  const name = safeText(item.business_name).toLowerCase();
  const alias = safeText(item.alias).toLowerCase();
  const category =
    `${safeText(item.category)} ${safeText(item.categories)} ${safeText(item.display_categories)}`.toLowerCase();
  const description = safeText(item.description).toLowerCase();
  const location =
    `${safeText(item.city)} ${safeText(item.state)} ${safeText(item.address)}`.toLowerCase();
  let score = 0;
  if (name === q) score += 120;
  if (name.startsWith(q)) score += 70;
  if (name.includes(q)) score += 40;
  for (const token of tokens) {
    const w = token === "black" ? 0.35 : 1;
    score += scoreTokenMatch(name, token) * 2 * w;
    score += scoreTokenMatch(alias, token) * w;
    score += scoreTokenMatch(category, token) * 1.4 * w;
    score += scoreTokenMatch(description, token) * 0.8 * w;
    score += scoreTokenMatch(location, token) * 0.8 * w;
  }
  if (item.isVerified === true || item.verified === true) score += 10;
  if (Number(item.amountPaid || 0) > 0) score += 4;
  return score;
}

async function runOne(col, q) {
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
  const tokens = normalizeSearchTokens(q);
  const strictTokens = tokens.filter((t) => t !== "black");
  const locationTokens = strictTokens.filter(isLocationToken);
  const intentTokens = strictTokens.filter((t) => !isLocationToken(t));

  let searchClause = null;
  if (strictTokens.length) {
    searchClause = buildTokenSearchClause(strictTokens, searchFields);
    and.push(searchClause);
  }
  const strictQuery = { $and: and };
  let query = strictQuery;
  let total = await col.countDocuments(query);
  let mode = "strict";

  if (total === 0) {
    const baseAnd = searchClause ? and.filter((c) => c !== searchClause) : and;
    if (intentTokens.length && locationTokens.length) {
      const intentAny = buildTokenAnyClause(intentTokens, searchFields);
      const loc = buildLocationClause(locationTokens);
      if (intentAny && loc) {
        query = { $and: [...baseAnd, intentAny, loc] };
        total = await col.countDocuments(query);
        mode = "intent+location-fallback";
      }
    }
    if (total === 0 && locationTokens.length) {
      const loc = buildLocationClause(locationTokens);
      if (loc) {
        query = { $and: [...baseAnd, loc] };
        total = await col.countDocuments(query);
        mode = "location-fallback";
      }
    }
    if (total === 0 && intentTokens.length) {
      const intentAny = buildTokenAnyClause(intentTokens, searchFields);
      if (intentAny) {
        query = { $and: [...baseAnd, intentAny] };
        total = await col.countDocuments(query);
        mode = "intent-fallback";
      }
    }
  }

  const candidates = await col
    .find(query)
    .sort({ createdAt: -1, business_name: 1 })
    .limit(200)
    .toArray();
  const top10 = candidates
    .map((item) => ({ item, score: relevanceScoreBusiness(item, q) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => ({
      name: x.item.business_name,
      city: x.item.city,
      state: x.item.state,
      categories: x.item.categories,
      score: x.score,
    }));
  return {
    tokens,
    strictTokens,
    locationTokens,
    intentTokens,
    mode,
    total,
    top10,
  };
}

(async () => {
  const client = await new MongoClient(uri).connect();
  const col = client.db(dbName).collection("businesses");
  const queries = [
    "black dentist atlanta",
    "black owned restaurant houston",
    "black nonprofit chicago",
  ];
  const out = {};
  for (const q of queries) out[q] = await runOne(col, q);
  console.log(JSON.stringify(out, null, 2));
  await client.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
