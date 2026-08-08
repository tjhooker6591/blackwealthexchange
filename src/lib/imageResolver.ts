type SourceType = "business" | "category" | "bwe";

export type ResolvedImage = {
  url: string;
  sourceType: SourceType;
  categoryKey: string;
};

const BWE_DEFAULT = "/images/fallback/bwe-default.jpg";

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
    if (existing.categoryKey !== "business" && existing.categoryKey !== "bwe_default") {
      return { url: BWE_DEFAULT, sourceType: "bwe", categoryKey: "bwe_default" };
    }

    return {
      url: String(existing.url),
      sourceType:
        existing.categoryKey === "business"
          ? "business"
          : existing.categoryKey === "bwe_default"
            ? "bwe"
            : "category",
      categoryKey: String(existing.categoryKey),
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

  return { url: BWE_DEFAULT, sourceType: "bwe", categoryKey: "bwe_default" };
}
