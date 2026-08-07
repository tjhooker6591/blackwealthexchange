export function buildPublicMarketplaceVisibilityFilter(now = new Date()) {
  return {
    status: "active",
    isPublished: { $ne: false },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  };
}

export function hasPublicMarketplaceVisibility(
  doc: Record<string, any> | null | undefined,
  now = new Date(),
) {
  if (!doc || typeof doc !== "object") return false;

  if (String(doc.status || "").trim().toLowerCase() !== "active") return false;
  if (doc.isPublished === false) return false;

  const expiresAt = doc.expiresAt ? new Date(doc.expiresAt) : null;
  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt <= now) {
    return false;
  }

  return true;
}

export function getPublicMarketplaceSellerName(
  seller: Record<string, any> | null | undefined,
) {
  const name = [
    seller?.storeName,
    seller?.businessName,
    seller?.ownerName,
    seller?.name,
  ].find((value) => typeof value === "string" && value.trim());

  return typeof name === "string" ? name.trim() : null;
}

export function isPublicMarketplaceSellerProfileComplete(
  seller: Record<string, any> | null | undefined,
) {
  return Boolean(
    String(seller?.businessName || "").trim() &&
      String(seller?.email || "").trim() &&
      String(seller?.description || "").trim(),
  );
}
