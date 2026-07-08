export type PublicVisibilityDoc = Record<string, any>;

function safeText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function hasPublicBusinessRoute(doc: PublicVisibilityDoc): boolean {
  return Boolean(safeText(doc?.alias) || safeText(doc?.slug));
}

export function isApprovedActiveBusiness(doc: PublicVisibilityDoc): boolean {
  const status = safeText(doc?.status).toLowerCase();
  const approved = doc?.approved === true;
  return approved && status === "active";
}

export function isDirectoryVisibilityApproved(
  doc: PublicVisibilityDoc,
): boolean {
  return doc?.directoryVisibilityApproved === true;
}

export function isPublicBusinessVisible(doc: PublicVisibilityDoc): boolean {
  if (!isApprovedActiveBusiness(doc)) return false;
  if (!hasPublicBusinessRoute(doc)) return false;
  return (
    doc?.isComplete === true ||
    Number(doc?.completenessScore || 0) >= 70 ||
    Number(doc?.qualityScore || 0) >= 70 ||
    isDirectoryVisibilityApproved(doc)
  );
}
