import { MongoClient } from "mongodb";

function escapeRegex(string) {
  return String(string || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toInt(v, def) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

let _cached = global.__mongoSearchBusinesses;
if (!_cached) {
  _cached = global.__mongoSearchBusinesses = { client: null, promise: null };
}

async function getClient(uri) {
  if (_cached.client) return _cached.client;
  if (!_cached.promise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    _cached.promise = client.connect();
  }
  _cached.client = await _cached.promise;
  return _cached.client;
}

function normalizeType(raw) {
  const t = String(raw || "").toLowerCase();
  if (
    ["org", "orgs", "organization", "organizations", "organisation"].includes(t)
  ) {
    return "organizations";
  }
  return "businesses";
}

function normalizeSort(raw) {
  const t = String(raw || "relevance").toLowerCase();
  if (["newest", "recent"].includes(t)) return "newest";
  if (["completeness", "complete"].includes(t)) return "completeness";
  return "relevance";
}

function buildTokenSearchClause(q, fields) {
  const tokens = String(q || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  if (!tokens.length) return null;

  return {
    $and: tokens.map((tok) => {
      const rx = new RegExp(escapeRegex(tok), "i");
      return { $or: fields.map((f) => ({ [f]: rx })) };
    }),
  };
}

function normalizeOrgDoc(d) {
  return {
    ...d,
    business_name: d.business_name || d.name || d.organization_name || "",
    categories: d.categories || d.orgType || d.category || "",
    entityType: d.entityType || "organization",
  };
}

function completenessScore(doc) {
  const fields = [
    "business_name",
    "name",
    "organization_name",
    "description",
    "address",
    "city",
    "state",
    "phone",
    "website",
    "categories",
    "category",
    "display_categories",
    "image",
  ];
  return fields.reduce((acc, key) => {
    const v = doc?.[key];
    if (Array.isArray(v)) return acc + (v.length > 0 ? 1 : 0);
    return acc + (v !== undefined && v !== null && String(v).trim() ? 1 : 0);
  }, 0);
}

function tokenize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

function asSearchText(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "")).join(" ");
  return String(v || "");
}

function tokenMatchScore(haystack, token) {
  const t = haystack.toLowerCase();
  if (!t || !token) return 0;

  if (t === token) return 10;
  if (t.startsWith(token)) return 6;
  if (new RegExp(`\\b${escapeRegex(token)}\\b`, "i").test(t)) return 4;
  if (t.includes(token)) return 2;
  return 0;
}

function relevanceScore(doc, query, isOrgs) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return 0;

  const tokens = tokenize(q);
  if (!tokens.length) return 0;

  const weightedFields = isOrgs
    ? [
        ["name", 10],
        ["organization_name", 10],
        ["orgType", 6],
        ["description", 4],
        ["city", 3],
        ["state", 3],
        ["address", 2],
        ["website", 1],
      ]
    : [
        ["business_name", 10],
        ["name", 8],
        ["categories", 6],
        ["category", 6],
        ["display_categories", 6],
        ["description", 4],
        ["city", 3],
        ["state", 3],
        ["address", 2],
        ["website", 1],
      ];

  let score = 0;

  for (const [field, weight] of weightedFields) {
    const value = asSearchText(doc?.[field]);
    if (!value) continue;

    const valueLower = value.toLowerCase();
    if (valueLower.includes(q)) {
      score += weight * 8;
      if (valueLower.startsWith(q)) score += weight * 4;
    }

    for (const token of tokens) {
      score += tokenMatchScore(value, token) * weight;
    }
  }

  // Small recency nudge so equally relevant docs feel fresh.
  const createdAt = new Date(doc?.createdAt || 0).getTime();
  if (Number.isFinite(createdAt) && createdAt > 0) {
    score += Math.max(0, Math.min(10, (createdAt / 86400000) % 10));
  }

  return score;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const qRaw = String(req.query.q ?? req.query.search ?? "").trim();
  const categoryRaw = String(req.query.category ?? "").trim();
  const category = categoryRaw && categoryRaw !== "All" ? categoryRaw : "";

  const type = normalizeType(req.query.type ?? req.query.ty);
  const sort = normalizeSort(req.query.sort);
  const state = String(req.query.state ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  const verifiedOnly = String(req.query.verifiedOnly ?? "0") === "1";
  const sponsoredFirst = String(req.query.sponsoredFirst ?? "0") === "1";

  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit, 20)));
  const skip = (page - 1) * limit;

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_ATLAS_URI;

  if (!uri) {
    return res.status(500).json({ error: "Missing Mongo URI env var." });
  }

  try {
    const client = await getClient(uri);
    const database = client.db("bwes-cluster");

    const isOrgs = type === "organizations";
    const collection = database.collection(
      isOrgs ? "organizations" : "businesses",
    );

    const searchFields = isOrgs
      ? [
          "name",
          "organization_name",
          "orgType",
          "description",
          "address",
          "city",
          "state",
          "website",
          "phone",
          "alias",
          "source",
        ]
      : [
          "business_name",
          "name",
          "categories",
          "category",
          "display_categories",
          "description",
          "address",
          "city",
          "state",
          "website",
          "phone",
          "alias",
          "source",
        ];

    const categoryFields = isOrgs
      ? ["orgType", "categories", "category", "description"]
      : ["categories", "category", "display_categories", "description"];

    const clauses = [];

    const tokenClause = qRaw
      ? buildTokenSearchClause(qRaw, searchFields)
      : null;
    if (tokenClause) clauses.push(tokenClause);

    if (category) {
      const rx = new RegExp(escapeRegex(category), "i");
      clauses.push({ $or: categoryFields.map((f) => ({ [f]: rx })) });
    }

    if (state) {
      clauses.push({ state: new RegExp(`^${escapeRegex(state)}$`, "i") });
    }

    if (verifiedOnly) {
      clauses.push({
        $or: [{ verified: true }, { isVerified: true }, { status: "verified" }],
      });
    }

    const query = clauses.length ? { $and: clauses } : {};

    const total = await collection.countDocuments(query);

    let docs = [];

    if (sort === "completeness") {
      // Completeness is derived in JS, so rank a deterministic window first,
      // then paginate after scoring to avoid per-page reordering artifacts.
      const windowSize = Math.min(2000, page * limit);
      const baseDocs = await collection
        .find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(windowSize)
        .toArray();

      docs = baseDocs
        .map((d) => ({ ...d, __completeness: completenessScore(d) }))
        .sort((a, b) => {
          if (sponsoredFirst) {
            const sponsorDelta =
              Number(b?.amountPaid || 0) - Number(a?.amountPaid || 0);
            if (sponsorDelta !== 0) return sponsorDelta;
          }
          const scoreDelta = b.__completeness - a.__completeness;
          if (scoreDelta !== 0) return scoreDelta;
          return String(b?._id || "").localeCompare(String(a?._id || ""));
        })
        .slice(skip, skip + limit)
        .map(({ __completeness, ...rest }) => rest);
    } else if (sort === "relevance" && qRaw) {
      // Relevance is also derived in JS; rank a deterministic window and paginate after scoring.
      const windowSize = Math.min(2000, Math.max(200, page * limit * 4));
      const baseDocs = await collection
        .find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(windowSize)
        .toArray();

      docs = baseDocs
        .map((d) => ({ ...d, __relevance: relevanceScore(d, qRaw, isOrgs) }))
        .sort((a, b) => {
          if (sponsoredFirst) {
            const sponsorDelta =
              Number(b?.amountPaid || 0) - Number(a?.amountPaid || 0);
            if (sponsorDelta !== 0) return sponsorDelta;
          }
          const scoreDelta = b.__relevance - a.__relevance;
          if (scoreDelta !== 0) return scoreDelta;
          const createdDelta =
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime();
          if (createdDelta !== 0) return createdDelta;
          return String(b?._id || "").localeCompare(String(a?._id || ""));
        })
        .slice(skip, skip + limit)
        .map(({ __relevance, ...rest }) => rest);
    } else {
      let sortSpec = { createdAt: -1, _id: -1 };
      if (sponsoredFirst) {
        sortSpec = { amountPaid: -1, ...sortSpec };
      }

      docs = await collection
        .find(query)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .toArray();
    }

    const items = isOrgs ? docs.map(normalizeOrgDoc) : docs;

    return res.status(200).json({
      status: "ok",
      page,
      limit,
      total,
      hasMore: page * limit < total,
      items,
    });
  } catch (error) {
    console.error("searchBusinesses error:", error);
    return res.status(500).json({ error: "Error fetching from MongoDB" });
  }
}
