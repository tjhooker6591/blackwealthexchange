const MARKETPLACE_TEST_NAME_PATTERN =
  /^(qa branch product\b|qa product\b|test product\b|placeholder product\b|sample product\b)/i;
const MARKETPLACE_TEST_SLUG_PATTERN =
  /(?:^|[-_])(qa|test|placeholder|sample)(?:[-_]|$)/i;

export function isMarketplaceTestProduct(
  doc: Record<string, any> | null | undefined,
) {
  if (!doc || typeof doc !== "object") return false;

  if (doc.isTest === true) return true;

  const auditTag = String(doc.auditTag || "")
    .trim()
    .toLowerCase();
  if (auditTag === "qa" || auditTag === "test" || auditTag === "placeholder") {
    return true;
  }

  const name = String(doc.name || doc.title || "").trim();
  const slug = String(doc.slug || "").trim();

  return (
    MARKETPLACE_TEST_NAME_PATTERN.test(name) ||
    MARKETPLACE_TEST_SLUG_PATTERN.test(slug)
  );
}

export function buildPublicMarketplaceVisibilityFilter(_now = new Date()) {
  return {
    status: "active",
    isPublished: { $ne: false },
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    $nor: [
      { name: { $regex: MARKETPLACE_TEST_NAME_PATTERN } },
      { title: { $regex: MARKETPLACE_TEST_NAME_PATTERN } },
      { slug: { $regex: MARKETPLACE_TEST_SLUG_PATTERN } },
      { auditTag: { $in: ["qa", "QA", "test", "TEST", "placeholder"] } },
      { isTest: true },
    ],
  };
}

export function hasPublicMarketplaceVisibility(
  doc: Record<string, any> | null | undefined,
  _now = new Date(),
) {
  if (!doc || typeof doc !== "object") return false;

  if (
    String(doc.status || "")
      .trim()
      .toLowerCase() !== "active"
  )
    return false;
  if (doc.isPublished === false) return false;
  if (doc.deletedAt) return false;
  if (isMarketplaceTestProduct(doc)) return false;

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
