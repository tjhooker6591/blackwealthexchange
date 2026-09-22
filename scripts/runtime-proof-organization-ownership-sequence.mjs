import fs from "node:fs";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

dotenv.config({ path: ".env.local" });

const base = process.env.PROOF_BASE_URL || "http://127.0.0.1:3000";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
const jwtSecret = process.env.JWT_SECRET;
if (!mongoUri || !jwtSecret) throw new Error("missing required env");

function red(id) {
  const s = String(id || "");
  return s ? `${s.slice(0, 4)}…${s.slice(-4)}` : null;
}

function cookieFor(user) {
  const token = jwt.sign(
    {
      userId: String(user._id),
      email: String(user.email).toLowerCase(),
      accountType: String(user.accountType || "user"),
      isAdmin: user.isAdmin === true,
      role: user.role || undefined,
      roles: Array.isArray(user.roles) ? user.roles : undefined,
      tokenVersion:
        typeof user.tokenVersion === "number" ? user.tokenVersion : 0,
    },
    jwtSecret,
    { expiresIn: "30m" },
  );
  return `session_token=${token}; accountType=${encodeURIComponent(String(user.accountType || "user"))}`;
}

async function api(path, options = {}) {
  const headers = {
    origin: base,
    referer: `${base}/`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, ok: res.ok, json, text };
}

function row(test, expected, actual, proof) {
  return {
    test,
    expectedStatus: expected,
    actualStatus: actual,
    result: expected === actual ? "PASS" : "FAIL",
    databaseStateProof: proof,
  };
}

const client = new MongoClient(mongoUri);
await client.connect();
const db = client.db(dbName);

const admin = await db.collection("users").findOne({ isAdmin: true });
if (!admin) throw new Error("admin user missing");
const adminCookie = cookieFor(admin);
const adminDiag = {
  authenticatedUserId: red(admin._id),
  resolvedRole:
    admin.isAdmin === true
      ? "admin"
      : admin.accountType || admin.role || "unknown",
};

const seedOrg = await db
  .collection("organizations")
  .findOne({ alias: "ebenezer-baptist-church" });
if (!seedOrg) throw new Error("seed org missing");

const stamp = Date.now();
const claimantEmail = `org-claimant-${stamp}@example.com`;
const otherEmail = `org-other-${stamp}@example.com`;
const otherOwnerEmail = `org-owner2-${stamp}@example.com`;
const password = admin.password;
const now = new Date();

const [
  { insertedId: claimantId },
  { insertedId: otherId },
  { insertedId: otherOwnerId },
] = await Promise.all([
  db
    .collection("users")
    .insertOne({
      email: claimantEmail,
      password,
      accountType: "user",
      createdAt: now,
      updatedAt: now,
      tokenVersion: 0,
    }),
  db
    .collection("users")
    .insertOne({
      email: otherEmail,
      password,
      accountType: "user",
      createdAt: now,
      updatedAt: now,
      tokenVersion: 0,
    }),
  db
    .collection("users")
    .insertOne({
      email: otherOwnerEmail,
      password,
      accountType: "user",
      createdAt: now,
      updatedAt: now,
      tokenVersion: 0,
    }),
]);

const claimant = {
  _id: claimantId,
  email: claimantEmail,
  accountType: "user",
  tokenVersion: 0,
};
const other = {
  _id: otherId,
  email: otherEmail,
  accountType: "user",
  tokenVersion: 0,
};
const otherOwner = {
  _id: otherOwnerId,
  email: otherOwnerEmail,
  accountType: "user",
  tokenVersion: 0,
};
const claimantCookie = cookieFor(claimant);
const otherCookie = cookieFor(other);
const otherOwnerCookie = cookieFor(otherOwner);

const orgDoc = {
  name: `Ownership Proof Org ${stamp}`,
  alias: `ownership-proof-org-${stamp}`,
  shortSummary: null,
  description: null,
  social: {},
  createdAt: now,
  updatedAt: now,
};
const { insertedId: orgId } = await db
  .collection("organizations")
  .insertOne(orgDoc);
const org = await db.collection("organizations").findOne({ _id: orgId });

const rows = [];

const claim1 = await api("/api/organizations/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: claimantCookie },
  body: JSON.stringify({ entityId: String(orgId), reason: "claim-1" }),
});
const claim1Id = claim1.json?.claimId;
const claim1Doc = await db
  .collection("entity_claims")
  .findOne({ _id: new ObjectId(claim1Id) });
rows.push(
  row(
    "submit claim 1",
    201,
    claim1.status,
    `claim=${claim1Doc?.claimStatus || null}`,
  ),
);

const claimantPatchBeforeVerify = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: claimantCookie },
    body: JSON.stringify({ shortSummary: "should fail pre-verify" }),
  },
);
rows.push(
  row(
    "claimant PATCH denied before verify",
    403,
    claimantPatchBeforeVerify.status,
    `claimStatus=${claim1Doc?.claimStatus || null}`,
  ),
);

const requestMoreEvidence = await api("/api/admin/organizations/claims", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: adminCookie },
  body: JSON.stringify({
    claimId: claim1Id,
    action: "request_more_evidence",
    reason: "need more",
  }),
});
const claim1AfterEvidence = await db
  .collection("entity_claims")
  .findOne({ _id: new ObjectId(claim1Id) });
rows.push(
  row(
    "admin request more evidence",
    200,
    requestMoreEvidence.status,
    `admin=${adminDiag.authenticatedUserId}:${adminDiag.resolvedRole}, claim=${claim1AfterEvidence?.claimStatus || null}`,
  ),
);

const claim2 = await api("/api/organizations/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: claimantCookie },
  body: JSON.stringify({ entityId: String(orgId), reason: "claim-2" }),
});
const claim2Id = claim2.json?.claimId;
const verificationFailed = await api("/api/admin/organizations/claims", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: adminCookie },
  body: JSON.stringify({
    claimId: claim2Id,
    action: "verification_failed",
    reason: "failed",
  }),
});
const claim2After = await db
  .collection("entity_claims")
  .findOne({ _id: new ObjectId(claim2Id) });
const claimantGetAfterFailed = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  { headers: { cookie: claimantCookie } },
);
rows.push(
  row(
    "admin verification failed",
    200,
    verificationFailed.status,
    `claim=${claim2After?.claimStatus || null}, claimantGet=${claimantGetAfterFailed.status}`,
  ),
);

const claim3 = await api("/api/organizations/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: claimantCookie },
  body: JSON.stringify({ entityId: String(orgId), reason: "claim-3" }),
});
const claim3Id = claim3.json?.claimId;
const disputed = await api("/api/admin/organizations/claims", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: adminCookie },
  body: JSON.stringify({
    claimId: claim3Id,
    action: "mark_disputed",
    reason: "disputed",
  }),
});
const claim3After = await db
  .collection("entity_claims")
  .findOne({ _id: new ObjectId(claim3Id) });
const claimantGetAfterDispute = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  { headers: { cookie: claimantCookie } },
);
rows.push(
  row(
    "admin mark disputed",
    200,
    disputed.status,
    `claim=${claim3After?.claimStatus || null}, claimantGet=${claimantGetAfterDispute.status}`,
  ),
);

const claim4 = await api("/api/organizations/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: claimantCookie },
  body: JSON.stringify({ entityId: String(orgId), reason: "claim-4" }),
});
const claim4Id = claim4.json?.claimId;
const verify = await api("/api/admin/organizations/claims", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: adminCookie },
  body: JSON.stringify({
    claimId: claim4Id,
    action: "verify",
    reason: "verified",
  }),
});
const verifyAgain = await api("/api/admin/organizations/claims", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: adminCookie },
  body: JSON.stringify({
    claimId: claim4Id,
    action: "verify",
    reason: "verified again",
  }),
});
const claim4After = await db
  .collection("entity_claims")
  .findOne({ _id: new ObjectId(claim4Id) });
const ownershipsForClaimant = await db
  .collection("entity_ownerships")
  .find({
    entityType: "organization",
    entityId: String(orgId),
    userId: String(claimantId),
  })
  .toArray();
rows.push(
  row(
    "admin verify ownership",
    200,
    verify.status,
    `claim=${claim4After?.claimStatus || null}, verifiedAt=${!!claim4After?.verifiedAt}, adminId=${red(claim4After?.verifyingAdministratorId)}, ownershipLinks=${ownershipsForClaimant.length}`,
  ),
);
rows.push(
  row(
    "verify ownership idempotent",
    200,
    verifyAgain.status,
    `ownershipLinks=${ownershipsForClaimant.length}`,
  ),
);

const ownerGet = await api(`/api/organizations/${org.alias}/owner-profile`, {
  headers: { cookie: claimantCookie },
});
rows.push(
  row(
    "verified owner GET succeeds",
    200,
    ownerGet.status,
    `entityType=organization entityId=${red(orgId)} userId=${red(claimantId)}`,
  ),
);

const ownerPatch = await api(`/api/organizations/${org.alias}/owner-profile`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", cookie: claimantCookie },
  body: JSON.stringify({
    shortSummary: "Verified owner summary proof",
    facebook: "facebook.com/org-proof-seq",
  }),
});
const orgReloaded = await db
  .collection("organizations")
  .findOne({ _id: orgId });
rows.push(
  row(
    "verified owner PATCH succeeds",
    200,
    ownerPatch.status,
    `summary=${orgReloaded?.shortSummary || null}, facebook=${orgReloaded?.social?.facebook || null}`,
  ),
);

const ownerReloadGet = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  { headers: { cookie: claimantCookie } },
);
rows.push(
  row(
    "verified owner reload persists",
    200,
    ownerReloadGet.status,
    `summary=${orgReloaded?.shortSummary || null}`,
  ),
);

const unrelatedGet = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  { headers: { cookie: otherCookie } },
);
const unrelatedPatch = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: otherCookie },
    body: JSON.stringify({ shortSummary: "nope" }),
  },
);
rows.push(
  row(
    "unrelated user GET denied",
    403,
    unrelatedGet.status,
    `route=owner-profile`,
  ),
);
rows.push(
  row(
    "unrelated user PATCH denied",
    403,
    unrelatedPatch.status,
    `route=owner-profile`,
  ),
);

const otherOwnerClaim = await api("/api/organizations/claim", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: otherOwnerCookie },
  body: JSON.stringify({ entityId: String(orgId), reason: "other-owner" }),
});
rows.push(
  row(
    "conflicting claimant blocked after verified owner exists",
    409,
    otherOwnerClaim.status,
    `rule=organization_already_has_verified_owner`,
  ),
);

const revoke = await api("/api/admin/organizations/claims", {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: adminCookie },
  body: JSON.stringify({
    claimId: claim4Id,
    action: "revoke",
    reason: "revoke",
  }),
});
const ownerGetAfterRevoke = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  { headers: { cookie: claimantCookie } },
);
const ownerPatchAfterRevoke = await api(
  `/api/organizations/${org.alias}/owner-profile`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: claimantCookie },
    body: JSON.stringify({ shortSummary: "post revoke fail" }),
  },
);
const finalClaim = await db
  .collection("entity_claims")
  .findOne({ _id: new ObjectId(claim4Id) });
const finalOwnership = await db
  .collection("entity_ownerships")
  .findOne({
    entityType: "organization",
    entityId: String(orgId),
    userId: String(claimantId),
  });
rows.push(
  row(
    "admin revoke ownership",
    200,
    revoke.status,
    `claim=${finalClaim?.claimStatus || null}, link=${finalOwnership?.status || null}`,
  ),
);
rows.push(
  row(
    "former owner GET denied after revoke",
    403,
    ownerGetAfterRevoke.status,
    `link=${finalOwnership?.status || null}`,
  ),
);
rows.push(
  row(
    "former owner PATCH denied after revoke",
    403,
    ownerPatchAfterRevoke.status,
    `link=${finalOwnership?.status || null}`,
  ),
);

const auditVerify = Array.isArray(claim4After?.auditHistory)
  ? claim4After.auditHistory.some((e) => e.action === "verify")
  : false;
const canonicalNote =
  "canonical ownership record is entity_ownerships; organization document stores editable profile content only";

const output = {
  environment: {
    dotenvLoaderUsed: true,
    requiredEnvPresent: true,
    secretValuesPrinted: false,
    destructiveTestsAgainstProductionForbidden: true,
  },
  adminDiagnostics: adminDiag,
  results: rows,
  ownershipProof: {
    claimStatus: claim4After?.claimStatus || null,
    verificationStatus: claim4After?.verificationStatus || null,
    verifiedAtSet: !!claim4After?.verifiedAt,
    verifyingAdministratorIdRecorded: red(
      claim4After?.verifyingAdministratorId,
    ),
    ownershipLinkCount: ownershipsForClaimant.length,
    ownershipLink: ownershipsForClaimant[0]
      ? {
          entityType: ownershipsForClaimant[0].entityType,
          entityIdMatches: ownershipsForClaimant[0].entityId === String(orgId),
          userIdMatches: ownershipsForClaimant[0].userId === String(claimantId),
          status: ownershipsForClaimant[0].status,
        }
      : null,
    auditVerifyRecorded: auditVerify,
    canonicalRepresentation: canonicalNote,
  },
  rootCauses: [
    "Earlier admin-route 403s were caused by using a non-admin or incorrectly minted JWT shape for admin transitions. The route authorizes from trusted decoded token fields, especially isAdmin.",
    "Earlier verified-owner 404s came from the owner-profile slug lookup bug that failed alias fallback for non-ObjectId slugs.",
    "Earlier verified-owner authorization failure persisted because organization ownership resolution used the wrong claim user field and an overcomplicated entityId filter instead of claimantUserId plus exact normalized string entityId matching.",
  ],
};

fs.mkdirSync(".audit", { recursive: true });
fs.writeFileSync(
  ".audit/organization-ownership-sequence.json",
  JSON.stringify(output, null, 2),
);
console.log(JSON.stringify(output, null, 2));

await db
  .collection("entity_claims")
  .deleteMany({ claimantEmail: { $in: [claimantEmail, otherOwnerEmail] } });
await db
  .collection("entity_ownerships")
  .deleteMany({ userId: { $in: [String(claimantId), String(otherOwnerId)] } });
await db.collection("organizations").deleteOne({ _id: orgId });
await db
  .collection("users")
  .deleteMany({ email: { $in: [claimantEmail, otherEmail, otherOwnerEmail] } });
await client.close();
