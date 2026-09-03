import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const businessAttributionSourcePath = path.join(
  repoRoot,
  "src/lib/marketplace/businessAttribution.ts",
);
const businessAttributionTargetPath = path.join(
  tmpDir,
  "businessAttribution-business360-testable.mjs",
);
const businessAttributionSource = await fs.readFile(
  businessAttributionSourcePath,
  "utf8",
);
await fs.writeFile(
  businessAttributionTargetPath,
  ts.transpileModule(businessAttributionSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  "utf8",
);

const directoryOwnershipSourcePath = path.join(
  repoRoot,
  "src/lib/directoryOwnership.ts",
);
const directoryOwnershipStubPath = path.join(
  tmpDir,
  "directoryOwnership-business360-env-stub.mjs",
);
const directoryOwnershipTargetPath = path.join(
  tmpDir,
  "directoryOwnership-business360-testable.mjs",
);
const directoryOwnershipSource = await fs.readFile(
  directoryOwnershipSourcePath,
  "utf8",
);
await fs.writeFile(
  directoryOwnershipStubPath,
  'export function getJwtSecret() { return "test-secret"; }\n',
  "utf8",
);
await fs.writeFile(
  directoryOwnershipTargetPath,
  ts.transpileModule(
    directoryOwnershipSource.replace(
      'from "@/lib/env";',
      'from "./directoryOwnership-business360-env-stub.mjs";',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  "utf8",
);

const business360SourcePath = path.join(repoRoot, "src/lib/business360.ts");
const business360TargetPath = path.join(tmpDir, "business360-testable.mjs");
const activity360SourcePath = path.join(repoRoot, "src/lib/activity360.ts");
const activity360TargetPath = path.join(tmpDir, "activity360-testable.mjs");
const activity360Source = await fs.readFile(activity360SourcePath, "utf8");
await fs.writeFile(
  activity360TargetPath,
  ts.transpileModule(activity360Source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  "utf8",
);
const business360Source = await fs.readFile(business360SourcePath, "utf8");
const business360Transpiled = ts.transpileModule(
  business360Source
    .replace(
      'from "./directoryOwnership";',
      'from "./directoryOwnership-business360-testable.mjs";',
    )
    .replace(
      'from "./marketplace/businessAttribution";',
      'from "./businessAttribution-business360-testable.mjs";',
    )
    .replace('from "./activity360";', 'from "./activity360-testable.mjs";'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
await fs.writeFile(business360TargetPath, business360Transpiled, "utf8");

const { resolveBusiness360, normalizeBusiness360Sections } = await import(
  `file://${business360TargetPath}`
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

  async findOne(filter = {}) {
    return clone(this.docs.find((doc) => matchesFilter(doc, filter)) || null);
  }

  find(filter = {}, options = {}) {
    let rows = this.docs.filter((doc) => matchesFilter(doc, filter));
    if (options.projection) {
      rows = rows.map((doc) => {
        const projected = {};
        for (const [key, include] of Object.entries(options.projection)) {
          if (include) {
            projected[key] = getByPath(doc, key);
          }
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
  businesses: [
    {
      _id: "biz-verified",
      businessName: "Verified Cafe",
      alias: "verified-cafe",
      slug: "verified-cafe-slug",
      status: "active",
      publicListingStatus: "listed",
      claimedByUserId: "user-owner-1",
      managedByUserId: "user-manager-1",
      ownerUserIds: ["user-owner-1", "user-owner-2"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-seller",
      businessName: "Seller Shop",
      alias: "seller-shop",
      status: "active",
    },
    {
      _id: "biz-member",
      businessName: "Member House",
      alias: "member-house",
      status: "active",
    },
    {
      _id: "biz-partial",
      businessName: "Partial Goods",
      alias: "partial-goods",
      status: "active",
    },
    {
      _id: "biz-bare",
      businessName: "Bare Bones",
      status: "draft",
    },
    {
      _id: "biz-jobs-weak",
      businessName: "Weak Jobs Co",
      alias: "weak-jobs-co",
      status: "active",
    },
    {
      _id: "biz-org-unresolved",
      businessName: "Parallel Org Business",
      alias: "parallel-org-business",
      organizationSlug: "parallel-org",
      status: "active",
    },
  ],
  directory_listings: [
    {
      _id: "listing-verified",
      businessId: "biz-verified",
      businessIdReal: "biz-verified",
      status: "approved",
      tier: "featured",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    },
  ],
  business_claims: [
    {
      _id: "claim-verified",
      businessId: "biz-verified",
      userId: "user-owner-1",
      claimantEmail: "owner@verified.example",
      claimStatus: "ownership_verified",
      updatedAt: "2026-08-03T00:00:00.000Z",
    },
  ],
  ownership_reviews: [
    {
      _id: "review-verified",
      businessId: "biz-verified",
      userId: "user-owner-1",
      reviewStatus: "ownership_verified",
      updatedAt: "2026-08-04T00:00:00.000Z",
    },
  ],
  business_memberships: [
    {
      _id: "membership-row-1",
      businessId: "biz-member",
      membershipId: "member-001",
      membershipStatus: "active",
      ownershipReviewStatus: "ownership_verified",
      managementAccessStatus: "enabled",
      createdAt: "2026-08-05T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:00.000Z",
    },
  ],
  membership_fulfillment: [
    {
      membershipId: "member-001",
      fulfillmentStatus: "complete",
    },
  ],
  membership_onboarding: [
    {
      membershipId: "member-001",
      onboardingStatus: "complete",
    },
  ],
  sellers: [
    {
      _id: "seller-direct",
      businessId: "biz-seller",
      stripeAccountId: "acct_direct",
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-07T00:00:00.000Z",
    },
    {
      _id: "seller-partial",
      stripeAccountId: "acct_partial",
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-07T00:00:00.000Z",
    },
  ],
  products: [
    {
      _id: "product-direct",
      businessId: "biz-seller",
      sellerId: "seller-direct",
      status: "active",
      isPublished: true,
      createdAt: "2026-08-07T00:00:00.000Z",
      updatedAt: "2026-08-08T00:00:00.000Z",
    },
    {
      _id: "product-partial",
      businessId: "biz-partial",
      sellerId: "seller-partial",
      status: "active",
      isPublished: true,
      createdAt: "2026-08-09T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    },
  ],
  orders: [
    {
      _id: "order-direct",
      businessId: "biz-seller",
      sellerId: "seller-direct",
      productId: "product-direct",
      createdAt: "2026-08-11T00:00:00.000Z",
    },
    {
      _id: "order-product-linked",
      productId: "product-partial",
      sellerId: "seller-partial",
      createdAt: "2026-08-12T00:00:00.000Z",
    },
  ],
  payments: [
    {
      _id: "payment-direct",
      businessId: "biz-seller",
      sellerId: "seller-direct",
      stripeSessionId: "cs_direct",
      metadata: {
        businessId: "biz-seller",
        productId: "product-direct",
      },
      createdAt: "2026-08-11T00:00:00.000Z",
    },
    {
      _id: "payment-product-linked",
      sellerId: "seller-partial",
      stripeSessionId: "cs_partial",
      metadata: {
        productId: "product-partial",
      },
      createdAt: "2026-08-12T00:00:00.000Z",
    },
  ],
  advertising_requests: [
    {
      _id: "ad-req-1",
      businessId: "biz-seller",
      createdAt: "2026-08-13T00:00:00.000Z",
    },
  ],
  ad_purchases: [
    {
      _id: "ad-purchase-1",
      businessId: "biz-seller",
      campaignId: "campaign-1",
      createdAt: "2026-08-13T01:00:00.000Z",
    },
  ],
  featured_sponsor_schedule: [
    {
      _id: "sponsor-slot-1",
      businessId: "biz-seller",
      campaignId: "campaign-1",
      weekStart: "2026-08-17T00:00:00.000Z",
    },
  ],
  jobs: [
    {
      _id: "job-weak-1",
      company: "Weak Jobs Co",
      contactEmail: "hr@weakjobs.example",
      createdAt: "2026-08-14T00:00:00.000Z",
    },
  ],
  employers: [
    {
      _id: "employer-weak-1",
      companyName: "Weak Jobs Co",
      email: "hr@weakjobs.example",
      createdAt: "2026-08-14T01:00:00.000Z",
    },
  ],
  support_tickets: [
    {
      _id: "support-1",
      ticketId: "SUP-1",
      relatedBusinessId: "biz-seller",
      status: "New",
      category: "Marketplace",
      createdAt: "2026-08-15T00:00:00.000Z",
      updatedAt: "2026-08-15T01:00:00.000Z",
    },
  ],
  flow_events: [
    {
      _id: "event-1",
      businessId: "biz-seller",
      eventType: "product_view",
      createdAt: "2026-08-16T00:00:00.000Z",
    },
  ],
  search_quality_events: [
    {
      _id: "search-event-1",
      selectedBusinessId: "biz-seller",
      createdAt: "2026-08-16T01:00:00.000Z",
    },
  ],
  organizations: [
    {
      _id: "org-separate-1",
      slug: "separate-org",
      name: "Separate Org",
    },
  ],
};

const db = new MockDb(fixtures);

assert.deepEqual(normalizeBusiness360Sections(["seller", "commerce"]), [
  "identity",
  "seller",
  "commerce",
]);

const verified = await resolveBusiness360(db, { businessId: "biz-verified" });
assert.equal(verified.ok, true);
assert.equal(verified.identity.data.businessId, "biz-verified");
assert.equal(verified.directory.state, "LINKED");
assert.equal(verified.directory.data.latestListingId, "listing-verified");
assert.equal(verified.ownership.state, "LINKED");
assert.deepEqual(verified.ownership.data.verifiedRepresentativeUserIds, [
  "user-owner-1",
]);
assert.equal(verified.ownership.provenance[0].kind, "VERIFIED");

const sellerLinked = await resolveBusiness360(db, { businessId: "biz-seller" });
assert.equal(sellerLinked.ok, true);
assert.equal(sellerLinked.seller.state, "LINKED");
assert.equal(sellerLinked.seller.data.linkageSource, "seller_and_product");
assert.deepEqual(sellerLinked.seller.data.directSellerIds, ["seller-direct"]);
assert.deepEqual(sellerLinked.seller.data.stripeAccountIds, ["acct_direct"]);
assert.equal(sellerLinked.commerce.state, "LINKED");
assert.equal(sellerLinked.commerce.data.linkedOrderCount, 1);
assert.equal(sellerLinked.commerce.data.linkedPaymentCount, 1);
assert.equal(sellerLinked.support.state, "LINKED");
assert.equal(sellerLinked.activity.state, "LINKED");
assert.equal(sellerLinked.advertising.state, "LINKED");

const membershipLinked = await resolveBusiness360(db, {
  businessId: "biz-member",
});
assert.equal(membershipLinked.ok, true);
assert.equal(membershipLinked.membership.state, "LINKED");
assert.equal(membershipLinked.membership.data.latestMembershipId, "member-001");
assert.equal(membershipLinked.membership.data.fulfillmentStatus, "complete");
assert.equal(membershipLinked.membership.data.onboardingStatus, "complete");
assert.equal(
  membershipLinked.membership.provenance[0].kind,
  "MEMBERSHIP_LINKED",
);

const partialSeller = await resolveBusiness360(db, {
  businessId: "biz-partial",
});
assert.equal(partialSeller.ok, true);
assert.equal(partialSeller.seller.state, "PARTIALLY_LINKED");
assert.equal(partialSeller.seller.data.linkageSource, "product.businessId");
assert.deepEqual(partialSeller.seller.data.productLinkedSellerIds, [
  "seller-partial",
]);
assert.deepEqual(partialSeller.seller.data.directSellerIds, []);
assert.equal(partialSeller.commerce.state, "LINKED");
assert.equal(partialSeller.commerce.data.productLinkedOrderCount, 1);
assert.equal(partialSeller.commerce.data.productLinkedPaymentCount, 1);

const bare = await resolveBusiness360(db, { businessId: "biz-bare" });
assert.equal(bare.ok, true);
assert.equal(bare.directory.state, "NOT_LINKED");
assert.equal(bare.ownership.state, "NOT_LINKED");
assert.equal(bare.membership.state, "NOT_LINKED");
assert.equal(bare.seller.state, "NOT_LINKED");
assert.equal(bare.commerce.state, "NOT_LINKED");
assert.equal(bare.advertising.state, "NOT_LINKED");
assert.equal(bare.jobs.state, "NOT_LINKED");
assert.equal(bare.support.state, "NOT_LINKED");
assert.equal(bare.activity.state, "NOT_LINKED");
assert.equal(bare.organization.state, "NOT_APPLICABLE");

const missingId = await resolveBusiness360(db, { businessId: "   " });
assert.equal(missingId.ok, false);
assert.equal(missingId.code, "MISSING_BUSINESS_ID");

const notFound = await resolveBusiness360(db, { businessId: "biz-missing" });
assert.equal(notFound.ok, false);
assert.equal(notFound.code, "BUSINESS_NOT_FOUND");

const weakJobs = await resolveBusiness360(db, { businessId: "biz-jobs-weak" });
assert.equal(weakJobs.ok, true);
assert.equal(weakJobs.jobs.state, "NOT_LINKED");
assert.match(
  weakJobs.jobs.provenance[0].note,
  /does not promote company text or employer email/i,
);

const unresolvedOrganization = await resolveBusiness360(db, {
  businessId: "biz-org-unresolved",
});
assert.equal(unresolvedOrganization.ok, true);
assert.equal(unresolvedOrganization.organization.state, "PARTIALLY_LINKED");
assert.equal(
  unresolvedOrganization.organization.data.relationship,
  "UNRESOLVED",
);

const subset = await resolveBusiness360(db, {
  businessId: "biz-seller",
  sections: ["support"],
});
assert.equal(subset.ok, true);
assert.deepEqual(subset.metrics.sectionsRequested, ["identity", "support"]);
assert.deepEqual(subset.metrics.sectionsResolved, ["identity", "support"]);
assert.equal(subset.metrics.queryCount, 2);
assert.equal(subset.metrics.sectionQueryCount.identity, 1);
assert.equal(subset.metrics.sectionQueryCount.support, 1);
assert.equal(subset.seller.state, "UNKNOWN");
assert.equal(subset.support.state, "LINKED");

console.log("business360-tests: ok");
