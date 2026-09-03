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
  path.join(tmpDir, "directoryOwnership-person360-env-stub.mjs"),
  'export function getJwtSecret() { return "test-secret"; }\n',
  "utf8",
);

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/marketplace/businessAttribution.ts"),
  targetPath: path.join(tmpDir, "businessAttribution-person360-testable.mjs"),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/directoryProfileContract.ts"),
  targetPath: path.join(
    tmpDir,
    "directoryProfileContract-person360-testable.mjs",
  ),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/directoryOwnership.ts"),
  targetPath: path.join(tmpDir, "directoryOwnership-person360-testable.mjs"),
  replacements: [
    [
      'from "@/lib/env";',
      'from "./directoryOwnership-person360-env-stub.mjs";',
    ],
  ],
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/business360.ts"),
  targetPath: path.join(tmpDir, "business360-person360-testable.mjs"),
  replacements: [
    [
      'from "./directoryOwnership";',
      'from "./directoryOwnership-person360-testable.mjs";',
    ],
    [
      'from "./marketplace/businessAttribution";',
      'from "./businessAttribution-person360-testable.mjs";',
    ],
  ],
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/personBusinessRelationships.ts"),
  targetPath: path.join(
    tmpDir,
    "personBusinessRelationships-person360-testable.mjs",
  ),
  replacements: [
    [
      'from "./directoryOwnership";',
      'from "./directoryOwnership-person360-testable.mjs";',
    ],
    ['from "./business360";', 'from "./business360-person360-testable.mjs";'],
    [
      'from "./directoryProfileContract";',
      'from "./directoryProfileContract-person360-testable.mjs";',
    ],
  ],
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/black-card-state.ts"),
  targetPath: path.join(tmpDir, "black-card-state-person360-testable.mjs"),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/person360.ts"),
  targetPath: path.join(tmpDir, "person360-testable.mjs"),
  replacements: [
    [
      'from "./black-card-state";',
      'from "./black-card-state-person360-testable.mjs";',
    ],
    [
      'from "./personBusinessRelationships";',
      'from "./personBusinessRelationships-person360-testable.mjs";',
    ],
    ['from "./business360";', 'from "./business360-person360-testable.mjs";'],
  ],
});

const { resolvePerson360 } = await import(
  `file://${path.join(tmpDir, "person360-testable.mjs")}`
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
      _id: "user-basic",
      email: "basic@example.com",
      accountType: "user",
      isAdmin: false,
      currentPlan: "free",
      premiumStatus: "inactive",
    },
    {
      _id: "user-owner",
      email: "owner@example.com",
      accountType: "user",
      isAdmin: false,
      fullName: "Owner User",
      currentPlan: "founding",
      premiumStatus: "active",
      blackCardTier: "signature",
      blackCardStatus: "active",
      blackCardMemberSince: "2026-09-01T00:00:00.000Z",
      blackCardPlanExpiresAt: "2027-09-01T00:00:00.000Z",
    },
    {
      _id: "user-seller",
      email: "seller@example.com",
      accountType: "seller",
      isAdmin: false,
      currentPlan: "premium",
      premiumStatus: "active",
      creatorSubtype: "music",
      creatorOnboardingStatus: "onboarded",
      creatorPlanStatus: "active",
      creatorReady: true,
    },
    {
      _id: "user-multi",
      email: "multi@example.com",
      accountType: "user",
      isAdmin: false,
      currentPlan: "premium",
      premiumStatus: "active",
    },
    {
      _id: "user-employer-weak",
      email: "weak@example.com",
      accountType: "user",
      isAdmin: false,
      currentPlan: "free",
      premiumStatus: "inactive",
    },
    {
      _id: "user-employer-strong",
      email: "employer@example.com",
      accountType: "employer",
      isAdmin: false,
      currentPlan: "free",
      premiumStatus: "inactive",
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
      claimedByUserId: "user-owner",
      ownerUserIds: ["user-owner"],
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
      _id: "biz-multi-1",
      businessName: "Multi One",
      alias: "multi-one",
      slug: "multi-one",
      status: "active",
      publicListingStatus: "ownership_verified",
      claimedByUserId: "user-multi",
      ownerUserIds: ["user-multi"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-multi-2",
      businessName: "Multi Two",
      alias: "multi-two",
      slug: "multi-two",
      status: "active",
      publicListingStatus: "ownership_verified",
      managedByUserId: "user-multi",
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
  ],
  business_claims: [
    {
      _id: "claim-owner",
      userId: "user-owner",
      businessId: "biz-owner",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "claim-multi",
      userId: "user-multi",
      businessId: "biz-multi-1",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "claim-multi-managed",
      userId: "user-multi",
      businessId: "biz-multi-2",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  ownership_reviews: [
    {
      _id: "review-owner",
      userId: "user-owner",
      businessId: "biz-owner",
      reviewStatus: "ownership_verified",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "review-multi",
      userId: "user-multi",
      businessId: "biz-multi-1",
      reviewStatus: "ownership_verified",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "review-multi-managed",
      userId: "user-multi",
      businessId: "biz-multi-2",
      reviewStatus: "ownership_verified",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  business_memberships: [
    {
      _id: "membership-owner",
      membershipId: "membership-owner",
      userId: "user-owner",
      businessId: "biz-owner",
      membershipStatus: "active",
      ownershipReviewStatus: "ownership_verified",
      managementAccessStatus: "approved",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "membership-multi",
      membershipId: "membership-multi",
      userId: "user-multi",
      businessId: "biz-multi-2",
      membershipStatus: "active",
      ownershipReviewStatus: "pending_review",
      managementAccessStatus: "approved",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  sellers: [
    {
      _id: "seller-profile",
      userId: "user-seller",
      email: "seller@example.com",
      businessId: "biz-seller",
      creatorSubtype: "music",
      creatorPlanStatus: "active",
      creatorReady: true,
      creatorOnboardingStatus: "onboarded",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "seller-multi",
      userId: "user-multi",
      email: "multi@example.com",
      businessId: "biz-multi-2",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "seller-email-only",
      userId: "someone-else",
      email: "weak@example.com",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  products: [
    {
      _id: "product-seller",
      sellerId: "seller-profile",
      businessId: "biz-seller",
      status: "active",
      isPublished: true,
    },
  ],
  affiliates: [
    {
      _id: "affiliate-seller",
      userId: "user-seller",
      status: "active",
      referralCode: "SELLER1",
    },
  ],
  consultant_profiles: [
    {
      _id: "consultant-seller",
      userId: "user-seller",
      status: "active",
      completenessScore: 92,
    },
  ],
  black_card_memberships: [
    {
      _id: "bc-member-owner",
      userId: "user-owner",
      status: "active",
      membershipStatus: "active",
      tier: "signature",
      memberSince: "2026-09-01T00:00:00.000Z",
      planExpiresAt: "2027-09-01T00:00:00.000Z",
    },
  ],
  black_card_cards: [
    {
      _id: "bc-card-owner",
      userId: "user-owner",
      status: "active",
      issuedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  black_card_digital_requests: [
    {
      _id: "bc-request-seller",
      userId: "user-seller",
      status: "pending",
      createdAt: "2026-09-02T00:00:00.000Z",
    },
  ],
  jobs: [
    {
      _id: "job-employer-1",
      userId: "user-employer-strong",
      company: "Employer Co",
      createdAt: "2026-09-03T00:00:00.000Z",
    },
    {
      _id: "job-email-only",
      employerEmail: "weak@example.com",
      company: "Weak Co",
      createdAt: "2026-09-03T00:00:00.000Z",
    },
  ],
  employers: [
    {
      _id: "employer-strong",
      userId: "user-employer-strong",
      companyName: "Employer Co",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "employer-email-only",
      email: "weak@example.com",
      companyName: "Weak Co",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  flow_events: [],
  search_quality_events: [],
  directory_listings: [],
  payments: [],
  orders: [],
  ad_purchases: [],
  sponsor_schedules: [],
  support_tickets: [],
  organizations: [],
  entity_claims: [],
  membership_onboarding: [],
  membership_fulfillment: [],
};

const db = new MockDb(fixtures);

{
  const result = await resolvePerson360(db, { userId: "user-basic" });
  assert.equal(result.ok, true);
  assert.equal(result.identity.personId, "user-basic");
  assert.equal(result.membership.state, "FREE");
  assert.deepEqual(result.businessRelationships, []);
  assert.equal(result.blackCard.state, "FREE_NO_REQUEST");
}

{
  const result = await resolvePerson360(db, { userId: "user-owner" });
  assert.equal(result.ok, true);
  assert.equal(result.membership.state, "FOUNDING");
  assert.equal(result.blackCard.state, "FOUNDING_ACTIVE_CARD");
  assert.equal(result.blackCard.activeMembershipId, "bc-member-owner");
  assert.equal(result.roles.includes("BUSINESS_OWNER"), true);
  assert.equal(result.roles.includes("VERIFIED_REPRESENTATIVE"), true);
  assert.equal(result.roles.includes("BLACK_CARD_MEMBER"), true);
  assert.equal(result.businessRelationships.length, 1);
}

{
  const result = await resolvePerson360(db, { userId: "user-seller" });
  assert.equal(result.ok, true);
  assert.equal(result.membership.state, "PREMIUM");
  assert.equal(result.seller.state, "ACTIVE");
  assert.equal(result.affiliate.state, "ACTIVE");
  assert.equal(result.consultant.state, "ACTIVE");
  assert.equal(result.creator.state, "ACTIVE");
  assert.equal(result.blackCard.state, "PREMIUM_PENDING_REQUEST");
  assert.equal(result.roles.includes("SELLER"), true);
  assert.equal(result.roles.includes("AFFILIATE"), true);
  assert.equal(result.roles.includes("CONSULTANT"), true);
  assert.equal(result.roles.includes("CREATOR"), true);
}

{
  const result = await resolvePerson360(db, { userId: "user-multi" });
  assert.equal(result.ok, true);
  assert.equal(result.businessRelationships.length, 2);
  assert.equal(result.roles.includes("BUSINESS_OWNER"), true);
  assert.equal(result.roles.includes("BUSINESS_MANAGER"), true);
  assert.equal(result.roles.includes("SELLER"), true);
}

{
  const result = await resolvePerson360(db, {
    userId: "user-employer-strong",
  });
  assert.equal(result.ok, true);
  assert.equal(result.employer.state, "ACTIVE");
  assert.equal(result.employer.postedJobCount, 1);
  assert.equal(result.roles.includes("EMPLOYER"), true);
}

{
  const result = await resolvePerson360(db, {
    userId: "user-employer-weak",
  });
  assert.equal(result.ok, true);
  assert.equal(result.employer.state, "NOT_PRESENT");
  assert.equal(
    result.unresolvedRelationships.some(
      (candidate) => candidate.candidateType === "EMPLOYER",
    ),
    true,
  );
  assert.equal(
    result.employer.provenance.some(
      (item) => item.kind === "EMAIL_ONLY_REJECTED" && !item.authoritative,
    ),
    true,
  );
}

{
  const result = await resolvePerson360(db, { userId: "" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "MISSING_USER_ID");
}

{
  const result = await resolvePerson360(db, { userId: "missing-user" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "USER_NOT_FOUND");
}

console.log("person360-tests: ok");
