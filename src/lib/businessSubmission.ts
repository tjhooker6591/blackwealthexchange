export type BusinessClaimantRelationship =
  | "OWNER"
  | "OFFICER"
  | "AUTHORIZED_REPRESENTATIVE";

export type NewBusinessEvidencePurpose =
  | "BUSINESS_LEGITIMACY"
  | "OWNERSHIP"
  | "CONTROL"
  | "AUTHORITY"
  | "BLACK_ATTESTATION";

export type NewBusinessEvidenceType =
  | "BUSINESS_LICENSE"
  | "ARTICLES_OF_INCORPORATION"
  | "OPERATING_AGREEMENT"
  | "OWNERSHIP_ATTESTATION"
  | "OWNERSHIP_LEDGER"
  | "GOVERNMENT_REGISTRATION"
  | "AUTHORIZED_REPRESENTATIVE_LETTER"
  | "CONTROL_ATTESTATION"
  | "OTHER";

export type NewBusinessOwnerInput = {
  ownerName: string;
  ownershipPercentage: number | string;
  roleTitle: string;
  controlRole: string;
  isBlackAttested: boolean;
  attestationDate: string;
  ownershipEvidenceIds?: string[];
  controlEvidenceIds?: string[];
};

export type NewBusinessEvidenceInput = {
  evidenceId?: string;
  evidenceType: string;
  purpose: string;
  reference: string;
  sourceLabel?: string;
  ownerName?: string;
  businessName?: string;
  ownershipPercentage?: number | string;
};

export type BusinessSubmissionInput = {
  businessName: string;
  category: string;
  location: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone: string;
  email: string;
  website?: string;
  businessEmail?: string;
  description: string;
  facebook?: string;
  twitter?: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  relationshipToBusiness: string;
  claimantRoleTitle?: string;
  owners?: NewBusinessOwnerInput[];
  evidence?: NewBusinessEvidenceInput[];
};

export type NormalizedLocation = {
  normalized: string;
  city: string;
  state: string;
};

export type NormalizedBusinessOwnerRecord = {
  ownerName: string;
  ownershipPercentage: number | null;
  roleTitle: string;
  controlRole: string;
  isBlackAttested: boolean;
  attestationDate: string;
  ownershipEvidenceIds: string[];
  controlEvidenceIds: string[];
};

export type NormalizedBusinessEvidenceRecord = {
  evidenceId: string;
  evidenceType: NewBusinessEvidenceType;
  purpose: NewBusinessEvidencePurpose;
  reference: string;
  sourceLabel: string;
  ownerName: string;
  businessName: string;
  ownershipPercentage: number | null;
  supported: boolean;
};

export type NormalizedBusinessSubmission = {
  businessName: string;
  category: string;
  location: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  normalizedLocation: NormalizedLocation;
  phone: string;
  email: string;
  website: string;
  businessEmail: string;
  description: string;
  facebook: string;
  twitter: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  relationshipToBusiness: BusinessClaimantRelationship;
  claimantRoleTitle: string;
  owners: NormalizedBusinessOwnerRecord[];
  evidence: NormalizedBusinessEvidenceRecord[];
  slugBase: string;
};

export type BusinessSubmissionValidationResult =
  | { ok: true; value: NormalizedBusinessSubmission }
  | { ok: false; error: string };

export type VerificationSignalStatus = "PASS" | "FAIL" | "UNKNOWN";

export type NewBusinessVerificationDisposition =
  | "AUTO_VERIFIED_BLACK_OWNED"
  | "MORE_EVIDENCE_REQUIRED"
  | "ADMIN_REVIEW_REQUIRED"
  | "CONFLICT_BLOCKED"
  | "DISPUTED"
  | "VERIFICATION_FAILED";

export type AutomatedFollowUpRequest = {
  code:
    | "MISSING_OWNERSHIP_PERCENTAGE"
    | "MISSING_BLACK_ATTESTATION"
    | "MISSING_OWNERSHIP_EVIDENCE"
    | "MISSING_CONTROL_EVIDENCE"
    | "MISSING_AUTHORITY_EVIDENCE"
    | "MISSING_CLAIMANT_RELATIONSHIP";
  message: string;
};

export type VerificationSignalGroup = {
  name: string;
  status: VerificationSignalStatus;
  reason: string;
};

export type QualifyingOwnershipSummary = {
  totalOwnershipPercentage: number;
  qualifyingBlackOwnershipPercentage: number;
  hasRequiredControl: boolean;
  ownershipStructureConsistent: boolean;
  qualifyingOwnerCount: number;
};

export type NewBusinessAutomationMode =
  | "DRY_RUN"
  | "AUTO_VERIFY_DISABLED"
  | "AUTO_VERIFY_ENABLED";

export type NewBusinessActivationBlueprint = {
  mode: NewBusinessAutomationMode;
  automaticActivationEnabled: boolean;
  requiredRechecks: string[];
  properties: string[];
};

export type NewBusinessVerificationDecision = {
  disposition: NewBusinessVerificationDisposition;
  status:
    | "auto_verified_black_owned"
    | "more_evidence_required"
    | "admin_review_required"
    | "conflict_blocked"
    | "disputed"
    | "verification_failed";
  summary: string;
  businessLegitimacy: VerificationSignalGroup;
  claimantAuthorization: VerificationSignalGroup;
  ownershipControl: VerificationSignalGroup;
  blackOwnershipEligibility: VerificationSignalGroup;
  riskConflict: VerificationSignalGroup;
  evidenceValidation: VerificationSignalGroup;
  publicListingEligibility: VerificationSignalGroup;
  qualifyingOwnership: QualifyingOwnershipSummary;
  requiredActions: AutomatedFollowUpRequest[];
  activationBlueprint: NewBusinessActivationBlueprint;
  automaticRacialInference: "NO";
};

const SUPPORTED_EVIDENCE_TYPES: Record<string, NewBusinessEvidenceType> = {
  business_license: "BUSINESS_LICENSE",
  articles_of_incorporation: "ARTICLES_OF_INCORPORATION",
  operating_agreement: "OPERATING_AGREEMENT",
  ownership_attestation: "OWNERSHIP_ATTESTATION",
  ownership_ledger: "OWNERSHIP_LEDGER",
  government_registration: "GOVERNMENT_REGISTRATION",
  authorized_representative_letter: "AUTHORIZED_REPRESENTATIVE_LETTER",
  control_attestation: "CONTROL_ATTESTATION",
  other: "OTHER",
};

const SUPPORTED_EVIDENCE_PURPOSES: Record<string, NewBusinessEvidencePurpose> =
  {
    business_legitimacy: "BUSINESS_LEGITIMACY",
    ownership: "OWNERSHIP",
    control: "CONTROL",
    authority: "AUTHORITY",
    black_attestation: "BLACK_ATTESTATION",
  };

const ALLOWED_RELATIONSHIPS: Record<string, BusinessClaimantRelationship> = {
  owner: "OWNER",
  officer: "OFFICER",
  authorized_representative: "AUTHORIZED_REPRESENTATIVE",
};

const QUALIFYING_CONTROL_ROLES = new Set([
  "owner",
  "founder",
  "president",
  "chief executive officer",
  "ceo",
  "managing member",
  "general partner",
  "manager",
]);

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeOptionalUrl(raw: string) {
  const value = normalizeText(raw);
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, "").trim();
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

function normalizePostalCode(raw: string) {
  return normalizeText(raw).toUpperCase();
}

function parsePercentage(raw: number | string | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw * 100) / 100;
  }

  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100) / 100;
    }
  }

  return null;
}

function getDomainFromUrlOrEmail(value: string) {
  const trimmed = normalizeText(value).toLowerCase();
  if (!trimmed) return "";

  if (trimmed.includes("@")) {
    return trimmed.split("@")[1] || "";
  }

  try {
    const parsed = new URL(normalizeOptionalUrl(trimmed));
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeLocationParts(raw: string): NormalizedLocation {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) {
    return { normalized: "", city: "", state: "" };
  }

  if (value.includes(",")) {
    const [city = "", state = ""] = value.split(",").map((s) => s.trim());
    return {
      normalized: [city, state ? state.toUpperCase() : ""]
        .filter(Boolean)
        .join(", "),
      city,
      state: state.toUpperCase(),
    };
  }

  const parts = value.split(" ");
  if (parts.length >= 2) {
    const state = parts[parts.length - 1]?.trim() || "";
    const city = parts.slice(0, -1).join(" ").trim();
    if (city && /^[A-Za-z]{2,}$/.test(state)) {
      return {
        normalized: `${city}, ${state.toUpperCase()}`,
        city,
        state: state.toUpperCase(),
      };
    }
  }

  return { normalized: value, city: value, state: "" };
}

export function slugifyBusinessName(businessName: string) {
  return businessName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUniqueSlug(slugBase: string, existingCount: number) {
  if (!slugBase) return undefined;
  if (existingCount <= 0) return slugBase;
  return `${slugBase}-${existingCount + 1}`;
}

function normalizeRelationship(
  value: string,
): BusinessClaimantRelationship | null {
  return ALLOWED_RELATIONSHIPS[normalizeTag(value)] || null;
}

function normalizeEvidence(
  item: NewBusinessEvidenceInput,
  index: number,
  businessName: string,
): NormalizedBusinessEvidenceRecord {
  const evidenceTypeTag = normalizeTag(item.evidenceType);
  const purposeTag = normalizeTag(item.purpose);
  const evidenceType = SUPPORTED_EVIDENCE_TYPES[evidenceTypeTag] || "OTHER";
  const purpose =
    SUPPORTED_EVIDENCE_PURPOSES[purposeTag] || "BUSINESS_LEGITIMACY";
  const supported = evidenceType !== "OTHER";

  return {
    evidenceId: normalizeText(item.evidenceId || `evidence-${index + 1}`),
    evidenceType,
    purpose,
    reference: normalizeText(item.reference),
    sourceLabel: normalizeText(item.sourceLabel || "applicant_submission"),
    ownerName: normalizeText(item.ownerName || ""),
    businessName: normalizeText(item.businessName || businessName),
    ownershipPercentage: parsePercentage(item.ownershipPercentage),
    supported,
  };
}

function normalizeOwners(
  owners: NewBusinessOwnerInput[] | undefined,
): NormalizedBusinessOwnerRecord[] {
  return (owners || []).map((owner) => ({
    ownerName: normalizeText(owner.ownerName),
    ownershipPercentage: parsePercentage(owner.ownershipPercentage),
    roleTitle: normalizeText(owner.roleTitle),
    controlRole: normalizeText(owner.controlRole),
    isBlackAttested: Boolean(owner.isBlackAttested),
    attestationDate: normalizeText(owner.attestationDate),
    ownershipEvidenceIds: Array.isArray(owner.ownershipEvidenceIds)
      ? owner.ownershipEvidenceIds
          .map((value) => normalizeText(String(value || "")))
          .filter(Boolean)
      : [],
    controlEvidenceIds: Array.isArray(owner.controlEvidenceIds)
      ? owner.controlEvidenceIds
          .map((value) => normalizeText(String(value || "")))
          .filter(Boolean)
      : [],
  }));
}

export function validateBusinessSubmission(
  input: BusinessSubmissionInput,
): BusinessSubmissionValidationResult {
  const businessName = normalizeText(input.businessName);
  const category = normalizeTag(input.category);
  const location = normalizeText(input.location);
  const normalizedLocation = normalizeLocationParts(location);
  const addressLine1 = normalizeText(input.addressLine1 || "");
  const city = normalizeText(input.city || normalizedLocation.city);
  const state = normalizeText(
    input.state || normalizedLocation.state,
  ).toUpperCase();
  const postalCode = normalizePostalCode(input.postalCode || "");
  const phone = normalizePhone(input.phone);
  const email = normalizeText(input.email).toLowerCase();
  const website = normalizeOptionalUrl(input.website || "");
  const businessEmail = normalizeText(
    input.businessEmail || input.email,
  ).toLowerCase();
  const description = normalizeText(input.description);
  const facebook = normalizeOptionalUrl(input.facebook || "");
  const twitter = normalizeOptionalUrl(input.twitter || "");
  const claimantName = normalizeText(input.claimantName);
  const claimantEmail = normalizeText(input.claimantEmail).toLowerCase();
  const claimantPhone = normalizePhone(input.claimantPhone);
  const relationshipToBusiness = normalizeRelationship(
    input.relationshipToBusiness || "",
  );
  const claimantRoleTitle = normalizeText(input.claimantRoleTitle || "");
  const owners = normalizeOwners(input.owners);
  const evidence = (input.evidence || []).map((item, index) =>
    normalizeEvidence(item, index, businessName),
  );
  const slugBase = slugifyBusinessName(businessName);

  if (!businessName || !email || !category) {
    return {
      ok: false,
      error: "Business name, email, and category are required.",
    };
  }

  if (!normalizedLocation.normalized) {
    return {
      ok: false,
      error: "Please enter a location, for example: Allentown, PA.",
    };
  }

  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (!isValidPhone(phone)) {
    return {
      ok: false,
      error: "Please enter a valid phone number with at least 10 digits.",
    };
  }

  if (!description) {
    return { ok: false, error: "Please add a short business description." };
  }

  if (!claimantName || !claimantEmail || !relationshipToBusiness) {
    return {
      ok: false,
      error:
        "Claimant name, claimant email, and relationship to the business are required.",
    };
  }

  if (!isValidEmail(claimantEmail)) {
    return {
      ok: false,
      error: "Please enter a valid claimant email address.",
    };
  }

  if (!isValidPhone(claimantPhone)) {
    return {
      ok: false,
      error:
        "Please enter a valid claimant phone number with at least 10 digits.",
    };
  }

  if (!owners.length) {
    return {
      ok: false,
      error: "Please add at least one qualifying owner record.",
    };
  }

  return {
    ok: true,
    value: {
      businessName,
      category,
      location,
      addressLine1,
      city,
      state,
      postalCode,
      normalizedLocation,
      phone,
      email,
      website,
      businessEmail,
      description,
      facebook,
      twitter,
      claimantName,
      claimantEmail,
      claimantPhone,
      relationshipToBusiness,
      claimantRoleTitle,
      owners,
      evidence,
      slugBase,
    },
  };
}

function buildRequiredActions(
  submission: NormalizedBusinessSubmission,
): AutomatedFollowUpRequest[] {
  const requests: AutomatedFollowUpRequest[] = [];

  if (!submission.relationshipToBusiness) {
    requests.push({
      code: "MISSING_CLAIMANT_RELATIONSHIP",
      message: "Please confirm your relationship to the business.",
    });
  }

  const relationshipNeedsAuthority =
    submission.relationshipToBusiness === "AUTHORIZED_REPRESENTATIVE";
  const relationshipNeedsOwnership =
    submission.relationshipToBusiness === "OWNER" ||
    submission.relationshipToBusiness === "OFFICER";

  const authorityEvidence = submission.evidence.filter(
    (item) => item.purpose === "AUTHORITY",
  );
  const ownershipEvidence = submission.evidence.filter(
    (item) => item.purpose === "OWNERSHIP",
  );
  const controlEvidence = submission.evidence.filter(
    (item) => item.purpose === "CONTROL",
  );

  if (relationshipNeedsAuthority && authorityEvidence.length === 0) {
    requests.push({
      code: "MISSING_AUTHORITY_EVIDENCE",
      message:
        "Please provide representative-authority evidence before we can verify this business.",
    });
  }

  if (relationshipNeedsOwnership && ownershipEvidence.length === 0) {
    requests.push({
      code: "MISSING_OWNERSHIP_EVIDENCE",
      message:
        "Please provide ownership evidence before we can verify this business.",
    });
  }

  if (controlEvidence.length === 0) {
    requests.push({
      code: "MISSING_CONTROL_EVIDENCE",
      message:
        "Please provide control or management evidence for the qualifying owner structure.",
    });
  }

  for (const owner of submission.owners) {
    if (owner.ownershipPercentage === null) {
      requests.push({
        code: "MISSING_OWNERSHIP_PERCENTAGE",
        message: `Please provide an ownership percentage for ${owner.ownerName || "each qualifying owner"}.`,
      });
    }

    if (owner.isBlackAttested && !owner.attestationDate) {
      requests.push({
        code: "MISSING_BLACK_ATTESTATION",
        message: `Please complete the Black self-attestation record for ${owner.ownerName || "each qualifying owner"}.`,
      });
    }

    if (owner.ownershipEvidenceIds.length === 0) {
      requests.push({
        code: "MISSING_OWNERSHIP_EVIDENCE",
        message: `Please link ownership evidence for ${owner.ownerName || "each qualifying owner"}.`,
      });
    }

    if (owner.controlEvidenceIds.length === 0) {
      requests.push({
        code: "MISSING_CONTROL_EVIDENCE",
        message: `Please link control evidence for ${owner.ownerName || "each qualifying owner"}.`,
      });
    }
  }

  return requests.filter(
    (item, index, items) =>
      items.findIndex(
        (entry) => entry.code === item.code && entry.message === item.message,
      ) === index,
  );
}

function findEvidenceByIds(
  evidence: NormalizedBusinessEvidenceRecord[],
  ids: string[],
  purpose: NewBusinessEvidencePurpose,
) {
  const set = new Set(ids);
  return evidence.filter(
    (item) => item.purpose === purpose && set.has(item.evidenceId),
  );
}

function summarizeOwnership(
  submission: NormalizedBusinessSubmission,
): QualifyingOwnershipSummary {
  let totalOwnershipPercentage = 0;
  let qualifyingBlackOwnershipPercentage = 0;
  let qualifyingOwnerCount = 0;
  let hasRequiredControl = false;
  let ownershipStructureConsistent = submission.owners.length > 0;

  for (const owner of submission.owners) {
    const percentage = owner.ownershipPercentage;
    if (percentage === null) {
      ownershipStructureConsistent = false;
      continue;
    }

    if (percentage < 0 || percentage > 100) {
      ownershipStructureConsistent = false;
    }

    totalOwnershipPercentage += percentage;

    const ownershipEvidence = findEvidenceByIds(
      submission.evidence,
      owner.ownershipEvidenceIds,
      "OWNERSHIP",
    );
    const controlEvidence = findEvidenceByIds(
      submission.evidence,
      owner.controlEvidenceIds,
      "CONTROL",
    );
    const ownershipVerified =
      ownershipEvidence.length > 0 &&
      ownershipEvidence.every((item) => item.supported && item.reference);
    const controlVerified =
      controlEvidence.length > 0 &&
      controlEvidence.every((item) => item.supported && item.reference);

    if (
      owner.isBlackAttested &&
      owner.attestationDate &&
      ownershipVerified &&
      controlVerified
    ) {
      qualifyingOwnerCount += 1;
      qualifyingBlackOwnershipPercentage += percentage;
      if (QUALIFYING_CONTROL_ROLES.has(owner.controlRole.toLowerCase())) {
        hasRequiredControl = true;
      }
    }
  }

  if (Math.abs(totalOwnershipPercentage - 100) > 0.01) {
    ownershipStructureConsistent = false;
  }

  return {
    totalOwnershipPercentage: Math.round(totalOwnershipPercentage * 100) / 100,
    qualifyingBlackOwnershipPercentage:
      Math.round(qualifyingBlackOwnershipPercentage * 100) / 100,
    hasRequiredControl,
    ownershipStructureConsistent,
    qualifyingOwnerCount,
  };
}

function getNewBusinessAutomationMode(): NewBusinessAutomationMode {
  const raw = normalizeTag(
    process.env.NEW_BUSINESS_BLACK_OWNED_AUTOMATION_MODE || "dry_run",
  );
  if (raw === "auto_verify_enabled") return "AUTO_VERIFY_ENABLED";
  if (raw === "auto_verify_disabled") return "AUTO_VERIFY_DISABLED";
  return "DRY_RUN";
}

export function getNewBusinessActivationBlueprint(): NewBusinessActivationBlueprint {
  const mode = getNewBusinessAutomationMode();
  return {
    mode,
    automaticActivationEnabled: mode === "AUTO_VERIFY_ENABLED",
    requiredRechecks: [
      "verification decision still current",
      "policy version current",
      "business state unchanged",
      "ownership state unchanged",
      "claimant still eligible",
      "qualifying Black ownership still >= 51%",
      "no new owner conflict",
      "no competing claim",
      "no dispute",
      "no revocation",
    ],
    properties: [
      "ATOMIC",
      "IDEMPOTENT",
      "REPLAY SAFE",
      "CONFLICT SAFE",
      "AUDITABLE",
    ],
  };
}

function buildSignal(
  name: string,
  status: VerificationSignalStatus,
  reason: string,
): VerificationSignalGroup {
  return { name, status, reason };
}

export function deriveNewBusinessVerificationDecision(
  submission: NormalizedBusinessSubmission,
  options?: {
    existingBusinessConflict?: boolean;
    competingClaim?: boolean;
    disputed?: boolean;
  },
): NewBusinessVerificationDecision {
  const requiredActions = buildRequiredActions(submission);
  const ownership = summarizeOwnership(submission);
  const activationBlueprint = getNewBusinessActivationBlueprint();

  const claimantDomain = getDomainFromUrlOrEmail(submission.claimantEmail);
  const businessDomain =
    getDomainFromUrlOrEmail(submission.businessEmail) ||
    getDomainFromUrlOrEmail(submission.website);

  const hasSupportedOnly = submission.evidence.every(
    (item) => item.supported || item.purpose !== "OWNERSHIP",
  );
  const hasUnsupportedEvidence = submission.evidence.some(
    (item) => !item.supported && item.reference,
  );

  const businessLegitimacyPass =
    !!submission.businessName &&
    !!submission.category &&
    !!submission.normalizedLocation.normalized &&
    !!submission.phone &&
    !!submission.email;
  const businessLegitimacy = buildSignal(
    "BUSINESS_LEGITIMACY",
    businessLegitimacyPass ? "PASS" : "FAIL",
    businessLegitimacyPass
      ? "Business identity fields are present and normalized."
      : "Business identity data is incomplete.",
  );

  const claimantAuthorizationKnown =
    claimantDomain && businessDomain && claimantDomain === businessDomain;
  const claimantHasEvidence =
    submission.relationshipToBusiness === "AUTHORIZED_REPRESENTATIVE"
      ? submission.evidence.some((item) => item.purpose === "AUTHORITY")
      : submission.evidence.some((item) => item.purpose === "OWNERSHIP");
  const claimantAuthorizationStatus: VerificationSignalStatus =
    claimantAuthorizationKnown || claimantHasEvidence
      ? "PASS"
      : requiredActions.some(
            (item) => item.code === "MISSING_AUTHORITY_EVIDENCE",
          )
        ? "UNKNOWN"
        : "UNKNOWN";
  const claimantAuthorization = buildSignal(
    "CLAIMANT_AUTHORIZATION",
    claimantAuthorizationStatus,
    claimantAuthorizationKnown
      ? "Claimant contact aligns with the business domain."
      : claimantHasEvidence
        ? "Claimant supplied relationship evidence for review."
        : "Claimant authority is not yet established with current structured data.",
  );

  const ownershipControlStatus: VerificationSignalStatus =
    ownership.ownershipStructureConsistent &&
    ownership.qualifyingOwnerCount > 0 &&
    ownership.hasRequiredControl
      ? "PASS"
      : requiredActions.some(
            (item) =>
              item.code === "MISSING_OWNERSHIP_EVIDENCE" ||
              item.code === "MISSING_CONTROL_EVIDENCE" ||
              item.code === "MISSING_OWNERSHIP_PERCENTAGE",
          )
        ? "UNKNOWN"
        : "FAIL";
  const ownershipControl = buildSignal(
    "OWNERSHIP_CONTROL",
    ownershipControlStatus,
    ownershipControlStatus === "PASS"
      ? "Ownership percentages, evidence linkage, and control roles satisfy the BWE-native checks."
      : ownership.ownershipStructureConsistent
        ? "Ownership or control evidence is still incomplete."
        : "Ownership structure is internally inconsistent.",
  );

  const blackOwnershipStatus: VerificationSignalStatus =
    ownership.qualifyingBlackOwnershipPercentage >= 51 &&
    ownership.hasRequiredControl
      ? "PASS"
      : requiredActions.some(
            (item) => item.code === "MISSING_BLACK_ATTESTATION",
          )
        ? "UNKNOWN"
        : "FAIL";
  const blackOwnershipEligibility = buildSignal(
    "BLACK_OWNED_ELIGIBILITY",
    blackOwnershipStatus,
    blackOwnershipStatus === "PASS"
      ? "Verified qualifying Black ownership is at least 51% with required control."
      : blackOwnershipStatus === "UNKNOWN"
        ? "Black self-attestation or linked ownership evidence is still incomplete."
        : "Verified qualifying Black ownership is below the required threshold.",
  );

  const evidenceValidationStatus: VerificationSignalStatus =
    hasUnsupportedEvidence ? "UNKNOWN" : hasSupportedOnly ? "PASS" : "UNKNOWN";
  const evidenceValidation = buildSignal(
    "EVIDENCE_VALIDATION",
    evidenceValidationStatus,
    hasUnsupportedEvidence
      ? "At least one evidence item uses an unsupported or ambiguous type."
      : "Evidence metadata is structurally supported at the BWE-native layer.",
  );

  const conflictDetected =
    Boolean(options?.existingBusinessConflict) ||
    Boolean(options?.competingClaim);
  const riskConflictStatus: VerificationSignalStatus = options?.disputed
    ? "FAIL"
    : conflictDetected
      ? "FAIL"
      : "PASS";
  const riskConflict = buildSignal(
    "RISK_CONFLICT",
    riskConflictStatus,
    options?.disputed
      ? "A dispute is already attached to this business."
      : options?.competingClaim
        ? "A competing claim is already attached to this business."
        : options?.existingBusinessConflict
          ? "A matching existing BWE business already exists."
          : "No BWE-native conflict or dispute blockers were found.",
  );

  const publicListingEligibilityStatus: VerificationSignalStatus =
    businessLegitimacy.status === "PASS" &&
    claimantAuthorization.status === "PASS" &&
    ownershipControl.status === "PASS" &&
    blackOwnershipEligibility.status === "PASS" &&
    riskConflict.status === "PASS" &&
    evidenceValidation.status === "PASS"
      ? "PASS"
      : "UNKNOWN";
  const publicListingEligibility = buildSignal(
    "PUBLIC_LISTING_ELIGIBILITY",
    publicListingEligibilityStatus,
    publicListingEligibilityStatus === "PASS"
      ? "The submission is eligible for public listing once the guarded activation contract is explicitly enabled."
      : "The submission is not yet eligible for automatic public activation.",
  );

  let disposition: NewBusinessVerificationDisposition = "ADMIN_REVIEW_REQUIRED";
  let status: NewBusinessVerificationDecision["status"] =
    "admin_review_required";
  let summary =
    "Human exception review is still required for this new-business verification.";

  if (options?.disputed || options?.competingClaim) {
    disposition = options?.disputed ? "DISPUTED" : "CONFLICT_BLOCKED";
    status = options?.disputed ? "disputed" : "conflict_blocked";
    summary =
      disposition === "DISPUTED"
        ? "A dispute prevents automated verification."
        : "An existing business or competing claim blocks automated verification.";
  } else if (options?.existingBusinessConflict) {
    disposition = "CONFLICT_BLOCKED";
    status = "conflict_blocked";
    summary = "An existing BWE business blocks prospective auto-verification.";
  } else if (hasUnsupportedEvidence) {
    disposition = "ADMIN_REVIEW_REQUIRED";
    status = "admin_review_required";
    summary =
      "Unsupported or ambiguous evidence requires human exception review.";
  } else if (requiredActions.length > 0) {
    disposition = "MORE_EVIDENCE_REQUIRED";
    status = "more_evidence_required";
    summary =
      "The system can automatically request more evidence before human review is needed.";
  } else if (
    businessLegitimacy.status === "PASS" &&
    claimantAuthorization.status === "PASS" &&
    ownershipControl.status === "PASS" &&
    blackOwnershipEligibility.status === "PASS" &&
    riskConflict.status === "PASS" &&
    evidenceValidation.status === "PASS"
  ) {
    disposition = "AUTO_VERIFIED_BLACK_OWNED";
    status = "auto_verified_black_owned";
    summary =
      "This new business satisfies the deterministic Black-owned verification boundary.";
  } else if (blackOwnershipEligibility.status === "FAIL") {
    disposition = "VERIFICATION_FAILED";
    status = "verification_failed";
    summary =
      "The submission does not satisfy the Black-owned eligibility threshold.";
  }

  return {
    disposition,
    status,
    summary,
    businessLegitimacy,
    claimantAuthorization,
    ownershipControl,
    blackOwnershipEligibility,
    riskConflict,
    evidenceValidation,
    publicListingEligibility,
    qualifyingOwnership: ownership,
    requiredActions,
    activationBlueprint,
    automaticRacialInference: "NO",
  };
}

export function getCreateBusinessDuplicateError() {
  return "A business with this name appears to already exist. Please update the business name slightly or contact support if this is your listing.";
}

export function getCreateBusinessSuccessMessage() {
  return "Business submitted for automated verification.";
}

export function getCanonicalBusinessName(
  doc: Record<string, unknown> | null | undefined,
) {
  if (!doc) return "";

  const candidates = [
    doc.business_name,
    doc.businessName,
    doc.name,
    doc.companyName,
    doc.legalName,
    doc.dba,
    doc.title,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
