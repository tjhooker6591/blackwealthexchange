export type DirectoryCategoryAliasMap = Record<string, string[]>;

function uniq(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function normalizePhrase(value: string) {
  return value.toLowerCase().trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

export const DIRECTORY_CATEGORY_ALIASES: DirectoryCategoryAliasMap = {
  restaurant: uniq([
    "restaurant",
    "restaurants",
    "cafe",
    "cafes",
    "eatery",
    "eateries",
    "dining",
    "food",
  ]),
  "real estate": uniq([
    "real estate",
    "real-estate",
    "realty",
    "realtor",
    "realtors",
    "real estate agent",
    "real estate agents",
    "real estate service",
    "real estate services",
    "property management",
    "broker",
    "brokers",
  ]),
  "legal services": uniq([
    "legal services",
    "legal service",
    "legal",
    "law",
    "lawyer",
    "lawyers",
    "attorney",
    "attorneys",
    "law firm",
    "law firms",
  ]),
  "financial services": uniq([
    "financial services",
    "financial service",
    "finance",
    "financial",
    "accounting",
    "accountant",
    "accountants",
    "bookkeeping",
    "tax",
    "taxes",
    "tax preparation",
    "cpa",
    "cpas",
    "banking",
    "insurance",
    "investment",
    "investments",
  ]),
  beauty: uniq([
    "beauty",
    "beauty salon",
    "beauty salons",
    "salon",
    "salons",
    "spa",
    "spas",
    "barber",
    "barbers",
    "barbershop",
    "barbershops",
    "hair",
    "hair salon",
    "hair salons",
    "cosmetics",
    "makeup",
    "skincare",
  ]),
  nonprofit: uniq([
    "nonprofit",
    "nonprofits",
    "non-profit",
    "non profit",
    "charity",
    "charities",
    "foundation",
    "foundations",
  ]),
};

export function expandDirectoryCategoryAliases(input: string): string[] {
  const normalized = normalizePhrase(input);
  if (!normalized || normalized === "all") return [];

  const singular = normalized.endsWith("s")
    ? normalized.slice(0, -1)
    : normalized;
  const baseValues = uniq([
    normalized,
    singular,
    normalized.replace(/\s+/g, "-"),
    singular.replace(/\s+/g, "-"),
  ]);

  const matchedAliases = Object.entries(DIRECTORY_CATEGORY_ALIASES)
    .filter(([canonical, aliases]) => {
      const all = [canonical, ...aliases].map(normalizePhrase);
      return all.includes(normalized) || all.includes(singular);
    })
    .flatMap(([canonical, aliases]) => [canonical, ...aliases]);

  return uniq([
    ...baseValues,
    ...matchedAliases,
    ...matchedAliases.map((v) => normalizePhrase(v)),
    ...matchedAliases.map((v) => normalizePhrase(v).replace(/\s+/g, "-")),
  ]);
}
