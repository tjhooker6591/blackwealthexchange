type AnyDoc = Record<string, any>;

function asTrimmed(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function hasValue(v: unknown): boolean {
  if (Array.isArray(v)) return v.some((x) => asTrimmed(x).length > 0);
  return asTrimmed(v).length > 0;
}

function getAliasCategory(doc: AnyDoc): string {
  if (hasValue(doc.display_categories)) return asTrimmed(doc.display_categories);
  if (Array.isArray(doc.categories)) return doc.categories.map((x: any) => asTrimmed(x)).filter(Boolean).join(", ");
  if (hasValue(doc.categories)) return asTrimmed(doc.categories);
  if (hasValue(doc.category)) return asTrimmed(doc.category);
  if (hasValue(doc.orgType)) return asTrimmed(doc.orgType);
  return "";
}

export type CompletenessResult = {
  missingFields: string[];
  completenessScore: number;
  isComplete: boolean;
};

export function computeListingCompleteness(doc: AnyDoc): CompletenessResult {
  const checks: Array<[string, boolean]> = [
    ["name", hasValue(doc.business_name) || hasValue(doc.name) || hasValue(doc.organization_name)],
    ["description", hasValue(doc.description)],
    ["address", hasValue(doc.address)],
    ["city", hasValue(doc.city)],
    ["state", hasValue(doc.state)],
    ["phone", hasValue(doc.phone)],
    ["category", hasValue(getAliasCategory(doc))],
    ["website", hasValue(doc.website)],
    ["image", hasValue(doc.image)],
  ];

  const total = checks.length;
  const present = checks.filter(([, ok]) => ok).length;
  const missingFields = checks.filter(([, ok]) => !ok).map(([k]) => k);
  const completenessScore = Math.round((present / total) * 100);
  const isComplete = present >= 7; // practical threshold for public listing quality

  return { missingFields, completenessScore, isComplete };
}
