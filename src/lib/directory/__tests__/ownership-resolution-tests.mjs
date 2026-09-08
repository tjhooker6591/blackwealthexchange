import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const sourcePath = path.join(repoRoot, "src/lib/directoryOwnership.ts");
const stubPath = path.join(tmpDir, "directoryOwnership-env-stub.mjs");
const testablePath = path.join(tmpDir, "directoryOwnership-testable.mjs");

await fs.writeFile(
  stubPath,
  'export function getJwtSecret() { return "test-secret"; }\n',
  "utf8",
);

const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(
  source.replace(
    'from "@/lib/env";',
    'from "./directoryOwnership-env-stub.mjs";',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
await fs.writeFile(testablePath, transpiled, "utf8");

const {
  isOwnershipBlocked,
  listVerifiedBusinessOwnerships,
  resolvePrimaryVerifiedBusinessOwnership,
  resolveVerifiedOwnership,
} = await import(`file://${testablePath}`);

function objectIdFilterToString(filter) {
  if (!filter) return "";
  if (Array.isArray(filter.$or)) {
    const found = filter.$or.find((entry) => entry && entry._id != null);
    return String(found?._id || "");
  }
  return String(filter._id || "");
}

function createDb(fixtures) {
  return {
    collection(name) {
      if (name === "business_claims") {
        return {
          find(query) {
            return {
              async toArray() {
                return fixtures.claims.filter((claim) => {
                  const normalizedClaim = String(claim.claimStatus || "");
                  const normalizedReview = String(
                    claim.ownershipReviewStatus || "",
                  );
                  return (
                    claim.userId === query.userId &&
                    query.claimStatus?.$in?.includes(normalizedClaim) &&
                    query.ownershipReviewStatus?.$in?.includes(
                      normalizedReview,
                    ) &&
                    claim.revokedAt == null
                  );
                });
              },
            };
          },
          async findOne(query) {
            return (
              fixtures.claims.find((claim) => {
                const businessId = String(claim.businessId || "");
                const queryBusinessId = String(
                  query.$and?.[0]?.$or?.[0]?.businessId ||
                    query.$and?.[0]?.businessId ||
                    "",
                );
                return (
                  claim.userId === query.userId &&
                  businessId === queryBusinessId &&
                  query.claimStatus?.$in?.includes(String(claim.claimStatus)) &&
                  query.ownershipReviewStatus?.$in?.includes(
                    String(claim.ownershipReviewStatus),
                  ) &&
                  claim.revokedAt == null
                );
              }) || null
            );
          },
        };
      }

      if (name === "ownership_reviews") {
        return {
          find(query) {
            return {
              async toArray() {
                return fixtures.reviews.filter((review) => {
                  const normalizedReview = String(review.reviewStatus || "");
                  return (
                    review.userId === query.userId &&
                    query.reviewStatus?.$in?.includes(normalizedReview) &&
                    review.revokedAt == null
                  );
                });
              },
            };
          },
          async findOne(query) {
            return (
              fixtures.reviews.find((review) => {
                const businessId = String(review.businessId || "");
                const queryBusinessId = String(
                  query.$and?.[0]?.$or?.[0]?.businessId ||
                    query.$and?.[0]?.businessId ||
                    "",
                );
                return (
                  review.userId === query.userId &&
                  businessId === queryBusinessId &&
                  query.reviewStatus?.$in?.includes(
                    String(review.reviewStatus),
                  ) &&
                  review.revokedAt == null
                );
              }) || null
            );
          },
        };
      }

      if (name === "businesses") {
        return {
          async findOne(query) {
            const businessId = String(
              objectIdFilterToString(query.$and?.[0] || query) || "",
            );
            return (
              fixtures.businesses.find((business) => {
                const matchesUser =
                  business.claimedByUserId ===
                    query.$and?.[1]?.$or?.[0]?.claimedByUserId ||
                  business.managedByUserId ===
                    query.$and?.[1]?.$or?.[1]?.managedByUserId ||
                  business.ownerUserIds?.includes(
                    query.$and?.[1]?.$or?.[2]?.ownerUserIds,
                  );
                return (
                  String(business._id) === businessId &&
                  matchesUser &&
                  query.$and?.[2]?.claimStage?.$in?.includes(
                    String(business.claimStage),
                  ) &&
                  query.$and?.[3]?.ownershipReviewStatus?.$in?.includes(
                    String(business.ownershipReviewStatus),
                  )
                );
              }) || null
            );
          },
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    },
  };
}

const fixtures = {
  claims: [
    {
      _id: "claim-good",
      userId: "owner-1",
      businessId: "biz-good",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      disputeState: "",
      revokedAt: null,
    },
    {
      _id: "claim-disputed",
      userId: "owner-1",
      businessId: "biz-disputed",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      disputeState: "disputed",
      revokedAt: null,
    },
    {
      _id: "claim-revoked",
      userId: "owner-1",
      businessId: "biz-revoked",
      claimStatus: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
      disputeState: "",
      revokedAt: "2026-07-31T00:00:00.000Z",
    },
    {
      _id: "claim-pending",
      userId: "owner-1",
      businessId: "biz-pending",
      claimStatus: "ownership_verification_pending",
      ownershipReviewStatus: "ownership_verification_pending",
      disputeState: "",
      revokedAt: null,
    },
  ],
  reviews: [
    {
      _id: "review-good",
      userId: "owner-1",
      businessId: "biz-good",
      reviewStatus: "ownership_verified",
      disputeState: "",
      revokedAt: null,
    },
    {
      _id: "review-disputed",
      userId: "owner-1",
      businessId: "biz-disputed",
      reviewStatus: "ownership_verified",
      disputeState: "ownership_disputed",
      revokedAt: null,
    },
    {
      _id: "review-revoked",
      userId: "owner-1",
      businessId: "biz-revoked",
      reviewStatus: "ownership_verified",
      disputeState: "",
      revokedAt: "2026-07-31T00:00:00.000Z",
    },
  ],
  businesses: [
    {
      _id: "biz-good",
      claimedByUserId: "owner-1",
      managedByUserId: "owner-1",
      ownerUserIds: ["owner-1"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-disputed",
      claimedByUserId: "owner-1",
      managedByUserId: "owner-1",
      ownerUserIds: ["owner-1"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
    {
      _id: "biz-revoked",
      claimedByUserId: "owner-1",
      managedByUserId: "owner-1",
      ownerUserIds: ["owner-1"],
      claimStage: "ownership_verified",
      ownershipReviewStatus: "ownership_verified",
    },
  ],
};

const db = createDb(fixtures);

assert.equal(isOwnershipBlocked({ disputeState: "disputed" }), true);
assert.equal(isOwnershipBlocked({ disputeState: "ownership_disputed" }), true);
assert.equal(isOwnershipBlocked({ revokedAt: new Date() }), true);
assert.equal(isOwnershipBlocked({ disputeState: "", revokedAt: null }), false);

const listed = await listVerifiedBusinessOwnerships(db, "owner-1");
assert.deepEqual(
  listed.map((ownership) => ownership.entityId),
  ["biz-good"],
);

const primary = await resolvePrimaryVerifiedBusinessOwnership(db, "owner-1");
assert.equal(primary?.entityId, "biz-good");

const allowed = await resolveVerifiedOwnership(db, {
  entityType: "business",
  entityId: "biz-good",
  userId: "owner-1",
});
assert.equal(allowed?.entityId, "biz-good");

const disputed = await resolveVerifiedOwnership(db, {
  entityType: "business",
  entityId: "biz-disputed",
  userId: "owner-1",
});
assert.equal(disputed, null);

const revoked = await resolveVerifiedOwnership(db, {
  entityType: "business",
  entityId: "biz-revoked",
  userId: "owner-1",
});
assert.equal(revoked, null);

const unrelated = await resolveVerifiedOwnership(db, {
  entityType: "business",
  entityId: "biz-good",
  userId: "owner-2",
});
assert.equal(unrelated, null);

const pendingPrimary = await resolvePrimaryVerifiedBusinessOwnership(
  createDb({
    ...fixtures,
    claims: fixtures.claims.filter(
      (claim) => claim.businessId === "biz-pending",
    ),
    reviews: [],
    businesses: fixtures.businesses,
  }),
  "owner-1",
);
assert.equal(pendingPrimary, null);

console.log("directory-ownership-tests: ok");
