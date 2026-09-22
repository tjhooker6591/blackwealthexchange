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
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw.includes("@")) return null;
  return (
    raw
      .split("@")
      .pop()
      ?.trim()
      .replace(/^www\./, "") || null
  );
}

function firstMeaningfulString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function hasComparableValue(...values) {
  return values.some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return value != null;
  });
}

function uniqueNormalizedValues(values, normalizer) {
  return Array.from(
    new Set(values.map((value) => normalizer(value)).filter(Boolean)),
  );
}

function compare(leftValue, rightValue, normalizer) {
  const left = normalizer(leftValue);
  const right = normalizer(rightValue);
  if (!left || !right) return "unknown";
  return left === right ? "pass" : "fail";
}

function countAuditActions(auditHistory, action) {
  return auditHistory.filter((item) => item?.action === action).length;
}

function buildMandatoryCondition(key, label, status, reason) {
  return { key, label, status, reason };
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
    (value) =>
      String(value || "")
        .trim()
        .toLowerCase() || null,
  );
  const businessAddress = firstMeaningfulString(
    business.address,
    business.streetAddress,
  );
  const claimAddress = firstMeaningfulString(
    claim.address,
    claim.businessAddress,
    membership.address,
    user.address,
  );
  const businessPhone = firstMeaningfulString(
    business.phone,
    business.contactPhone,
  );
  const claimantPhone = firstMeaningfulString(
    claim.phone,
    membership.phone,
    user.phone,
  );

  const businessNameStatus = compare(
    row.businessName,
    firstMeaningfulString(claim.businessName, membership.membershipName),
    (value) => normalizeComparisonText(value) || null,
  );
  const addressStatus = compare(
    businessAddress,
    claimAddress,
    (value) => normalizeComparisonText(value) || null,
  );
  const phoneStatus = compare(businessPhone, claimantPhone, normalizePhone);
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
  const conflictingClaimant =
    Array.isArray(row.normalCheck?.issues) &&
    row.normalCheck.issues.includes("conflicting_claimant");
  const competingClaimants = Number(row.competingClaimantCount || 0) > 1;
  const disputed =
    row.queueState === "disputed" || competingClaimants === true;
  const repeatedFailure =
    countAuditActions(auditHistory, "verification_failed") > 0 ||
    row.queueState === "ownership_verification_failed";
  const historicalDispute =
    countAuditActions(auditHistory, "mark_disputed") > 0 ||
    Boolean(review.revokedAt) ||
    Boolean(claim.revokedAt) ||
    Boolean(business.revokedAt) ||
    String(review.disputeState || "").trim().length > 0 ||
    String(claim.disputeState || "").trim().length > 0;
  const suspiciousTransition =
    countAuditActions(auditHistory, "reopen_verification") > 0 &&
    countAuditActions(auditHistory, "verify") > 0;
  const materialMismatch =
    businessNameStatus === "fail" ||
    addressStatus === "fail" ||
    phoneStatus === "fail" ||
    websiteStatus === "fail";

  const addressRequired = hasComparableValue(businessAddress, claimAddress);
  const websiteRequired = hasComparableValue(businessWebsite, claimWebsite);
  const phoneRequired = hasComparableValue(businessPhone, claimantPhone);
  const domainRequired = hasComparableValue(
    claimantEmail,
    businessEmail,
    businessWebsite,
  );

  const mandatoryConditions = [
    buildMandatoryCondition(
      "business_listing_history",
      "Existing BWE business identity/history",
      row.business ? "pass" : "fail",
      row.business
        ? "A current BWE business listing exists for this claim."
        : "No current BWE business listing was joined to the claim.",
    ),
    buildMandatoryCondition(
      "business_name_match",
      "Business name consistency",
      businessNameStatus,
      businessNameStatus === "pass"
        ? "Current BWE values are consistent."
        : businessNameStatus === "fail"
          ? "Current BWE values materially disagree."
          : "Current BWE records do not contain both values yet.",
    ),
    buildMandatoryCondition(
      "address_match_if_available",
      "Address consistency where available",
      addressRequired ? addressStatus : "not_applicable",
      addressRequired
        ? addressStatus === "pass"
          ? "Current BWE values are consistent."
          : addressStatus === "fail"
            ? "Current BWE values materially disagree."
            : "Current BWE records do not contain both values yet."
        : "Address comparison is not required because current BWE records do not provide both sides.",
    ),
    buildMandatoryCondition(
      "website_domain_match_if_available",
      "Website/domain consistency where available",
      websiteRequired ? websiteStatus : "not_applicable",
      websiteRequired
        ? websiteStatus === "pass"
          ? "Current BWE values are consistent."
          : websiteStatus === "fail"
            ? "Current BWE values materially disagree."
            : "Current BWE records do not contain both values yet."
        : "Website/domain comparison is not required because current BWE records do not provide both sides.",
    ),
    buildMandatoryCondition(
      "phone_match_if_available",
      "Phone/contact consistency where available",
      phoneRequired ? phoneStatus : "not_applicable",
      phoneRequired
        ? phoneStatus === "pass"
          ? "Current BWE values are consistent."
          : phoneStatus === "fail"
            ? "Current BWE values materially disagree."
            : "Current BWE records do not contain both values yet."
        : "Phone comparison is not required because current BWE records do not provide both sides.",
    ),
    buildMandatoryCondition(
      "authenticated_claimant",
      "Authenticated claimant",
      row.userId && row.user ? "pass" : "fail",
      row.userId && row.user
        ? "A claimant account record is linked to this membership."
        : "The claim is missing a joined authenticated claimant account.",
    ),
    buildMandatoryCondition(
      "claimant_account_linkage",
      "Claimant/account linkage",
      claimantContactStatus,
      claimantContactStatus === "pass"
        ? "Claim, membership, and user claimant contact values are consistent."
        : claimantContactStatus === "fail"
          ? "Claim, membership, and user claimant contact values disagree."
          : "Current BWE records do not yet contain claimant contact details from multiple sources.",
    ),
    buildMandatoryCondition(
      "claimant_domain_relationship_if_available",
      "Business-contact/domain relationship where available",
      domainRequired ? claimantDomainStatus : "not_applicable",
      domainRequired
        ? claimantDomainStatus === "pass"
          ? "Current BWE values are consistent."
          : claimantDomainStatus === "fail"
            ? "Current BWE values materially disagree."
            : "Current BWE records do not contain both values yet."
        : "Domain relationship is not required because current BWE records do not provide both sides.",
    ),
    buildMandatoryCondition(
      "representative_authority_evidence",
      "Submitted authority evidence where required",
      evidenceExistsStatus,
      evidenceExistsStatus === "pass"
        ? "Authority/ownership evidence was submitted and can be reviewed."
        : "No submitted authority evidence is attached to the current review record.",
    ),
    buildMandatoryCondition(
      "required_evidence_present",
      "Required ownership/control evidence present",
      evidenceExistsStatus,
      evidenceExistsStatus === "pass"
        ? `${evidenceSubmissions.length} evidence submission(s) are attached to the review record.`
        : "No ownership/control evidence has been submitted yet.",
    ),
    buildMandatoryCondition(
      "evidence_validation_boundary",
      "Evidence validation boundary",
      evidenceValidationStatus,
      evidenceValidationStatus === "pass"
        ? "Evidence was marked auto-validatable by the policy contract."
        : evidenceValidationStatus === "unknown"
          ? "BWE can confirm evidence presence and basic linkage, but not document-content validity automatically."
          : "Evidence content cannot be validated because required submissions are missing.",
    ),
    buildMandatoryCondition(
      "no_conflicting_verified_owner",
      "No conflicting verified owner",
      conflictingOwner ? "fail" : "pass",
      conflictingOwner
        ? "A different verified or claimed owner is already present."
        : "No conflicting verified owner was detected in current BWE ownership fields.",
    ),
    buildMandatoryCondition(
      "no_competing_claimant",
      "No competing claimant",
      conflictingClaimant || competingClaimants ? "fail" : "pass",
      competingClaimants
        ? `${row.competingClaimantCount} claimant records are linked to the same business identity.`
        : conflictingClaimant
          ? "A different claimant is already linked to this business state."
          : "No competing claimant set was detected in current BWE claim records.",
    ),
    buildMandatoryCondition(
      "no_disputed_or_revoked_state",
      "No disputed/revoked state",
      row.queueState === "disputed" || historicalDispute ? "fail" : "pass",
      historicalDispute
        ? "A prior dispute, revocation, or verification failure exists and blocks dry-run auto-verify."
        : row.queueState === "disputed"
          ? "This claim is currently disputed."
          : "No current dispute or failure state blocks ordinary verification flow.",
    ),
    buildMandatoryCondition(
      "no_material_identity_mismatch",
      "No material identity mismatch",
      materialMismatch ? "fail" : "pass",
      materialMismatch
        ? "At least one identity signal materially disagrees."
        : "No material disagreement was detected in the compared identity signals.",
    ),
    buildMandatoryCondition(
      "no_conflicting_business_records",
      "No conflicting business records",
      row.normalCheck?.verdict === "exception_admin_review" ? "fail" : "pass",
      row.normalCheck?.verdict === "exception_admin_review"
        ? "The DA-12 normal check already detected a record-level exception."
        : "The DA-12 normal check did not detect a record-level exception.",
    ),
    buildMandatoryCondition(
      "no_suspicious_state_contradiction",
      "No suspicious state contradiction",
      suspiciousTransition ? "fail" : "pass",
      suspiciousTransition
        ? "Verification was reopened after prior verification and needs admin review."
        : "No suspicious reopen-after-verify transition was detected in the audit trail.",
    ),
  ];

  const mandatoryFailures = mandatoryConditions
    .filter((condition) => condition.status === "fail")
    .map((condition) => condition.label);
  const mandatoryUnknowns = mandatoryConditions
    .filter((condition) => condition.status === "unknown")
    .map((condition) => condition.label);

  let disposition = "ADMIN_REVIEW_REQUIRED";
  if (disputed) {
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
    suspiciousTransition === false &&
    historicalDispute === false &&
    evidenceValidationStatus === "pass"
  ) {
    disposition = "AUTO_VERIFY_ELIGIBLE";
  }

  return {
    disposition,
    blackOwnedStatusAutomationImplemented: false,
    blackOwnedStatusLabel: "NOT_ESTABLISHED",
    paymentIntegritySeparateFromOwnership: true,
    ownershipAutomationPermitted: false,
    mandatoryFailures,
    mandatoryUnknowns,
    mandatoryConditions,
    paymentIntegrity: {
      paymentStatus: {
        status:
          row.paymentStatus === "paid" && row.payment != null ? "pass" : "fail",
      },
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
  competingClaimantCount: 1,
  normalCheck: { verdict: "routine_admin_review", issues: [] },
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
assert.equal(highConfidence.ownershipAutomationPermitted, false);

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

const authorizationMismatch = deriveDecision({
  ...baseRow,
  membership: { ...baseRow.membership, email: "owner@otherdomain.com" },
  user: { email: "owner@otherdomain.com" },
  email: "owner@otherdomain.com",
});
assert.equal(authorizationMismatch.disposition, "ADMIN_REVIEW_REQUIRED");

const existingVerifiedOwner = deriveDecision({
  ...baseRow,
  ownerUserIds: ["another-user"],
  claimedByUserId: "another-user",
});
assert.equal(existingVerifiedOwner.disposition, "CONFLICT_BLOCKED");

const competingClaimants = deriveDecision({
  ...baseRow,
  competingClaimantCount: 2,
});
assert.equal(competingClaimants.disposition, "DISPUTED");

const disputedHistory = deriveDecision({
  ...baseRow,
  auditHistory: [{ action: "mark_disputed" }],
});
assert.equal(disputedHistory.disposition, "ADMIN_REVIEW_REQUIRED");

const paymentCompleteOwnershipFails = deriveDecision({
  ...baseRow,
  paymentStatus: "paid",
  payment: { _id: "payment-2" },
  review: { evidenceSubmissions: [] },
});
assert.equal(
  paymentCompleteOwnershipFails.paymentIntegrity.paymentStatus.status,
  "pass",
);
assert.equal(
  paymentCompleteOwnershipFails.disposition,
  "MORE_EVIDENCE_REQUIRED",
);

const blackOwnedStatusUnknown = deriveDecision(baseRow);
assert.equal(blackOwnedStatusUnknown.blackOwnedStatusLabel, "NOT_ESTABLISHED");
assert.equal(
  blackOwnedStatusUnknown.blackOwnedStatusAutomationImplemented,
  false,
);

console.log("verification-contract-tests: ok");
