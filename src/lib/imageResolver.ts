type SourceType = "business" | "category" | "bwe";

export type ResolvedImage = {
  url: string;
  sourceType: SourceType;
  categoryKey: string;
};

const CATEGORY_FALLBACKS: Array<{ key: string; terms: string[]; url: string }> =
  [
    {
      key: "food",
      terms: ["restaurant", "cafe", "bakery", "food"],
      url: "/images/fallback/food.jpg",
    },
    {
      key: "barber_beauty",
      terms: ["barber", "beauty", "salon", "groom"],
      url: "/images/fallback/barber.jpg",
    },
    {
      key: "real_estate",
      terms: ["real estate", "realtor", "property", "housing"],
      url: "/images/fallback/realestate.jpg",
    },
    {
      key: "community",
      terms: ["nonprofit", "church", "community", "charity"],
      url: "/images/fallback/community.jpg",
    },
    {
      key: "retail",
      terms: ["retail", "clothing", "fashion", "store", "shop"],
      url: "/images/fallback/retail.jpg",
    },
    {
      key: "finance",
      terms: ["finance", "tax", "accounting", "bank"],
      url: "/images/fallback/finance.jpg",
    },
    {
      key: "health",
      terms: ["health", "medical", "wellness", "dental", "spa"],
      url: "/images/fallback/health.jpg",
    },
    {
      key: "professional",
      terms: ["legal", "consulting", "professional", "services"],
      url: "/images/fallback/professional.jpg",
    },
    {
      key: "technology",
      terms: ["technology", "software", "tech"],
      url: "/images/fallback/technology.jpg",
    },
  ];

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

function getCategoryText(record: any) {
  return [
    record?.category,
    record?.categories,
    record?.display_categories,
    record?.primaryCategory,
    record?.orgType,
    record?.title,
  ]
    .map(text)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function resolveBusinessImage(record: any): ResolvedImage {
  const existing = record?.imageFallback;
  if (existing?.url && existing?.categoryKey) {
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

  const categoryText = getCategoryText(record);
  const matched = CATEGORY_FALLBACKS.find((entry) =>
    entry.terms.some((term) => categoryText.includes(term)),
  );
  if (matched) {
    return {
      url: matched.url,
      sourceType: "category",
      categoryKey: matched.key,
    };
  }

  return { url: BWE_DEFAULT, sourceType: "bwe", categoryKey: "bwe_default" };
}
