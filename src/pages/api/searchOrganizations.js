// pages/api/searchorganization.js
import { MongoClient } from "mongodb";

const URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI;

const DB_NAME = process.env.MONGO_DB_NAME || "bwes-cluster";

let cached = global.__mongoOrgSearch;
if (!cached) cached = global.__mongoOrgSearch = { client: null, promise: null };

async function getClient() {
  if (cached.client) return cached.client;
  if (!cached.promise) {
    const client = new MongoClient(URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    cached.promise = client.connect();
  }
  cached.client = await cached.promise;
  return cached.client;
}

function toInt(v, def) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegexSearchFilter(q) {
  const tokens = String(q || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  if (!tokens.length) return null;

  const fields = [
    "name",
    "description",
    "orgType",
    "city",
    "state",
    "address",
    "website",
    "phone",
    "source",
  ];

  const andClauses = tokens.map((t) => {
    const rx = new RegExp(escapeRegex(t), "i");
    return { $or: fields.map((f) => ({ [f]: rx })) };
  });

  return { $and: andClauses };
}

function isTextIndexMissingError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("text index required") ||
    msg.includes("no text index") ||
    msg.includes("failed to satisfy $text") ||
    msg.includes("text search not enabled")
  );
}

export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;

  // Avoid caching search responses
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, requestId, error: "Method not allowed" });
  }

  try {
    if (!URI) {
      return res.status(500).json({
        ok: false,
        requestId,
        error: "Missing Mongo URI env var (MONGO_URI / MONGODB_URI).",
      });
    }

    // Accept BOTH q and search
    let qRaw = String(req.query.q ?? req.query.search ?? "").trim();
    const qNorm = qRaw.toLowerCase();

    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    // Public-safe default: approved only unless overridden
    const statusRaw = String(req.query.status ?? "approved")
      .trim()
      .toLowerCase();

    const status =
      statusRaw === "all" || statusRaw === "any" || statusRaw === "*"
        ? null
        : statusRaw;

    let orgType = String(req.query.orgType ?? "").trim(); // e.g. "church"
    const source = String(req.query.source ?? "").trim(); // e.g. "church_seed_20260211_032803"

    // ✅ IMPORTANT: do NOT require entityType to exist (many older imports won’t have it)
    const baseFilter = {};
    if (status) baseFilter.status = status;
    if (source) baseFilter.source = source;

    // ✅ Make "church" search actually return churches even if name doesn't contain "church"
    if (!orgType && (qNorm === "church" || qNorm === "churches")) {
      orgType = "church";
      qRaw = ""; // let orgType drive the result set
    }

    if (orgType) baseFilter.orgType = orgType;

    const client = await getClient();
    const db = client.db(DB_NAME);
    const col = db.collection("organizations");

    const projection = {
      name: 1,
      description: 1,
      address: 1,
      city: 1,
      state: 1,
      phone: 1,
      website: 1,
      status: 1,
      orgType: 1,
      entityType: 1,
      alias: 1,
      completenessScore: 1,
      missingFields: 1,
      source: 1,
      updatedAt: 1,
      lastAuditAt: 1,
      importedAt: 1,
    };

    // Strategy:
    // 1) If q exists, try $text first (best relevance)
    // 2) If text index missing, fall back to regex search (won’t crash)
    let usingText = false;
    let filter = { ...baseFilter };

    if (qRaw.length > 0) {
      usingText = true;
      filter.$text = { $search: qRaw };
    }

    let total;
    try {
      total = await col.countDocuments(filter);
    } catch (err) {
      if (usingText && isTextIndexMissingError(err)) {
        usingText = false;
        filter = { ...baseFilter };

        const regexClause = buildRegexSearchFilter(qRaw);
        if (regexClause) Object.assign(filter, regexClause);

        total = await col.countDocuments(filter);
      } else {
        throw err;
      }
    }

    let cursor;
    if (usingText) {
      cursor = col
        .find(filter, {
          projection: { ...projection, score: { $meta: "textScore" } },
        })
        .sort({ score: { $meta: "textScore" }, name: 1 });
    } else {
      cursor = col.find(filter, { projection }).sort({ name: 1 });
    }

    const items = await cursor.skip(skip).limit(limit).toArray();

    const itemsOut = items.map((d) => {
      const id = String(d._id);
      const alias =
        typeof d.alias === "string" && d.alias.trim() ? d.alias.trim() : "";
      const slug = alias || id;

      return {
        ...d,
        _id: id,
        id,
        slug,
        href: `/organizations/${encodeURIComponent(slug)}`,
      };
    });

    const hasMore = page * limit < total;

    return res.status(200).json({
      ok: true,
      requestId,
      tookMs: Date.now() - t0,
      page,
      limit,
      total,
      hasMore,
      items: itemsOut,
    });
  } catch (err) {
    console.error("searchOrganizations error:", err);
    return res.status(500).json({
      ok: false,
      requestId,
      error: err?.message || "Server error",
    });
  }
}
