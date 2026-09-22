import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const sourcePath = path.join(repoRoot, "src/lib/founding-membership.ts");
const targetPath = path.join(tmpDir, "founding-membership-testable.mjs");

const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

await fs.writeFile(targetPath, transpiled, "utf8");

const { getClaimableBusinessById, getFoundingMembershipAvailability } =
  await import(`file://${targetPath}`);

class MockCollection {
  constructor(docs) {
    this.docs = docs;
  }

  async findOne(filter) {
    return (
      this.docs.find((doc) =>
        Object.entries(filter).every(([key, value]) => {
          if (key === "_id") return String(doc._id) === String(value);
          return doc[key] === value;
        }),
      ) || null
    );
  }
}

class MockDb {
  constructor(docs) {
    this.docs = docs;
  }

  collection(name) {
    assert.equal(name, "businesses");
    return new MockCollection(this.docs);
  }
}

async function testClaimableBusinessValidation() {
  const docs = [
    {
      _id: "approved-1",
      business_name: "Approved Business",
      status: "approved",
      directoryVisibilityApproved: true,
    },
    {
      _id: "verified-1",
      business_name: "Verified Business",
      status: "verified",
      directoryVisibilityApproved: true,
      verified: true,
    },
    {
      _id: "claim-1",
      business_name: "Claim Started",
      status: "approved",
      directoryVisibilityApproved: true,
      claimStage: "claim_initiated",
    },
    {
      _id: "review-1",
      business_name: "Review Pending",
      status: "approved",
      directoryVisibilityApproved: true,
      claimStage: "ownership_review_pending",
    },
    {
      _id: "member-1",
      business_name: "Already Member",
      status: "approved",
      directoryVisibilityApproved: true,
      claimStage: "founding_growth_member",
    },
  ];

  const db = new MockDb(docs);
  const approved = await getClaimableBusinessById(db, "approved-1");
  assert.equal(approved?.businessName, "Approved Business");
  assert.equal(await getClaimableBusinessById(db, "verified-1"), null);
  assert.equal(await getClaimableBusinessById(db, "claim-1"), null);
  assert.equal(await getClaimableBusinessById(db, "review-1"), null);
  assert.equal(await getClaimableBusinessById(db, "member-1"), null);
}

function testAvailabilityNormalization() {
  const available = getFoundingMembershipAvailability({
    status: "approved",
    claimStage: null,
  });
  assert.equal(available.claimable, true);
  assert.equal(available.unavailableReason, null);

  const member = getFoundingMembershipAvailability({
    status: "approved",
    claimStage: "founding_growth_member",
  });
  assert.equal(member.claimable, false);
  assert.equal(member.unavailableReason, "membership_already_active");
}

await testClaimableBusinessValidation();
testAvailabilityNormalization();
console.log("founding-membership-resume-tests: ok");
