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
    ["org", "orgs", "organization", "organizations", "organisation"].includes(
      t,
    )
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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const qRaw = String(req.query.q ?? req.query.search ?? "").trim();
  const categoryRaw = String(req.query.category ?? "").trim();
  const category = categoryRaw && categoryRaw !== "All" ? categoryRaw : "";

  const type = normalizeType(req.query.type ?? req.query.ty);
  const sort = normalizeSort(req.query.sort);
  const state = String(req.query.state ?? "").trim().toUpperCase().slice(0, 2);
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
    const collection = database.collection(isOrgs ? "organizations" : "businesses");

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

    const tokenClause = qRaw ? buildTokenSearchClause(qRaw, searchFields) : null;
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

    let sortSpec = { amountPaid: -1, createdAt: -1, _id: -1 };
    if (sort === "newest") {
      sortSpec = { createdAt: -1, _id: -1 };
    }

    let docs = await collection.find(query).sort(sortSpec).skip(skip).limit(limit).toArray();

    if (sort === "completeness") {
      docs = docs
        .map((d) => ({ ...d, __completeness: completenessScore(d) }))
        .sort((a, b) => b.__completeness - a.__completeness)
        .map(({ __completeness, ...rest }) => rest);
    }

    if (sponsoredFirst) {
      docs = docs.sort((a, b) => {
        const sa = Number(a?.amountPaid || 0);
        const sb = Number(b?.amountPaid || 0);
        return sb - sa;
      });
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
