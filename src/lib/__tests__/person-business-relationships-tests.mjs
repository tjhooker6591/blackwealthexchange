import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

async function transpileFile({ sourcePath, targetPath, replacements = [] }) {
  let source = await fs.readFile(sourcePath, "utf8");
  for (const [from, to] of replacements) {
    source = source.replace(from, to);
  }
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  await fs.writeFile(targetPath, transpiled, "utf8");
}

await fs.writeFile(
  path.join(tmpDir, "directoryOwnership-pbr-env-stub.mjs"),
  'export function getJwtSecret() { return "test-secret"; }\n',
  "utf8",
);

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/marketplace/businessAttribution.ts"),
  targetPath: path.join(tmpDir, "businessAttribution-pbr-testable.mjs"),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/directoryProfileContract.ts"),
  targetPath: path.join(tmpDir, "directoryProfileContract-pbr-testable.mjs"),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/directoryOwnership.ts"),
  targetPath: path.join(tmpDir, "directoryOwnership-pbr-testable.mjs"),
  replacements: [
    ['from "@/lib/env";', 'from "./directoryOwnership-pbr-env-stub.mjs";'],
  ],
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/activity360.ts"),
  targetPath: path.join(tmpDir, "activity360-pbr-testable.mjs"),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/business360.ts"),
  targetPath: path.join(tmpDir, "business360-pbr-testable.mjs"),
  replacements: [
    [
      'from "./directoryOwnership";',
      'from "./directoryOwnership-pbr-testable.mjs";',
    ],
    [
      'from "./marketplace/businessAttribution";',
      'from "./businessAttribution-pbr-testable.mjs";',
    ],
    ['from "./activity360";', 'from "./activity360-pbr-testable.mjs";'],
  ],
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/personBusinessRelationships.ts"),
  targetPath: path.join(tmpDir, "personBusinessRelationships-testable.mjs"),
  replacements: [
    [
      'from "./directoryOwnership";',
      'from "./directoryOwnership-pbr-testable.mjs";',
    ],
    ['from "./business360";', 'from "./business360-pbr-testable.mjs";'],
    [
      'from "./directoryProfileContract";',
      'from "./directoryProfileContract-pbr-testable.mjs";',
    ],
  ],
});

const {
  listPersonBusinessRelationships,
  listVerifiedManagedBusinessSummaries,
  resolvePersonBusinessRelationship,
} = await import(
  `file://${path.join(tmpDir, "personBusinessRelationships-testable.mjs")}`
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getByPath(doc, key) {
  return key.split(".").reduce((current, part) => current?.[part], doc);
}

function valuesEqual(left, right) {
  return String(left) === String(right);
}

function matchesCondition(docValue, condition) {
  if (condition && typeof condition === "object" && !Array.isArray(condition)) {
    if ("$in" in condition) {
      return condition.$in.some((entry) =>
        Array.isArray(docValue)
          ? docValue.some((value) => valuesEqual(value, entry))
          : valuesEqual(docValue, entry),
      );
    }
    if ("$exists" in condition) {
      return condition.$exists
        ? docValue !== undefined
        : docValue === undefined;
    }
    if ("$ne" in condition) {
      return !valuesEqual(docValue, condition.$ne);
    }
  }

  if (Array.isArray(docValue)) {
    return docValue.some((entry) => valuesEqual(entry, condition));
  }

  return valuesEqual(docValue, condition);
}

function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  if (Array.isArray(filter.$and)) {
    return filter.$and.every((entry) => matchesFilter(doc, entry));
  }
  if (Array.isArray(filter.$or)) {
    return filter.$or.some((entry) => matchesFilter(doc, entry));
  }

  return Object.entries(filter).every(([key, condition]) => {
    if (key === "$and" || key === "$or") return true;
    return matchesCondition(getByPath(doc, key), condition);
  });
}

class MockCursor {
  constructor(docs) {
    this.docs = docs;
  }

  sort(sortSpec = {}) {
    const entries = Object.entries(sortSpec);
    this.docs.sort((left, right) => {
      for (const [key, direction] of entries) {
        const a = getByPath(left, key);
        const b = getByPath(right, key);
        if (a == null && b == null) continue;
        if (a == null) return 1;
        if (b == null) return -1;
        if (a > b) return direction === -1 ? -1 : 1;
        if (a < b) return direction === -1 ? 1 : -1;
      }
      return 0;
    });
    return this;
  }

  limit(count) {
    this.docs = this.docs.slice(0, count);
    return this;
  }

  async toArray() {
    return clone(this.docs);
  }
}

class MockCollection {
  constructor(docs = []) {
    this.docs = docs.map((doc) => clone(doc));
  }

  async findOne(filter = {}, options = {}) {
    const doc = this.docs.find((entry) => matchesFilter(entry, filter)) || null;
    if (!doc) return null;
    if (!options.projection) return clone(doc);
    const projected = {};
    for (const [key, include] of Object.entries(options.projection)) {
      if (include) projected[key] = getByPath(doc, key);
    }
    return clone(projected);
  }

  find(filter = {}, options = {}) {
    let rows = this.docs.filter((entry) => matchesFilter(entry, filter));
    if (options.projection) {
      rows = rows.map((doc) => {
        const projected = {};
        for (const [key, include] of Object.entries(options.projection)) {
          if (include) projected[key] = getByPath(doc, key);
        }
        return projected;
      });
    }
    return new MockCursor(rows);
  }
}

class MockDb {
  constructor(fixtures) {
    this.collections = new Map(
      Object.entries(fixtures).map(([name, docs]) => [
        name,
        new MockCollection(docs),
      ]),
    );
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection([]));
    }
    return this.collections.get(name);
  }
}

const fixtures = {
  users: [
    {
      _id: "user-owner-1",
      email: "owner@example.com",
      accountType: "user",
      isAdmin: false,
    },
    {
      _id: "user-manager-2",
      email: "manager@example.com",
      accountType: "user",
      isAdmin: false,
    },
    {
      _id: "user-seller-only",
      email: "seller@example.com",
      accountType: "seller",
      isAdmin: false,
    },
    {
      _id: "user-multi",
      email: "multi@example.com",
      accountType: "user",
      isAdmin: false,
    },
    {
      _id: "user-seller-weak",
      email: "weak@example.com",
      accountType: "user",
      isAdmin: false,
    },
  ],
  businesses: [
    {
      _id: "biz-owner",
      businessName: "Owner Biz",
      alias: "owner-biz",
      slug: "owner-biz",
      status: "active",
      publicListingStatus: "ownership_verified",
      claimedByUserId: "user-owner-1",
      managedByUserId: "user-owner-1",
      ownerUserIds: ["user-owner-1"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-managed",
      businessName: "Managed Biz",
      alias: "managed-biz",
      slug: "managed-biz",
      status: "active",
      publicListingStatus: "ownership_verified",
      claimedByUserId: "another-owner",
      managedByUserId: "user-manager-2",
      ownerUserIds: ["another-owner"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-seller",
      businessName: "Seller Biz",
      alias: "seller-biz",
      slug: "seller-biz",
      status: "active",
      publicListingStatus: "listed",
    },
    {
      _id: "biz-multi-owner",
      businessName: "Multi Owner Biz",
      alias: "multi-owner-biz",
      slug: "multi-owner-biz",
      status: "active",
      publicListingStatus: "ownership_verified",
      claimedByUserId: "user-multi",
      managedByUserId: "user-multi",
      ownerUserIds: ["user-multi"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-multi-seller",
      businessName: "Multi Seller Biz",
      alias: "multi-seller-biz",
      slug: "multi-seller-biz",
      status: "active",
      publicListingStatus: "listed",
    },
  ],
  business_claims: [
    {
      _id: "claim-owner-1",
      businessId: "biz-owner",
      userId: "user-owner-1",
      claimantEmail: "owner@example.com",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "claim-managed-1",
      businessId: "biz-managed",
      userId: "user-manager-2",
      claimantEmail: "manager@example.com",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "claim-multi-1",
      businessId: "biz-multi-owner",
      userId: "user-multi",
      claimantEmail: "multi@example.com",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  ownership_reviews: [
    {
      _id: "review-owner-1",
      businessId: "biz-owner",
      userId: "user-owner-1",
      reviewStatus: "ownership_verified",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "review-managed-1",
      businessId: "biz-managed",
      userId: "user-manager-2",
      reviewStatus: "ownership_verified",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "review-multi-1",
      businessId: "biz-multi-owner",
      userId: "user-multi",
      reviewStatus: "ownership_verified",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  business_memberships: [
    {
      _id: "membership-owner-row",
      membershipId: "membership-owner",
      userId: "user-owner-1",
      businessId: "biz-owner",
      ownershipReviewStatus: "ownership_verified",
      managementAccessStatus: "approved",
      membershipStatus: "active",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "membership-managed-row",
      membershipId: "membership-managed",
      userId: "user-manager-2",
      businessId: "biz-managed",
      ownershipReviewStatus: "ownership_verified",
      managementAccessStatus: "approved",
      membershipStatus: "active",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "membership-multi-row",
      membershipId: "membership-multi",
      userId: "user-multi",
      businessId: "biz-multi-owner",
      ownershipReviewStatus: "ownership_verified",
      managementAccessStatus: "approved",
      membershipStatus: "active",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  sellers: [
    {
      _id: "seller-owner-1",
      userId: "user-owner-1",
      email: "owner@example.com",
      businessId: "biz-owner",
      stripeAccountId: "acct_owner",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "seller-direct-1",
      userId: "user-seller-only",
      email: "seller@example.com",
      businessId: "biz-seller",
      stripeAccountId: "acct_seller",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "seller-multi-1",
      userId: "user-multi",
      email: "multi@example.com",
      businessId: "biz-multi-seller",
      stripeAccountId: "acct_multi",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "seller-weak-1",
      userId: "user-seller-weak",
      email: "weak@example.com",
      stripeAccountId: "acct_weak",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "seller-email-only-1",
      userId: "another-user",
      email: "weak@example.com",
      businessId: "biz-owner",
      stripeAccountId: "acct_email_only",
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  products: [
    {
      _id: "product-owner-1",
      businessId: "biz-owner",
      sellerId: "seller-owner-1",
      status: "active",
      isPublished: true,
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "product-seller-1",
      businessId: "biz-seller",
      sellerId: "seller-direct-1",
      status: "active",
      isPublished: true,
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "product-multi-1",
      businessId: "biz-multi-seller",
      sellerId: "seller-multi-1",
      status: "active",
      isPublished: true,
      updatedAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  directory_listings: [],
  membership_fulfillment: [],
  membership_onboarding: [],
  orders: [],
  payments: [],
  advertising_requests: [],
  ad_purchases: [],
  featured_sponsor_schedule: [],
  support_tickets: [],
  flow_events: [],
  search_quality_events: [],
  organizations: [],
  employers: [
    {
      _id: "employer-email-only-1",
      email: "weak@example.com",
      companyName: "Weak Employer",
      businessId: "biz-owner",
    },
  ],
  jobs: [
    {
      _id: "job-email-only-1",
      employerEmail: "weak@example.com",
      company: "Weak Employer",
    },
  ],
};

const db = new MockDb(fixtures);

const owned = await listPersonBusinessRelationships(db, {
  userId: "user-owner-1",
  includeBusiness360: true,
});
assert.equal(owned.ok, true);
assert.equal(owned.anchor, "users._id");
assert.equal(owned.relationships.length, 1);
assert.deepEqual(owned.relationships[0].relationshipTypes, [
  "VERIFIED_REPRESENTATIVE",
  "OWNER",
  "MANAGER",
  "SELLER",
]);
assert.equal(owned.relationships[0].primaryRelationshipType, "OWNER");
assert.equal(owned.relationships[0].verifiedStatus, true);
assert.equal(owned.relationships[0].trustLevel, "AUTHORITATIVE");
assert.equal(owned.relationships[0].sellerId, "seller-owner-1");
assert.equal(owned.relationships[0].membershipId, "membership-owner");
assert.equal(owned.relationships[0].businessSummary.name, "Owner Biz");
assert.equal(
  owned.relationships[0].business360.identity.data.businessId,
  "biz-owner",
);

const managed = await listPersonBusinessRelationships(db, {
  userId: "user-manager-2",
});
assert.equal(managed.ok, true);
assert.equal(managed.relationships.length, 1);
assert.deepEqual(managed.relationships[0].relationshipTypes, [
  "VERIFIED_REPRESENTATIVE",
  "MANAGER",
]);
assert.equal(
  managed.relationships[0].primaryRelationshipType,
  "VERIFIED_REPRESENTATIVE",
);
assert.equal(managed.relationships[0].trustLevel, "AUTHORITATIVE");

const sellerDirect = await listPersonBusinessRelationships(db, {
  userId: "user-seller-only",
});
assert.equal(sellerDirect.ok, true);
assert.equal(sellerDirect.relationships.length, 1);
assert.deepEqual(sellerDirect.relationships[0].relationshipTypes, ["SELLER"]);
assert.equal(sellerDirect.relationships[0].trustLevel, "SUPPORTED");
assert.equal(sellerDirect.relationships[0].verifiedStatus, false);
assert.equal(sellerDirect.relationships[0].businessId, "biz-seller");

const multi = await listPersonBusinessRelationships(db, {
  userId: "user-multi",
});
assert.equal(multi.ok, true);
assert.equal(multi.relationships.length, 2);
assert.deepEqual(
  multi.relationships.map((relationship) => relationship.businessId).sort(),
  ["biz-multi-owner", "biz-multi-seller"],
);

const weak = await listPersonBusinessRelationships(db, {
  userId: "user-seller-weak",
});
assert.equal(weak.ok, true);
assert.equal(weak.relationships.length, 0);
assert.equal(
  weak.unresolvedCandidates.some(
    (candidate) =>
      candidate.candidateType === "SELLER" &&
      /does not create an authoritative business relationship/i.test(
        candidate.note,
      ),
  ),
  true,
);
assert.equal(
  weak.unresolvedCandidates.some(
    (candidate) =>
      candidate.candidateType === "EMPLOYER" &&
      candidate.provenance.some((item) => item.kind === "EMAIL_ONLY"),
  ),
  true,
);

const missing = await listPersonBusinessRelationships(db, {
  userId: "   ",
});
assert.equal(missing.ok, false);
assert.equal(missing.code, "MISSING_USER_ID");

const resolvedSpecific = await resolvePersonBusinessRelationship(db, {
  userId: "user-owner-1",
  businessId: "biz-owner",
  includeBusiness360: true,
});
assert.equal(resolvedSpecific.ok, true);
assert.equal(resolvedSpecific.relationship?.businessSummary.alias, "owner-biz");
assert.equal(
  resolvedSpecific.relationship?.business360?.identity.data.name,
  "Owner Biz",
);

const managedSummaries = await listVerifiedManagedBusinessSummaries(
  db,
  "user-owner-1",
);
assert.equal(managedSummaries.length, 1);
assert.equal(managedSummaries[0].id, "biz-owner");
assert.equal(managedSummaries[0].publicHref, "/business/owner-biz");

console.log("person-business-relationships-tests: ok");
