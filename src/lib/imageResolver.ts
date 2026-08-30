type SourceType = "business" | "category" | "bwe";

export type ResolvedImage = {
  url: string;
  sourceType: SourceType;
  categoryKey: string;
};

const APPROVED_NEUTRAL_FALLBACK = "/default-image.jpg";

function text(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function isTrustedBusinessImage(url: string) {
  const u = url.toLowerCase().trim();
  if (!u) return false;
  if (u.includes("default-image") || u.includes("house-draft")) return false;
  if (u.includes("angie") || u.includes("stone")) return false;
  if (u.includes("/uploads/")) return false;
  return true;
}

export function resolveBusinessImage(record: any): ResolvedImage {
  const existing = record?.imageFallback;
  if (existing?.url && existing?.categoryKey) {
    if (existing.categoryKey === "business") {
      return {
        url: String(existing.url),
        sourceType: "business",
        categoryKey: "business",
      };
    }

    return {
      url: APPROVED_NEUTRAL_FALLBACK,
      sourceType: "bwe",
      categoryKey: "bwe_default",
    };
  }

  const businessImage = text(record?.image) || text(record?.logo);
  if (businessImage && isTrustedBusinessImage(businessImage)) {
    return {
      url: businessImage,
      sourceType: "business",
      categoryKey: "business",
    };
  }

  return {
    url: APPROVED_NEUTRAL_FALLBACK,
    sourceType: "bwe",
    categoryKey: "bwe_default",
  };
}
