import assert from "node:assert/strict";
import {
  buildFoundingClaimIntakeRecord,
  isLegacyVerifiedFoundingRecord,
  normalizeFoundingAddress,
  normalizeFoundingBusinessName,
  normalizeFoundingEmailDomain,
  normalizeFoundingHostname,
  normalizeFoundingPhoneValue,
} from "../../founding-membership.ts";

assert.equal(
  normalizeFoundingBusinessName("Example & Sons, LLC"),
  "example and sons llc",
);
assert.equal(
  normalizeFoundingAddress("123 Auburn Ave., Atlanta, GA 30303"),
  "123 auburn ave atlanta ga 30303",
);
assert.equal(normalizeFoundingPhoneValue("(404) 555-1111"), "4045551111");
assert.equal(normalizeFoundingHostname("https://www.example.com/shop"), "example.com");
assert.equal(normalizeFoundingEmailDomain("owner@example.com"), "example.com");

const intake = buildFoundingClaimIntakeRecord({
  business: {
    _id: "business-1",
    business_name: "Example and Sons LLC",
    address: "123 Auburn Ave Atlanta GA 30303",
    streetAddress: "123 Auburn Ave.",
    city: "Atlanta",
    state: "GA",
    zip: "30303",
    phone: "(404) 555-1111",
    website: "https://example.com",
    email: "owner@example.com",
    instagram: "https://instagram.com/example",
  },
  claimantUserId: "user-1",
  claimantValues: {
    businessName: "Example & Sons, LLC",
    addressLine1: "123 Auburn Ave.",
    city: "Atlanta",
    state: "GA",
    postalCode: "30303",
    phone: "4045551111",
    website: "example.com",
    businessEmail: "owner@example.com",
    socialUrls: "https://instagram.com/example",
    claimantName: "Taylor Owner",
    claimantEmail: "owner@example.com",
    claimantPhone: "4045551111",
    relationshipToBusiness: "OWNER",
    roleTitle: "Founder",
  },
  evidence: [
    {
      evidenceType: "formation_document",
      storageKey: "doc-1",
      redactedLabel: "Formation document",
      notes: "LLC filing",
    },
  ],
});

assert.equal(intake.business.businessName.normalizedMatchResult, "MATCH");
assert.equal(intake.business.addressLine1.normalizedMatchResult, "MATCH");
assert.equal(intake.business.phone.normalizedMatchResult, "MATCH");
assert.equal(intake.business.website.normalizedMatchResult, "MATCH");
assert.equal(intake.claimant.relationshipToBusiness, "OWNER");
assert.equal(intake.authority.requiresOwnershipEvidence, true);
assert.equal(intake.authority.ownershipEvidenceProvided, true);
assert.equal(intake.authority.requiresRepresentativeAuthorityEvidence, false);
assert.equal(intake.blackOwnedStatus, "NOT_ESTABLISHED");

const authorizedRepresentative = buildFoundingClaimIntakeRecord({
  business: {
    _id: "business-2",
    business_name: "Representative Test LLC",
  },
  claimantUserId: "user-2",
  claimantValues: {
    businessName: "Representative Test LLC",
    claimantName: "Jordan Agent",
    claimantEmail: "agent@example.com",
    relationshipToBusiness: "AUTHORIZED_REPRESENTATIVE",
    roleTitle: "Outside counsel",
  },
  evidence: [],
});

assert.equal(
  authorizedRepresentative.authority.requiresRepresentativeAuthorityEvidence,
  true,
);
assert.equal(
  authorizedRepresentative.authority.representativeAuthorityEvidenceProvided,
  false,
);

assert.equal(
  isLegacyVerifiedFoundingRecord({
    queueState: "ownership_verified",
    claimStatus: "ownership_verified",
    ownershipReviewStatus: "ownership_verified",
    review: {
      evidenceSubmissions: [],
    },
  }),
  true,
);

assert.equal(
  isLegacyVerifiedFoundingRecord({
    queueState: "ownership_verified",
    claimStatus: "ownership_verified",
    ownershipReviewStatus: "ownership_verified",
    review: {
      claimIntake: intake,
      structuredEvidenceSubmissions: intake.evidence,
    },
  }),
  false,
);

console.log("claim-intake-readiness-tests: ok");
