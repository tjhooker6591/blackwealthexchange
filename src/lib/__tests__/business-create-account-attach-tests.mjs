import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp/business-create-account-attach-tests");
await fs.mkdir(tmpDir, { recursive: true });

async function writeFile(name, contents) {
  await fs.writeFile(path.join(tmpDir, name), contents, "utf8");
}

async function transpileToTmp(sourceRelativePath, targetFilename, replacer) {
  const source = await fs.readFile(
    path.join(repoRoot, sourceRelativePath),
    "utf8",
  );
  let transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  if (replacer) transpiled = replacer(transpiled);
  await fs.writeFile(path.join(tmpDir, targetFilename), transpiled, "utf8");
}

await writeFile(
  "formidable-stub.mjs",
  [
    "export default function formidable() {",
    "  return {",
    "    parse(req, callback) {",
    "      callback(null, globalThis.__CREATE_TEST_FIELDS__, {});",
    "    },",
    "  };",
    "}",
  ].join("\n"),
);
await writeFile(
  "client-stub.mjs",
  [
    "const clientPromise = {",
    "  then(resolve, reject) {",
    "    return Promise.resolve(globalThis.__CREATE_TEST_CLIENT__).then(resolve, reject);",
    "  },",
    "};",
    "export default clientPromise;",
  ].join("\n"),
);
await writeFile(
  "directory-ownership-stub.mjs",
  [
    "export function buildObjectIdOrStringFilter(key, value) {",
    "  return { [key]: value };",
    "}",
    "export function parseSessionIdentity() {",
    "  return globalThis.__CREATE_TEST_SESSION__;",
    "}",
  ].join("\n"),
);
await writeFile(
  "cloudinary-stub.mjs",
  "export async function uploadImageBufferToCloudinary() { throw new Error('not used'); }",
);

await transpileToTmp(
  "src/lib/businessSubmission.ts",
  "business-submission.mjs",
);
await transpileToTmp("src/lib/directory/completeness.ts", "completeness.mjs");
await transpileToTmp(
  "src/pages/api/business/create.ts",
  "business-create.mjs",
  (code) =>
    code
      .replace(/from "formidable"/g, 'from "./formidable-stub.mjs"')
      .replace(/from "@\/lib\/mongodb"/g, 'from "./client-stub.mjs"')
      .replace(
        /from "@\/lib\/businessSubmission"/g,
        'from "./business-submission.mjs"',
      )
      .replace(
        /from "@\/lib\/cloudinaryUpload"/g,
        'from "./cloudinary-stub.mjs"',
      )
      .replace(
        /from "@\/lib\/directoryOwnership"/g,
        'from "./directory-ownership-stub.mjs"',
      )
      .replace(
        /from "@\/lib\/directory\/completeness"/g,
        'from "./completeness.mjs"',
      ),
);

const { default: createHandler } = await import(
  `file://${path.join(tmpDir, "business-create.mjs")}`
);
const { computeListingCompleteness } = await import(
  `file://${path.join(tmpDir, "completeness.mjs")}`
);

function getPath(doc, key) {
  return key
    .split(".")
    .reduce((acc, part) => (acc ? acc[part] : undefined), doc);
}

function matchValue(left, cond) {
  if (cond instanceof RegExp)
    return typeof left === "string" && cond.test(left);
  if (cond && typeof cond === "object") {
    if ("$regex" in cond) {
      return (
        typeof left === "string" &&
        new RegExp(cond.$regex, cond.$options || "").test(left)
      );
    }
    if ("$in" in cond) return cond.$in.includes(left);
    if ("$ne" in cond) return left !== cond.$ne;
  }
  return left === cond;
}

function matches(doc, query) {
  return Object.entries(query || {}).every(([key, value]) => {
    if (key === "$or") return value.some((q) => matches(doc, q));
    if (key === "$and") return value.every((q) => matches(doc, q));
    return matchValue(getPath(doc, key), value);
  });
}

class FakeCollection {
  constructor(docs = []) {
    this.docs = docs.map((doc) => ({ ...doc }));
    this.inserted = [];
  }
  async findOne(query = {}) {
    return this.docs.find((doc) => matches(doc, query)) || null;
  }
  async countDocuments(query = {}) {
    return this.docs.filter((doc) => matches(doc, query)).length;
  }
  async updateOne(query, update) {
    const hit = this.docs.find((doc) => matches(doc, query));
    if (hit && update?.$set) Object.assign(hit, update.$set);
    return { matchedCount: hit ? 1 : 0, modifiedCount: hit ? 1 : 0 };
  }
  async insertOne(doc) {
    const inserted = { ...doc, _id: `doc-${this.docs.length + 1}` };
    this.inserted.push(inserted);
    this.docs.push(inserted);
    return { insertedId: inserted._id };
  }
}

function seedDb(businessDocs) {
  const businesses = new FakeCollection(businessDocs);
  globalThis.__CREATE_TEST_CLIENT__ = {
    db() {
      return { collection: () => businesses };
    },
  };
  return businesses;
}

function createJsonResponse() {
  return {
    statusCode: 200,
    body: undefined,
    setHeader() {
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function submission(overrides = {}) {
  return {
    businessName: "Wolf of Fitnsss",
    category: "professional_services",
    location: "Parsippany, NJ",
    addressLine1: "46 Waterview BLVD",
    city: "Parsippany",
    state: "NJ",
    postalCode: "07054",
    phone: "8622884919",
    email: "owner@example.com",
    businessEmail: "owner@example.com",
    description: "Performance coaching and conditioning.",
    claimantName: "Owner Person",
    claimantEmail: "owner@example.com",
    claimantPhone: "8622884919",
    relationshipToBusiness: "OWNER",
    claimantRoleTitle: "CEO",
    owners: JSON.stringify([
      {
        ownerName: "Owner Person",
        ownershipPercentage: 100,
        roleTitle: "CEO",
        controlRole: "Founder",
        isBlackAttested: true,
        attestationDate: "2026-09-22",
        ownershipEvidenceIds: [],
        controlEvidenceIds: [],
      },
    ]),
    evidence: "[]",
    ...overrides,
  };
}

async function submit(fields, session) {
  globalThis.__CREATE_TEST_FIELDS__ = fields;
  globalThis.__CREATE_TEST_SESSION__ = session || null;
  const res = createJsonResponse();
  await createHandler({ method: "POST", headers: {}, cookies: {} }, res);
  return res;
}

const account = () => ({
  _id: "acct-1",
  email: "owner@example.com",
  password: "hashed",
  accountType: "business",
  businessName: "Wolf of Fitness",
  businessAddress: "46 Waterview BLVD",
  businessPhone: "8622884919",
  description: "",
  isVerified: false,
  createdAt: new Date("2026-09-22T10:04:24.003Z"),
});

// A brand-new business with no account still creates a listing.
{
  const businesses = seedDb([]);
  const res = await submit(submission({ businessName: "Fresh Bakery" }));
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(businesses.inserted.length, 1);
  assert.equal(businesses.docs.length, 1);
}

// Not signed in, but the email already belongs to a business account: no
// second record, and the owner is told to sign in.
{
  const businesses = seedDb([account()]);
  const res = await submit(submission());
  assert.equal(res.statusCode, 409);
  assert.match(res.body.error, /already exists for this email/);
  assert.equal(businesses.inserted.length, 0);
  assert.equal(businesses.docs.length, 1);
  assert.equal(businesses.docs[0].description, "");
}

// Signed in as the business account: the submission lands on the account's
// own record instead of creating a second one.
{
  const businesses = seedDb([account()]);
  const res = await submit(submission(), {
    userId: "acct-1",
    email: "owner@example.com",
    accountType: "business",
  });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(res.body.businessId, "acct-1");
  assert.equal(businesses.inserted.length, 0);
  assert.equal(businesses.docs.length, 1);

  const saved = businesses.docs[0];
  assert.equal(saved.businessName, "Wolf of Fitness");
  assert.equal(saved.business_name, "Wolf of Fitness");
  assert.equal(saved.password, "hashed");
  assert.equal(saved.accountType, "business");
  assert.equal(saved.email, "owner@example.com");
  assert.equal(saved.createdAt.toISOString(), "2026-09-22T10:04:24.003Z");
  assert.equal(saved.city, "Parsippany");
  assert.equal(saved.description, "Performance coaching and conditioning.");
  assert.equal(saved.claimantVerification.claimantEmail, "owner@example.com");
  assert.equal(saved.approved, false);
  assert.equal(typeof saved.completenessScore, "number");
}

// An already-approved account keeps its approval when the form is submitted.
{
  const businesses = seedDb([
    { ...account(), approved: true, status: "active", slug: "wolf-of-fitness" },
  ]);
  const res = await submit(submission(), {
    userId: "acct-1",
    email: "owner@example.com",
    accountType: "business",
  });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  const saved = businesses.docs[0];
  assert.equal(saved.approved, true);
  assert.equal(saved.status, "active");
  assert.equal(saved.slug, "wolf-of-fitness");
  assert.equal(saved.listingStatus, undefined);
  assert.equal(businesses.docs.length, 1);
}

// An owner whose account already has a submitted listing adds a second,
// differently named business: it gets its own record and the first listing
// is left untouched.
{
  const businesses = seedDb([
    {
      ...account(),
      approved: true,
      status: "active",
      slug: "wolf-of-fitness",
      description: "First business description.",
      city: "Parsippany",
      claimantVerification: { claimantEmail: "owner@example.com" },
    },
  ]);
  const res = await submit(
    submission({
      businessName: "Second Venture Bakery",
      description: "A different business entirely.",
      city: "Newark",
    }),
    { userId: "acct-1", email: "owner@example.com", accountType: "business" },
  );
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(businesses.inserted.length, 1);
  assert.equal(businesses.docs.length, 2);
  assert.equal(businesses.docs[0].description, "First business description.");
  assert.equal(businesses.docs[0].city, "Parsippany");
  assert.equal(businesses.docs[0].businessName, "Wolf of Fitness");
  assert.equal(businesses.inserted[0].businessName, "Second Venture Bakery");
  assert.equal(businesses.inserted[0].password, undefined);
}

// Resubmitting the same business from an account that already has a listing
// still updates that one record.
{
  const businesses = seedDb([
    {
      ...account(),
      description: "Old description.",
      claimantVerification: { claimantEmail: "owner@example.com" },
    },
  ]);
  const res = await submit(submission({ businessName: "wolf of  fitness" }), {
    userId: "acct-1",
    email: "owner@example.com",
    accountType: "business",
  });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(businesses.inserted.length, 0);
  assert.equal(businesses.docs.length, 1);
  assert.equal(
    businesses.docs[0].description,
    "Performance coaching and conditioning.",
  );
}

// A signed-in personal user is not a business account, so the email guard
// still applies to them.
{
  const businesses = seedDb([account()]);
  const res = await submit(submission(), {
    userId: "user-9",
    email: "owner@example.com",
    accountType: "user",
  });
  assert.equal(res.statusCode, 409);
  assert.equal(businesses.docs.length, 1);
}

// Completeness counts the field names signup and the add-listing form write.
{
  const result = computeListingCompleteness({
    businessName: "Wolf of Fitness",
    description: "Performance coaching.",
    addressLine1: "46 Waterview BLVD",
    city: "Parsippany",
    state: "NJ",
    businessPhone: "8622884919",
    category: "Health & Wellness",
  });
  assert.equal(result.completenessScore, 78);
  assert.equal(result.isComplete, true);
  assert.deepEqual(result.missingFields, ["website", "image"]);
}

console.log("business-create-account-attach-tests: all passed");
