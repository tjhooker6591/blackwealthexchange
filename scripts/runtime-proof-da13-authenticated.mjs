#!/usr/bin/env node
import assert from "node:assert/strict";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { chromium } from "playwright";
import { MongoClient, ObjectId } from "mongodb";
import {
  FOUNDING_MEMBERSHIP_PRODUCT_KEY,
  getFoundingClaimVerificationRecords,
} from "../src/lib/founding-membership.ts";

dotenv.config({ path: ".env.local" });

const base = process.env.PROOF_BASE_URL || "http://127.0.0.1:3000";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!mongoUri || !jwtSecret) {
  console.error("Missing MONGODB_URI or JWT_SECRET/NEXTAUTH_SECRET");
  process.exit(1);
}

function cookieFor(user) {
  const token = jwt.sign(
    {
      userId: String(user._id),
      email: String(user.email).toLowerCase(),
      accountType: String(user.accountType || "user"),
      isAdmin: user.isAdmin === true,
      tokenVersion:
        typeof user.tokenVersion === "number" &&
        Number.isFinite(user.tokenVersion)
          ? user.tokenVersion
          : 0,
    },
    jwtSecret,
    { expiresIn: "30m" },
  );

  return {
    sessionToken: token,
    cookieHeader: `session_token=${token}; accountType=${encodeURIComponent(
      String(user.accountType || "user"),
    )}`,
  };
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
  return { status: res.status, ok: res.ok, text, json };
}

function buildBusinessIdentityCompleteness(claimIntake) {
  if (!claimIntake?.business) return false;
  const requiredFields = [
    claimIntake.business.businessName,
    claimIntake.business.addressLine1,
    claimIntake.business.city,
    claimIntake.business.state,
    claimIntake.business.postalCode,
  ];
  return requiredFields.every(
    (field) =>
      field &&
      (field.currentListingValue || field.claimantProvidedValue) &&
      field.normalizedMatchResult !== "UNKNOWN",
  );
}

function hasClaimantAuthorityData(claimIntake) {
  if (!claimIntake?.claimant || !claimIntake?.authority) return false;
  return Boolean(
    claimIntake.claimant.claimantName &&
      claimIntake.claimant.claimantEmail &&
      claimIntake.claimant.relationshipToBusiness,
  );
}

function hasOwnershipEvidence(claimIntake) {
  return Array.isArray(claimIntake?.evidence) && claimIntake.evidence.length > 0;
}

async function addSessionCookies(context, cookiePayload) {
  await context.addCookies([
    {
      name: "session_token",
      value: cookiePayload.sessionToken,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "accountType",
      value: String(cookiePayload.accountType || "user"),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

const client = new MongoClient(mongoUri);
const browser = await chromium.launch({ headless: true });
const proofStamp = Date.now();
const proofPrefix = `da13-proof-${proofStamp}`;
const now = new Date();

const result = {
  phase5CommitAccounting: {
    phase5RuntimeImplementationCommit: "NONE",
    validatedImplementationBase: "466b886eaaea379c36896378374c38515ae76b02",
  },
  claimantFlow: {},
  adminFlow: {},
  evidenceIsolation: {},
  publicListingProtection: {},
  realDataReadiness: {},
  automation: {
    automaticOwnershipActivation: "NO",
    blackOwnedStatusAutomaticInference: "NO",
  },
};

const cleanup = {
  userIds: [],
  membershipIds: [],
  businessIds: [],
};

try {
  await client.connect();
  const db = client.db(dbName);

  const canonicalRecordsBefore = (
    await getFoundingClaimVerificationRecords(db)
  ).filter((row) => !String(row.membershipId || "").startsWith(proofPrefix));

  const legacyClaims = canonicalRecordsBefore.filter(
    (row) => !row.review?.claimIntake,
  );
  const newStructuredClaims = canonicalRecordsBefore.filter(
    (row) => row.review?.claimIntake,
  );

  result.realDataReadiness = {
    totalLegacyClaimsAvailable: legacyClaims.length,
    totalNewStructureClaimsAvailable: newStructuredClaims.length,
    newClaimsWithCompleteBusinessIdentityData: newStructuredClaims.filter((row) =>
      buildBusinessIdentityCompleteness(row.review?.claimIntake),
    ).length,
    newClaimsWithClaimantAuthorityData: newStructuredClaims.filter((row) =>
      hasClaimantAuthorityData(row.review?.claimIntake),
    ).length,
    newClaimsWithOwnershipEvidence: newStructuredClaims.filter((row) =>
      hasOwnershipEvidence(row.review?.claimIntake),
    ).length,
    newClaimsAutoVerifyEligible: newStructuredClaims.filter(
      (row) => row.verificationDecision?.disposition === "AUTO_VERIFY_ELIGIBLE",
    ).length,
    newClaimsRequiringAdmin: newStructuredClaims.filter(
      (row) => row.verificationDecision?.disposition !== "AUTO_VERIFY_ELIGIBLE",
    ).length,
    insufficientRealWorldSample: newStructuredClaims.length < 3,
  };

  const claimantA = {
    _id: new ObjectId(),
    email: `${proofPrefix}-owner@example.com`,
    accountType: "user",
    tokenVersion: 0,
    firstName: "Avery",
    lastName: "Owner",
    phone: "4045550101",
  };
  const claimantB = {
    _id: new ObjectId(),
    email: `${proofPrefix}-other@example.com`,
    accountType: "user",
    tokenVersion: 0,
    firstName: "Bailey",
    lastName: "Other",
    phone: "4045550199",
  };
  const adminUser = {
    _id: new ObjectId(),
    email: `${proofPrefix}-admin@example.com`,
    accountType: "user",
    isAdmin: true,
    tokenVersion: 0,
  };

  const businessAId = `${proofPrefix}-business-a`;
  const businessBId = `${proofPrefix}-business-b`;
  const membershipAId = `${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:${proofPrefix}:a`;
  const membershipBId = `${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:${proofPrefix}:b`;

  cleanup.userIds.push(claimantA._id, claimantB._id, adminUser._id);
  cleanup.businessIds.push(businessAId, businessBId);
  cleanup.membershipIds.push(membershipAId, membershipBId);

  await db.collection("users").insertMany([
    {
      ...claimantA,
      foundingMembershipId: membershipAId,
      createdAt: now,
      updatedAt: now,
    },
    {
      ...claimantB,
      foundingMembershipId: membershipBId,
      createdAt: now,
      updatedAt: now,
    },
    {
      ...adminUser,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.collection("businesses").insertMany([
    {
      _id: businessAId,
      business_name: "DA13 Runtime Proof Coffee",
      streetAddress: "123 Auburn Ave",
      city: "Atlanta",
      state: "GA",
      zip: "30303",
      phone: "4045550101",
      website: "https://proofcoffee.example.com",
      email: "hello@proofcoffee.example.com",
      instagram: "https://instagram.com/proofcoffee",
      foundingMembershipId: membershipAId,
      claimStage: "ownership_verification_pending",
      ownershipReviewStatus: "ownership_verification_pending",
      publicListingStatus: "public",
      status: "public",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: businessBId,
      business_name: "DA13 Runtime Proof Bakery",
      streetAddress: "456 Edgewood Ave",
      city: "Atlanta",
      state: "GA",
      zip: "30312",
      phone: "4045550199",
      website: "https://proofbakery.example.com",
      email: "hello@proofbakery.example.com",
      foundingMembershipId: membershipBId,
      claimStage: "ownership_verification_pending",
      ownershipReviewStatus: "ownership_verification_pending",
      publicListingStatus: "public",
      status: "public",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.collection("business_memberships").insertMany([
    {
      membershipId: membershipAId,
      productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
      businessId: businessAId,
      membershipName: "DA13 Runtime Proof Coffee",
      userId: String(claimantA._id),
      email: claimantA.email,
      membershipStatus: "active",
      ownershipReviewStatus: "ownership_verification_pending",
      paymentStatus: "paid",
      paymentAmountCents: 4900,
      paymentCurrency: "usd",
      createdAt: now,
      updatedAt: now,
    },
    {
      membershipId: membershipBId,
      productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
      businessId: businessBId,
      membershipName: "DA13 Runtime Proof Bakery",
      userId: String(claimantB._id),
      email: claimantB.email,
      membershipStatus: "active",
      ownershipReviewStatus: "ownership_verification_pending",
      paymentStatus: "paid",
      paymentAmountCents: 4900,
      paymentCurrency: "usd",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.collection("business_claims").insertMany([
    {
      _id: `${proofPrefix}-claim-a`,
      membershipId: membershipAId,
      productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
      businessId: businessAId,
      businessName: "DA13 Runtime Proof Coffee",
      userId: String(claimantA._id),
      email: claimantA.email,
      claimStatus: "claim_initiated",
      ownershipReviewStatus: "ownership_verification_pending",
      claimLocked: true,
      createdAt: now,
      updatedAt: now,
      auditHistory: [],
    },
    {
      _id: `${proofPrefix}-claim-b`,
      membershipId: membershipBId,
      productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
      businessId: businessBId,
      businessName: "DA13 Runtime Proof Bakery",
      userId: String(claimantB._id),
      email: claimantB.email,
      claimStatus: "claim_initiated",
      ownershipReviewStatus: "ownership_verification_pending",
      claimLocked: true,
      createdAt: now,
      updatedAt: now,
      auditHistory: [],
    },
  ]);

  await db.collection("ownership_reviews").insertMany([
    {
      _id: `${proofPrefix}-review-a`,
      sourceMembershipId: membershipAId,
      businessId: businessAId,
      userId: String(claimantA._id),
      email: claimantA.email,
      reviewStatus: "ownership_verification_pending",
      evidenceStatus: "awaiting_owner_documents",
      evidenceValidationStatus: "auto_validated",
      createdAt: now,
      updatedAt: now,
      auditHistory: [],
    },
    {
      _id: `${proofPrefix}-review-b`,
      sourceMembershipId: membershipBId,
      businessId: businessBId,
      userId: String(claimantB._id),
      email: claimantB.email,
      reviewStatus: "ownership_verification_pending",
      evidenceStatus: "awaiting_owner_documents",
      createdAt: now,
      updatedAt: now,
      auditHistory: [],
    },
  ]);

  await db.collection("membership_fulfillment").insertMany([
    {
      membershipId: membershipAId,
      ownershipAccessStatus: "pending",
      fulfillmentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    },
    {
      membershipId: membershipBId,
      ownershipAccessStatus: "pending",
      fulfillmentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.collection("membership_onboarding").insertMany([
    {
      membershipId: membershipAId,
      onboardingStatus: "pending_verification",
      nextStep: "submit ownership evidence for ownership verification",
      evidencePortalStatus: "open",
      createdAt: now,
      updatedAt: now,
    },
    {
      membershipId: membershipBId,
      onboardingStatus: "pending_verification",
      nextStep: "submit ownership evidence for ownership verification",
      evidencePortalStatus: "open",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const claimantACookies = cookieFor(claimantA);
  claimantACookies.accountType = "user";
  const claimantBCookies = cookieFor(claimantB);
  claimantBCookies.accountType = "user";
  const adminCookies = cookieFor(adminUser);
  adminCookies.accountType = "user";

  const claimantContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  await addSessionCookies(claimantContext, claimantACookies);
  const claimantPage = await claimantContext.newPage();

  await claimantPage.goto(`${base}/founding-membership/evidence`, {
    waitUntil: "networkidle",
  });
  await claimantPage.waitForSelector("text=Ownership Evidence Intake");
  assert(
    await claimantPage.locator("text=Current listing data").first().isVisible(),
    "claimant current listing block missing",
  );
  assert(
    await claimantPage.locator("text=DA13 Runtime Proof Coffee").first().isVisible(),
    "claimant did not see current business information",
  );

  const businessConfirmationSection = claimantPage.locator("section").filter({
    hasText: "Claimant-provided business confirmation",
  });
  const claimantAuthoritySection = claimantPage.locator("section").filter({
    hasText: "Claimant authority",
  });
  const evidenceMetadataSection = claimantPage.locator("section").filter({
    hasText: "Evidence metadata",
  });

  await businessConfirmationSection
    .getByLabel("Business name")
    .fill("DA13 Runtime Proof Coffee");
  await businessConfirmationSection
    .getByLabel("Address line 1")
    .fill("789 New Address Ave");
  await businessConfirmationSection.getByLabel("City").fill("Atlanta");
  await businessConfirmationSection.getByLabel("State").fill("GA");
  await businessConfirmationSection.getByLabel("Postal code").fill("30303");
  await businessConfirmationSection.getByLabel("Phone").fill("4045550101");
  await businessConfirmationSection
    .getByLabel("Website")
    .fill("proofcoffee.example.com");
  await businessConfirmationSection
    .getByLabel("Business email")
    .fill("owner@proofcoffee.example.com");
  await businessConfirmationSection
    .getByLabel("Social URLs")
    .fill("https://instagram.com/proofcoffee");
  await claimantAuthoritySection
    .getByLabel("Claimant name")
    .fill("Avery Owner");
  await claimantAuthoritySection
    .getByLabel("Claimant email")
    .fill("owner@proofcoffee.example.com");
  await claimantAuthoritySection
    .getByLabel("Claimant phone")
    .fill("4045550101");
  await claimantAuthoritySection
    .getByLabel("Relationship to business")
    .selectOption("OWNER");
  await claimantAuthoritySection.getByLabel("Role / title").fill("Founder");
  await evidenceMetadataSection
    .getByLabel("Evidence reference / storage key")
    .first()
    .fill(`${proofPrefix}/ownership-proof.pdf`);
  await evidenceMetadataSection
    .getByLabel("Redacted label")
    .first()
    .fill("Formation document");
  await evidenceMetadataSection
    .getByLabel("Notes")
    .first()
    .fill("Fixture-only ownership evidence metadata.");
  await claimantPage.getByRole("button", { name: "Save intake evidence" }).click();
  await claimantPage.waitForSelector(
    "text=Ownership evidence intake saved. Public listing data remains unchanged until verification.",
  );

  const claimantGetAfterSave = await api("/api/founding-membership/evidence", {
    headers: { cookie: claimantACookies.cookieHeader },
  });
  assert.equal(claimantGetAfterSave.status, 200, "claimant evidence GET failed");
  assert.equal(
    claimantGetAfterSave.json?.claimIntake?.business?.addressLine1
      ?.claimantProvidedValue,
    "789 New Address Ave",
    "claimant-provided address did not persist",
  );
  assert.equal(
    claimantGetAfterSave.json?.claimIntake?.claimant?.relationshipToBusiness,
    "OWNER",
    "claimant relationship did not persist",
  );
  assert.equal(
    claimantGetAfterSave.json?.claimIntake?.evidence?.[0]?.storageKey,
    `${proofPrefix}/ownership-proof.pdf`,
    "evidence metadata did not persist",
  );

  const businessAfterClaimantSave = await db
    .collection("businesses")
    .findOne({ _id: businessAId });
  assert.equal(
    businessAfterClaimantSave?.streetAddress,
    "123 Auburn Ave",
    "claimant changed the public listing street address",
  );

  const claimantBOwnView = await api("/api/founding-membership/evidence", {
    headers: { cookie: claimantBCookies.cookieHeader },
  });
  assert.equal(claimantBOwnView.status, 200, "second claimant evidence GET failed");
  assert.equal(
    claimantBOwnView.json?.membership?.membershipId,
    membershipBId,
    "second claimant did not resolve to their own membership",
  );
  assert.notEqual(
    claimantBOwnView.json?.claimIntake?.evidence?.[0]?.storageKey || null,
    `${proofPrefix}/ownership-proof.pdf`,
    "second claimant could read first claimant evidence",
  );

  result.claimantFlow = {
    openedClaim: claimantGetAfterSave.json?.membership?.membershipId === membershipAId,
    sawCurrentBusinessInformation:
      claimantGetAfterSave.json?.currentListing?.businessName ===
      "DA13 Runtime Proof Coffee",
    submittedClaimantConfirmedValues:
      claimantGetAfterSave.json?.claimIntake?.business?.businessName
        ?.claimantProvidedValue === "DA13 Runtime Proof Coffee",
    selectedRelationship:
      claimantGetAfterSave.json?.claimIntake?.claimant
        ?.relationshipToBusiness === "OWNER",
    submittedRequiredEvidenceMetadata:
      claimantGetAfterSave.json?.claimIntake?.evidence?.length === 1,
    dataPersists:
      claimantGetAfterSave.json?.claimIntake?.evidence?.[0]?.storageKey ===
      `${proofPrefix}/ownership-proof.pdf`,
  };

  result.publicListingProtection = {
    claimantProvidedAddress:
      claimantGetAfterSave.json?.claimIntake?.business?.addressLine1
        ?.claimantProvidedValue || null,
    publicListingStreetAddress: businessAfterClaimantSave?.streetAddress || null,
    blocked: businessAfterClaimantSave?.streetAddress === "123 Auburn Ave",
  };

  result.evidenceIsolation = {
    secondClaimantMembershipId:
      claimantBOwnView.json?.membership?.membershipId || null,
    secondClaimantSawFirstStorageKey:
      claimantBOwnView.json?.claimIntake?.evidence?.[0]?.storageKey ===
      `${proofPrefix}/ownership-proof.pdf`,
    blocked:
      claimantBOwnView.json?.membership?.membershipId === membershipBId &&
      claimantBOwnView.json?.claimIntake?.evidence?.[0]?.storageKey !==
        `${proofPrefix}/ownership-proof.pdf`,
  };

  const adminContext = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
  });
  await addSessionCookies(adminContext, adminCookies);
  const adminPage = await adminContext.newPage();

  await adminPage.goto(`${base}/admin/claim-verification`, {
    waitUntil: "networkidle",
  });
  await adminPage.waitForSelector("text=Claim Verification Queue");
  const proofSection = adminPage
    .locator("section", { hasText: "DA13 Runtime Proof Coffee" })
    .first();
  await proofSection.waitFor();

  const adminApiView = await api("/api/admin/founding-memberships", {
    headers: { cookie: adminCookies.cookieHeader },
  });
  assert.equal(adminApiView.status, 200, "admin founding memberships GET failed");
  const proofRow = Array.isArray(adminApiView.json?.records)
    ? adminApiView.json.records.find((row) => row.membershipId === membershipAId)
    : null;
  assert(proofRow, "proof row missing from admin claim queue");

  result.adminFlow = {
    openedClaimVerification: await adminPage
      .locator("text=Claim Verification Queue")
      .first()
      .isVisible(),
    sawCurrentListingValues: await proofSection
      .locator("text=Listing: 123 Auburn Ave")
      .first()
      .isVisible(),
    sawClaimantProvidedValues: await proofSection
      .locator("text=Claimant: 789 New Address Ave")
      .first()
      .isVisible(),
    sawMatchMismatchUnknown: await proofSection
      .locator("text=Match: Mismatch")
      .first()
      .isVisible(),
    sawClaimantRelationship: await proofSection
      .locator("text=Claimant relationship")
      .first()
      .isVisible(),
    sawEvidenceMetadata: await proofSection
      .locator("text=Evidence metadata")
      .first()
      .isVisible(),
    sawAutomatedRecommendation: Boolean(
      proofRow?.verificationDecision?.disposition,
    ),
    automatedRecommendation: proofRow?.verificationDecision?.disposition || null,
    sawMandatoryFailures: Array.isArray(
      proofRow?.verificationDecision?.mandatoryFailures,
    ),
    sawMandatoryUnknowns: Array.isArray(
      proofRow?.verificationDecision?.mandatoryUnknowns,
    ),
    actionButtonsVisible:
      (await proofSection
        .getByRole("button", { name: "Verify Ownership" })
        .isVisible()) &&
      (await proofSection
        .getByRole("button", { name: "Request More Evidence" })
        .isVisible()) &&
      (await proofSection
        .getByRole("button", { name: "Verification Failed" })
        .isVisible()) &&
      (await proofSection
        .getByRole("button", { name: "Mark as Disputed" })
        .isVisible()),
    visibleSignalGroups: {
      claimantIdentity: await proofSection
        .locator("text=Claimant identity")
        .first()
        .isVisible(),
      additionalBusinessIdentitySignals: await proofSection
        .locator("text=Additional business identity signals")
        .first()
        .isVisible(),
      socialProfileComparisons: await proofSection
        .locator("text=Social profile comparisons")
        .first()
        .isVisible(),
    },
  };

  assert.equal(
    result.evidenceIsolation.blocked,
    true,
    "cross-claim evidence isolation proof failed",
  );
  assert.equal(
    result.publicListingProtection.blocked,
    true,
    "public listing mutation protection proof failed",
  );

  await claimantContext.close();
  await adminContext.close();

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  result.error = String(error?.stack || error);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (cleanup.membershipIds.length) {
      await db
        .collection("membership_onboarding")
        .deleteMany({ membershipId: { $in: cleanup.membershipIds } });
      await db
        .collection("membership_fulfillment")
        .deleteMany({ membershipId: { $in: cleanup.membershipIds } });
      await db
        .collection("ownership_reviews")
        .deleteMany({ sourceMembershipId: { $in: cleanup.membershipIds } });
      await db
        .collection("business_claims")
        .deleteMany({ membershipId: { $in: cleanup.membershipIds } });
      await db
        .collection("business_memberships")
        .deleteMany({ membershipId: { $in: cleanup.membershipIds } });
    }
    if (cleanup.businessIds.length) {
      await db
        .collection("businesses")
        .deleteMany({ _id: { $in: cleanup.businessIds } });
    }
    if (cleanup.userIds.length) {
      await db
        .collection("users")
        .deleteMany({ _id: { $in: cleanup.userIds } });
    }
  } catch {}
  await client.close();
  await browser.close();
}
