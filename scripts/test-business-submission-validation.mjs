import assert from "node:assert/strict";
import {
  buildUniqueSlug,
  deriveNewBusinessVerificationDecision,
  getCreateBusinessDuplicateError,
  getCreateBusinessSuccessMessage,
  getNewBusinessActivationBlueprint,
  normalizeLocationParts,
  normalizeOptionalUrl,
  slugifyBusinessName,
  validateBusinessSubmission,
} from "../src/lib/businessSubmission.ts";

function makeValidInput() {
  return {
    businessName: "SweetTes Bakery",
    category: "Food",
    location: "Allentown pa",
    addressLine1: "123 Main St",
    city: "Allentown",
    state: "PA",
    postalCode: "18101",
    phone: "9415265647",
    email: "hello@sweettesbakery.com",
    businessEmail: "hello@sweettesbakery.com",
    website: "sweettesbakery.com",
    description: "Fresh baked goods and desserts.",
    facebook: "",
    twitter: "",
    claimantName: "Alicia Owner",
    claimantEmail: "alicia@sweettesbakery.com",
    claimantPhone: "9415265647",
    relationshipToBusiness: "OWNER",
    claimantRoleTitle: "Founder",
    owners: [
      {
        ownerName: "Alicia Owner",
        ownershipPercentage: 100,
        roleTitle: "Founder",
        controlRole: "CEO",
        isBlackAttested: true,
        attestationDate: "2026-08-11",
        ownershipEvidenceIds: ["own-doc-1"],
        controlEvidenceIds: ["ctrl-doc-1"],
      },
    ],
    evidence: [
      {
        evidenceId: "own-doc-1",
        evidenceType: "ownership_attestation",
        purpose: "ownership",
        reference: "https://example.test/own-doc-1.pdf",
        sourceLabel: "applicant_submission",
        ownerName: "Alicia Owner",
        businessName: "SweetTes Bakery",
        ownershipPercentage: 100,
      },
      {
        evidenceId: "ctrl-doc-1",
        evidenceType: "control_attestation",
        purpose: "control",
        reference: "https://example.test/ctrl-doc-1.pdf",
        sourceLabel: "applicant_submission",
        ownerName: "Alicia Owner",
        businessName: "SweetTes Bakery",
        ownershipPercentage: 100,
      },
    ],
  };
}

function expectError(input, message) {
  const result = validateBusinessSubmission(input);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, message);
  }
}

const valid = validateBusinessSubmission(makeValidInput());
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.value.businessName, "SweetTes Bakery");
  assert.equal(valid.value.email, "hello@sweettesbakery.com");
  assert.equal(valid.value.businessEmail, "hello@sweettesbakery.com");
  assert.equal(valid.value.category, "food");
  assert.equal(valid.value.phone, "9415265647");
  assert.equal(valid.value.claimantEmail, "alicia@sweettesbakery.com");
  assert.equal(valid.value.relationshipToBusiness, "OWNER");
  assert.equal(valid.value.owners.length, 1);
  assert.equal(valid.value.evidence.length, 2);
  assert.equal(valid.value.normalizedLocation.normalized, "Allentown, PA");
  assert.equal(valid.value.normalizedLocation.city, "Allentown");
  assert.equal(valid.value.normalizedLocation.state, "PA");
  assert.equal(valid.value.slugBase, "sweettes-bakery");
}

const decision = deriveNewBusinessVerificationDecision(valid.value);
assert.equal(decision.disposition, "AUTO_VERIFIED_BLACK_OWNED");
assert.equal(decision.status, "auto_verified_black_owned");
assert.equal(
  decision.qualifyingOwnership.qualifyingBlackOwnershipPercentage,
  100,
);
assert.equal(decision.publicListingEligibility.status, "PASS");
assert.equal(decision.automaticRacialInference, "NO");

const fiftyPercent = validateBusinessSubmission({
  ...makeValidInput(),
  owners: [
    {
      ownerName: "Alicia Owner",
      ownershipPercentage: 50,
      roleTitle: "Founder",
      controlRole: "CEO",
      isBlackAttested: true,
      attestationDate: "2026-08-11",
      ownershipEvidenceIds: ["own-doc-1"],
      controlEvidenceIds: ["ctrl-doc-1"],
    },
    {
      ownerName: "Jordan Partner",
      ownershipPercentage: 50,
      roleTitle: "Partner",
      controlRole: "Partner",
      isBlackAttested: false,
      attestationDate: "2026-08-11",
      ownershipEvidenceIds: ["own-doc-2"],
      controlEvidenceIds: ["ctrl-doc-2"],
    },
  ],
  evidence: [
    ...makeValidInput().evidence,
    {
      evidenceId: "own-doc-2",
      evidenceType: "ownership_attestation",
      purpose: "ownership",
      reference: "https://example.test/own-doc-2.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Jordan Partner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 50,
    },
    {
      evidenceId: "ctrl-doc-2",
      evidenceType: "control_attestation",
      purpose: "control",
      reference: "https://example.test/ctrl-doc-2.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Jordan Partner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 50,
    },
  ],
});
assert.equal(fiftyPercent.ok, true);
if (fiftyPercent.ok) {
  const decision50 = deriveNewBusinessVerificationDecision(fiftyPercent.value);
  assert.equal(decision50.disposition, "VERIFICATION_FAILED");
}

const multipleOwners = validateBusinessSubmission({
  ...makeValidInput(),
  owners: [
    {
      ownerName: "Alicia Owner",
      ownershipPercentage: 30,
      roleTitle: "Founder",
      controlRole: "CEO",
      isBlackAttested: true,
      attestationDate: "2026-08-11",
      ownershipEvidenceIds: ["own-doc-1"],
      controlEvidenceIds: ["ctrl-doc-1"],
    },
    {
      ownerName: "Nia Partner",
      ownershipPercentage: 25,
      roleTitle: "Partner",
      controlRole: "Managing Member",
      isBlackAttested: true,
      attestationDate: "2026-08-11",
      ownershipEvidenceIds: ["own-doc-2"],
      controlEvidenceIds: ["ctrl-doc-2"],
    },
    {
      ownerName: "Other Owner",
      ownershipPercentage: 45,
      roleTitle: "Partner",
      controlRole: "Partner",
      isBlackAttested: false,
      attestationDate: "2026-08-11",
      ownershipEvidenceIds: ["own-doc-3"],
      controlEvidenceIds: ["ctrl-doc-3"],
    },
  ],
  evidence: [
    {
      evidenceId: "own-doc-1",
      evidenceType: "ownership_attestation",
      purpose: "ownership",
      reference: "https://example.test/own-doc-1.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Alicia Owner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 30,
    },
    {
      evidenceId: "ctrl-doc-1",
      evidenceType: "control_attestation",
      purpose: "control",
      reference: "https://example.test/ctrl-doc-1.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Alicia Owner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 30,
    },
    {
      evidenceId: "own-doc-2",
      evidenceType: "ownership_attestation",
      purpose: "ownership",
      reference: "https://example.test/own-doc-2.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Nia Partner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 25,
    },
    {
      evidenceId: "ctrl-doc-2",
      evidenceType: "control_attestation",
      purpose: "control",
      reference: "https://example.test/ctrl-doc-2.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Nia Partner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 25,
    },
    {
      evidenceId: "own-doc-3",
      evidenceType: "ownership_attestation",
      purpose: "ownership",
      reference: "https://example.test/own-doc-3.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Other Owner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 45,
    },
    {
      evidenceId: "ctrl-doc-3",
      evidenceType: "control_attestation",
      purpose: "control",
      reference: "https://example.test/ctrl-doc-3.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Other Owner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 45,
    },
  ],
});
assert.equal(multipleOwners.ok, true);
if (multipleOwners.ok) {
  const multiDecision = deriveNewBusinessVerificationDecision(
    multipleOwners.value,
  );
  assert.equal(multiDecision.disposition, "AUTO_VERIFIED_BLACK_OWNED");
  assert.equal(
    multiDecision.qualifyingOwnership.qualifyingBlackOwnershipPercentage,
    55,
  );
}

const missingAttestation = validateBusinessSubmission({
  ...makeValidInput(),
  owners: [
    {
      ownerName: "Alicia Owner",
      ownershipPercentage: 100,
      roleTitle: "Founder",
      controlRole: "CEO",
      isBlackAttested: true,
      attestationDate: "",
      ownershipEvidenceIds: ["own-doc-1"],
      controlEvidenceIds: ["ctrl-doc-1"],
    },
  ],
});
assert.equal(missingAttestation.ok, true);
if (missingAttestation.ok) {
  const missingDecision = deriveNewBusinessVerificationDecision(
    missingAttestation.value,
  );
  assert.equal(missingDecision.disposition, "MORE_EVIDENCE_REQUIRED");
}

const representativeCase = validateBusinessSubmission({
  ...makeValidInput(),
  relationshipToBusiness: "AUTHORIZED_REPRESENTATIVE",
  claimantEmail: "agent@sweettesbakery.com",
  evidence: [
    ...makeValidInput().evidence,
    {
      evidenceId: "auth-doc-1",
      evidenceType: "authorized_representative_letter",
      purpose: "authority",
      reference: "https://example.test/auth-doc-1.pdf",
      sourceLabel: "applicant_submission",
      ownerName: "Alicia Owner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 100,
    },
  ],
});
assert.equal(representativeCase.ok, true);
if (representativeCase.ok) {
  const repDecision = deriveNewBusinessVerificationDecision(
    representativeCase.value,
  );
  assert.equal(repDecision.disposition, "AUTO_VERIFIED_BLACK_OWNED");
}

const conflictDecision = deriveNewBusinessVerificationDecision(valid.value, {
  existingBusinessConflict: true,
});
assert.equal(conflictDecision.disposition, "CONFLICT_BLOCKED");

const disputedDecision = deriveNewBusinessVerificationDecision(valid.value, {
  competingClaim: true,
});
assert.equal(disputedDecision.disposition, "CONFLICT_BLOCKED");

const ambiguousEvidence = validateBusinessSubmission({
  ...makeValidInput(),
  evidence: [
    {
      evidenceId: "own-doc-1",
      evidenceType: "other",
      purpose: "ownership",
      reference: "mystery-document",
      sourceLabel: "applicant_submission",
      ownerName: "Alicia Owner",
      businessName: "SweetTes Bakery",
      ownershipPercentage: 100,
    },
  ],
});
assert.equal(ambiguousEvidence.ok, true);
if (ambiguousEvidence.ok) {
  const ambiguousDecision = deriveNewBusinessVerificationDecision(
    ambiguousEvidence.value,
  );
  assert.equal(ambiguousDecision.disposition, "ADMIN_REVIEW_REQUIRED");
}

expectError(
  { ...makeValidInput(), claimantEmail: "not-an-email" },
  "Please enter a valid claimant email address.",
);
expectError(
  { ...makeValidInput(), owners: [] },
  "Please add at least one qualifying owner record.",
);

assert.deepEqual(normalizeLocationParts("Allentown pa"), {
  normalized: "Allentown, PA",
  city: "Allentown",
  state: "PA",
});
assert.equal(
  normalizeOptionalUrl("sweettesbakery.com"),
  "https://sweettesbakery.com",
);
assert.equal(slugifyBusinessName("SweetTes Bakery"), "sweettes-bakery");
assert.equal(buildUniqueSlug("sweettes-bakery", 0), "sweettes-bakery");
assert.equal(buildUniqueSlug("sweettes-bakery", 2), "sweettes-bakery-3");
assert.equal(
  getCreateBusinessDuplicateError(),
  "A business with this name appears to already exist. Please update the business name slightly or contact support if this is your listing.",
);
assert.equal(
  getCreateBusinessSuccessMessage(),
  "Business submitted for automated verification.",
);

const activationBlueprint = getNewBusinessActivationBlueprint();
assert.equal(activationBlueprint.mode, "DRY_RUN");
assert.equal(activationBlueprint.automaticActivationEnabled, false);

console.log("business submission validation tests: PASS");
console.log(
  "Prospective automated Black-owned verification contract is deterministic and dry-run only.",
);
