import { MongoClient } from "mongodb";
import { computeListingCompleteness } from "@/lib/directory/completeness";

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

function tokenize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

function fieldAsStringExpr(fieldName) {
  const path = `$${fieldName}`;
  return {
    $cond: [
      { $isArray: path },
      {
        $reduce: {
          input: path,
          initialValue: "",
          in: { $concat: ["$$value", " ", { $toString: "$$this" }] },
        },
      },
      { $toString: { $ifNull: [path, ""] } },
    ],
  };
}

function nonEmptyFieldExpr(fieldName) {
  const asString = {
    $trim: { input: fieldAsStringExpr(fieldName) },
  };

  return {
    $cond: [{ $gt: [{ $strLenCP: asString }, 0] }, 1, 0],
  };
}

function buildCompletenessExpression() {
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

  return {
    $add: fields.map((field) => nonEmptyFieldExpr(field)),
  };
}

function buildRelevanceExpression(qRaw, isOrgs) {
  const tokens = tokenize(qRaw);
  const phrase = String(qRaw || "")
    .trim()
    .toLowerCase();

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

  const scoreTerms = [];

  for (const [field, weight] of weightedFields) {
    const fieldExpr = fieldAsStringExpr(field);

    if (phrase) {
      scoreTerms.push({
        $cond: [
          {
            $regexMatch: {
              input: { $toLower: fieldExpr },
              regex: new RegExp(escapeRegex(phrase), "i"),
            },
          },
          weight * 8,
          0,
        ],
      });
      scoreTerms.push({
        $cond: [
          {
            $regexMatch: {
              input: { $toLower: fieldExpr },
              regex: new RegExp(`^${escapeRegex(phrase)}`, "i"),
            },
          },
          weight * 4,
          0,
        ],
      });
    }

    for (const token of tokens) {
      scoreTerms.push({
        $cond: [
          {
            $regexMatch: {
              input: { $toLower: fieldExpr },
              regex: new RegExp(`\\b${escapeRegex(token)}\\b`, "i"),
            },
          },
          weight * 4,
          0,
        ],
      });
      scoreTerms.push({
        $cond: [
          {
            $regexMatch: {
              input: { $toLower: fieldExpr },
              regex: new RegExp(escapeRegex(token), "i"),
            },
          },
          weight * 2,
          0,
        ],
      });
    }
  }

  return scoreTerms.length ? { $add: scoreTerms } : 0;
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
  const includeIncomplete = String(req.query.includeIncomplete ?? "0") === "1";

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

    if (!includeIncomplete) {
      clauses.push({
        $or: [
          { isComplete: true },
          { completenessScore: { $gte: 70 } },
          { $expr: { $gte: [buildCompletenessExpression(), 7] } },
        ],
      });
    }

    const query = clauses.length ? { $and: clauses } : {};

    const total = await collection.countDocuments(query);

    const pipeline = [{ $match: query }];

    if (sponsoredFirst) {
      pipeline.push({
        $addFields: {
          __sponsor: { $toDouble: { $ifNull: ["$amountPaid", 0] } },
        },
      });
    }

    if (sort === "completeness") {
      pipeline.push({
        $addFields: {
          __completeness: buildCompletenessExpression(),
        },
      });

      pipeline.push({
        $sort: {
          ...(sponsoredFirst ? { __sponsor: -1 } : {}),
          __completeness: -1,
          createdAt: -1,
          _id: -1,
        },
      });
    } else if (sort === "relevance" && qRaw) {
      pipeline.push({
        $addFields: {
          __relevance: buildRelevanceExpression(qRaw, isOrgs),
        },
      });

      pipeline.push({
        $sort: {
          ...(sponsoredFirst ? { __sponsor: -1 } : {}),
          __relevance: -1,
          createdAt: -1,
          _id: -1,
        },
      });
    } else {
      pipeline.push({
        $sort: {
          ...(sponsoredFirst ? { __sponsor: -1 } : {}),
          createdAt: -1,
          _id: -1,
        },
      });
    }

    pipeline.push({ $skip: skip }, { $limit: limit });

    const docs = await collection.aggregate(pipeline).toArray();

    const normalizedDocs = isOrgs ? docs.map(normalizeOrgDoc) : docs;
    const items = normalizedDocs.map((doc) => {
      const score =
        typeof doc?.completenessScore === "number"
          ? doc.completenessScore
          : undefined;
      const missing = Array.isArray(doc?.missingFields)
        ? doc.missingFields
        : undefined;
      const complete =
        typeof doc?.isComplete === "boolean" ? doc.isComplete : undefined;

      if (
        score !== undefined &&
        missing !== undefined &&
        complete !== undefined
      ) {
        return doc;
      }

      return {
        ...doc,
        ...computeListingCompleteness(doc),
      };
    });

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
