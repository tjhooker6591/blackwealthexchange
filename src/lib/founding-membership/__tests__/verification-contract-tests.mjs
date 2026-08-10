import assert from "node:assert/strict";

function normalizeComparisonText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return null;
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
}

function normalizeHostname(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return raw.toLowerCase().replace(/^www\./, "") || null;
  }
}

function extractEmailDomain(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw.includes("@")) return null;
  return raw.split("@").pop()?.trim().replace(/^www\./, "") || null;
}

function firstMeaningfulString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function uniqueNormalizedValues(values, normalizer) {
  return Array.from(new Set(values.map((value) => normalizer(value)).filter(Boolean)));
}

function compare(leftValue, rightValue, normalizer) {
  const left = normalizer(leftValue);
  const right = normalizer(rightValue);
  if (!left || !right) return "unknown";
  return left === right ? "pass" : "fail";
}

function buildSignal(status, summary) {
  return { status, summary };
}

function deriveDecision(row) {
  const business = row.business || {};
  const claim = row.claim || {};
  const review = row.review || {};
  const membership = row.membership || {};
  const user = row.user || {};
  const auditHistory = Array.isArray(row.auditHistory) ? row.auditHistory : [];
  const evidenceSubmissions = Array.isArray(review.evidenceSubmissions)
    ? review.evidenceSubmissions
    : [];

  const businessWebsite = firstMeaningfulString(
    business.website,
    business.siteUrl,
    business.domain,
  );
  const claimWebsite = firstMeaningfulString(
    claim.website,
    membership.website,
    review.website,
  );
  const businessEmail = firstMeaningfulString(
    business.email,
    business.contactEmail,
  );
  const claimantEmail = firstMeaningfulString(
    row.email,
    claim.email,
    membership.email,
    user.email,
  );
  const claimantEmailValues = uniqueNormalizedValues(
    [claim.email, membership.email, user.email, row.email],
    (value) => String(value || "").trim().toLowerCase() || null,
  );

  const businessNameStatus = compare(
    row.businessName,
    firstMeaningfulString(claim.businessName, membership.membershipName),
    (value) => normalizeComparisonText(value) || null,
  );
  const addressStatus = compare(
    business.address,
    firstMeaningfulString(claim.address, claim.businessAddress, membership.address),
    (value) => normalizeComparisonText(value) || null,
  );
  const phoneStatus = compare(
    business.phone,
    firstMeaningfulString(claim.phone, membership.phone, user.phone),
    normalizePhone,
  );
  const websiteStatus = compare(
    businessWebsite,
    claimWebsite,
    normalizeHostname,
  );
  const claimantDomainStatus = compare(
    claimantEmail,
    businessEmail || businessWebsite,
    (value) => extractEmailDomain(value) || normalizeHostname(value),
  );
  const claimantContactStatus =
    claimantEmailValues.length === 0
      ? "unknown"
      : claimantEmailValues.length === 1
        ? "pass"
        : "fail";
  const evidenceExistsStatus = evidenceSubmissions.length ? "pass" : "fail";
  const evidenceValidationStatus =
    String(review.evidenceValidationStatus || "").trim() === "auto_validated"
      ? "pass"
      : evidenceSubmissions.length
        ? "unknown"
        : "fail";
  const conflictingOwner =
    (Array.isArray(row.ownerUserIds) &&
      row.ownerUserIds.some((ownerId) => ownerId && ownerId !== row.userId)) ||
    (row.claimedByUserId != null && row.claimedByUserId !== row.userId);
  const conflictingClaimant = row.claimedByUserId && row.claimedByUserId !== row.userId;
  const repeatedFailure =
    auditHistory.some((item) => item?.action === "verification_failed") ||
    row.queueState === "ownership_verification_failed";
  const suspiciousTransition =
    auditHistory.some((item) => item?.action === "reopen_verification") &&
    auditHistory.some((item) => item?.action === "verify");

  const mandatoryFailures = [];
  const mandatoryUnknowns = [];
  for (const [label, status] of [
    ["Business listing history", row.business ? "pass" : "fail"],
    ["Business name match", businessNameStatus],
    ["Authenticated account identity", row.userId && row.user ? "pass" : "fail"],
    ["Claimant contact consistency", claimantContactStatus],
    ["Representative authority evidence", evidenceExistsStatus],
    ["Evidence validation boundary", evidenceValidationStatus],
    ["Conflicting verified owner detection", conflictingOwner ? "fail" : "pass"],
    ["Conflicting claimant detection", conflictingClaimant ? "fail" : "pass"],
  ]) {
    if (status === "fail") mandatoryFailures.push(label);
    if (status === "unknown") mandatoryUnknowns.push(label);
  }

  let disposition = "ADMIN_REVIEW_REQUIRED";
  if (row.queueState === "disputed") {
    disposition = "DISPUTED";
  } else if (conflictingOwner || conflictingClaimant) {
    disposition = "CONFLICT_BLOCKED";
  } else if (evidenceExistsStatus === "fail") {
    disposition = "MORE_EVIDENCE_REQUIRED";
  } else if (repeatedFailure) {
    disposition = "VERIFICATION_FAILED";
  } else if (
    mandatoryFailures.length === 0 &&
    mandatoryUnknowns.length === 0 &&
    businessNameStatus !== "fail" &&
    addressStatus !== "fail" &&
    phoneStatus !== "fail" &&
    websiteStatus !== "fail" &&
    claimantDomainStatus !== "fail" &&
    suspiciousTransition === false
  ) {
    disposition = "AUTO_VERIFY_ELIGIBLE";
  }

  return {
    disposition,
    blackOwnedStatusAutomationImplemented: false,
    paymentIntegritySeparateFromOwnership: true,
    businessIdentity: {
      businessNameStatus,
      addressStatus,
      phoneStatus,
      websiteStatus,
    },
    claimantAuthorization: {
      claimantContactStatus,
      claimantDomainStatus,
    },
    ownership: {
      evidenceExistsStatus,
      evidenceValidationStatus,
    },
    risk: {
      conflictingOwner: buildSignal(
        conflictingOwner ? "fail" : "pass",
        conflictingOwner ? "owner conflict" : "no owner conflict",
      ),
      suspiciousTransition: buildSignal(
        suspiciousTransition ? "fail" : "pass",
        suspiciousTransition ? "reopened after verify" : "no suspicious transition",
      ),
    },
    blackOwnedStatus: {
      evidenceStatus: buildSignal(
        "unknown",
        "no automatic Black-owned-status inference",
      ),
    },
    paymentIntegrity: {
      paymentStatus: buildSignal(
        row.paymentStatus === "paid" && row.payment ? "pass" : "fail",
        row.paymentStatus === "paid" && row.payment
          ? "payment linked"
          : "payment incomplete",
      ),
    },
  };
}

const baseRow = {
  membershipId: "membership-1",
  businessId: "business-1",
  userId: "user-1",
  email: "owner@example.com",
  businessName: "Example Business LLC",
  queueState: "ownership_verification_pending",
  business: {
    business_name: "Example Business LLC",
    address: "123 Auburn Ave Atlanta GA 30303",
    phone: "(404) 555-1111",
    website: "https://example.com",
    email: "owner@example.com",
  },
  claim: {
    businessName: "Example Business LLC",
    businessAddress: "123 Auburn Ave Atlanta GA 30303",
    phone: "4045551111",
    website: "example.com",
    email: "owner@example.com",
  },
  membership: {
    membershipName: "Example Business LLC",
    email: "owner@example.com",
    phone: "4045551111",
  },
  user: {
    email: "owner@example.com",
  },
  ownerUserIds: [],
  claimedByUserId: null,
  paymentStatus: "paid",
  payment: { _id: "payment-1" },
  review: {
    evidenceSubmissions: [
      { type: "written_owner_or_officer_authorization", storageKey: "doc-1" },
    ],
    evidenceValidationStatus: "auto_validated",
  },
  auditHistory: [],
};

const highConfidence = deriveDecision(baseRow);
assert.equal(highConfidence.disposition, "AUTO_VERIFY_ELIGIBLE");

const missingEvidence = deriveDecision({
  ...baseRow,
  review: { evidenceSubmissions: [] },
});
assert.equal(missingEvidence.disposition, "MORE_EVIDENCE_REQUIRED");

const nameAddressMismatch = deriveDecision({
  ...baseRow,
  claim: {
    ...baseRow.claim,
    businessName: "Other Business LLC",
    businessAddress: "999 Different St Atlanta GA 30310",
  },
});
assert.equal(nameAddressMismatch.disposition, "ADMIN_REVIEW_REQUIRED");

const claimantDomainMismatch = deriveDecision({
  ...baseRow,
  membership: { ...baseRow.membership, email: "owner@otherdomain.com" },
  email: "owner@otherdomain.com",
  user: { email: "owner@otherdomain.com" },
});
assert.equal(claimantDomainMismatch.disposition, "ADMIN_REVIEW_REQUIRED");

const existingVerifiedOwner = deriveDecision({
  ...baseRow,
  ownerUserIds: ["another-user"],
  claimedByUserId: "another-user",
});
assert.equal(existingVerifiedOwner.disposition, "CONFLICT_BLOCKED");

const twoClaimantsSameBusiness = deriveDecision({
  ...baseRow,
  claimedByUserId: "different-claimant",
});
assert.equal(twoClaimantsSameBusiness.disposition, "CONFLICT_BLOCKED");

const disputedHistory = deriveDecision({
  ...baseRow,
  auditHistory: [
    { action: "verify" },
    { action: "mark_disputed" },
    { action: "reopen_verification" },
  ],
});
assert.equal(disputedHistory.disposition, "ADMIN_REVIEW_REQUIRED");
assert.equal(disputedHistory.risk.suspiciousTransition.status, "fail");

const noBlackOwnedEvidence = deriveDecision(baseRow);
assert.equal(
  noBlackOwnedEvidence.blackOwnedStatus.evidenceStatus.status,
  "unknown",
);
assert.equal(noBlackOwnedEvidence.blackOwnedStatusAutomationImplemented, false);

const paymentCompleteOwnershipFails = deriveDecision({
  ...baseRow,
  paymentStatus: "paid",
  payment: { _id: "payment-2" },
  review: { evidenceSubmissions: [] },
});
assert.equal(paymentCompleteOwnershipFails.paymentIntegrity.paymentStatus.status, "pass");
assert.equal(paymentCompleteOwnershipFails.disposition, "MORE_EVIDENCE_REQUIRED");

console.log("verification-contract-tests: ok");
