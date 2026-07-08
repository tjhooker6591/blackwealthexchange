export type FoundingOwnershipCanonicalState =
  | "claim_initiated"
  | "ownership_verification_pending"
  | "additional_evidence_required"
  | "ownership_verified"
  | "ownership_verification_failed"
  | "disputed"
  | null;

export function normalizeFoundingClaimStage(value: unknown): string | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized === "claim_pending") return "claim_initiated";
  if (normalized === "pending_review") return "ownership_verification_pending";
  if (normalized === "ownership_review_pending")
    return "ownership_verification_pending";
  if (normalized === "verification_pending")
    return "ownership_verification_pending";
  if (normalized === "approved") return "ownership_verified";
  if (normalized === "ownership_approved") return "ownership_verified";
  if (normalized === "rejected") return "ownership_verification_failed";
  if (normalized === "ownership_rejected")
    return "ownership_verification_failed";
  return normalized;
}

export function resolveFoundingOwnershipState(args: {
  business?: Record<string, any> | null;
  claim?: Record<string, any> | null;
  review?: Record<string, any> | null;
  membership?: Record<string, any> | null;
  publicListingStatus?: unknown;
  claimStage?: unknown;
  claimStatus?: unknown;
  ownershipReviewStatus?: unknown;
}) {
  const statuses = [
    normalizeFoundingClaimStage(args.publicListingStatus),
    normalizeFoundingClaimStage(args.business?.publicListingStatus),
    normalizeFoundingClaimStage(args.claimStage),
    normalizeFoundingClaimStage(args.business?.claimStage),
    normalizeFoundingClaimStage(args.claimStatus),
    normalizeFoundingClaimStage(args.claim?.claimStatus),
    normalizeFoundingClaimStage(args.ownershipReviewStatus),
    normalizeFoundingClaimStage(args.review?.reviewStatus),
    normalizeFoundingClaimStage(args.business?.ownershipReviewStatus),
    normalizeFoundingClaimStage(args.claim?.ownershipReviewStatus),
    normalizeFoundingClaimStage(args.membership?.ownershipReviewStatus),
  ].filter(Boolean) as string[];

  const canonicalState: FoundingOwnershipCanonicalState = statuses.includes(
    "ownership_verified",
  )
    ? "ownership_verified"
    : statuses.includes("ownership_verification_failed")
      ? "ownership_verification_failed"
      : statuses.includes("disputed")
        ? "disputed"
        : statuses.includes("additional_evidence_required")
          ? "additional_evidence_required"
          : statuses.includes("ownership_verification_pending") ||
              statuses.includes("claim_initiated")
            ? "ownership_verification_pending"
            : null;

  const publicListingStatus =
    canonicalState === "ownership_verified"
      ? "ownership_verified"
      : canonicalState === "ownership_verification_failed"
        ? "unclaimed"
        : canonicalState === "disputed" ||
            canonicalState === "additional_evidence_required" ||
            canonicalState === "ownership_verification_pending"
          ? "verification_pending"
          : "unclaimed";

  return {
    canonicalState,
    publicListingStatus,
    isOwnershipVerified: canonicalState === "ownership_verified",
  } as const;
}
