import { MongoClient } from "mongodb";

// Helper to safely escape user input for regex
function escapeRegex(string) {
  return String(string || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toInt(v, def) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

// Global cached Mongo client (prevents reconnecting every request)
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
  if (["org", "orgs", "organization", "organizations", "organisation"].includes(t))
    return "organizations";
  return "businesses";
}

function buildTokenSearchClause(q, fields) {
  const tokens = String(q || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  if (!tokens.length) return null;

  // Require each token to match at least one field (AND across tokens)
  return {
    $and: tokens.map((tok) => {
      const rx = new RegExp(escapeRegex(tok), "i");
      return { $or: fields.map((f) => ({ [f]: rx })) };
    }),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // ✅ Accept BOTH q and search
  const qRaw = String(req.query.q ?? req.query.search ?? "").trim();

  const categoryRaw = String(req.query.category ?? "").trim();
  const category = categoryRaw && categoryRaw !== "All" ? categoryRaw : "";

  // ✅ type can be passed as type=organizations / type=businesses (also accepts ty=)
  const type = normalizeType(req.query.type ?? req.query.ty);

  // Optional limit (default 50)
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit, 50)));

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

    // Fields to search (broad + safe)
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

    // Category matching fields
    const categoryFields = isOrgs
      ? ["orgType", "categories", "category", "description"]
      : ["categories", "category", "display_categories", "description"];

    let query = {};

    const tokenClause = qRaw ? buildTokenSearchClause(qRaw, searchFields) : null;

    const categoryClause = category
      ? (() => {
          const rx = new RegExp(escapeRegex(category), "i");
          return { $or: categoryFields.map((f) => ({ [f]: rx })) };
        })()
      : null;

    if (tokenClause && categoryClause) {
      query = { $and: [tokenClause, categoryClause] };
    } else if (tokenClause) {
      query = tokenClause;
    } else if (categoryClause) {
      query = categoryClause;
    } else {
      // No search or category: return up to limit
      const docs = await collection.find({}).limit(limit).toArray();

      // If organizations, normalize keys so UI can render similarly
      if (isOrgs) {
        return res.status(200).json(
          docs.map((d) => ({
            ...d,
            business_name: d.business_name || d.name || d.organization_name || "",
            categories: d.categories || d.orgType || d.category || "",
            entityType: d.entityType || "organization",
          }))
        );
      }

      return res.status(200).json(docs);
    }

    const docs = await collection.find(query).limit(limit).toArray();

    // If organizations, normalize keys so UI can render similarly
    if (isOrgs) {
      return res.status(200).json(
        docs.map((d) => ({
          ...d,
          business_name: d.business_name || d.name || d.organization_name || "",
          categories: d.categories || d.orgType || d.category || "",
          entityType: d.entityType || "organization",
        }))
      );
    }

    return res.status(200).json(docs);
  } catch (error) {
    console.error("searchBusinesses error:", error);
    return res.status(500).json({ error: "Error fetching from MongoDB" });
  }
}
