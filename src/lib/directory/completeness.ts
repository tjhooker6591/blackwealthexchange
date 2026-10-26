import type { Collection, Filter } from "mongodb";

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
  if (hasValue(doc.display_categories))
    return asTrimmed(doc.display_categories);
  if (Array.isArray(doc.categories))
    return doc.categories
      .map((x: any) => asTrimmed(x))
      .filter(Boolean)
      .join(", ");
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

export type ListingChecklistItem = {
  key: string;
  label: string;
  value: string;
  done: boolean;
};

function firstValue(...values: unknown[]): string {
  for (const v of values) {
    if (Array.isArray(v)) {
      const joined = v
        .map((x) => asTrimmed(x))
        .filter(Boolean)
        .join(", ");
      if (joined) return joined;
    } else if (hasValue(v)) {
      return asTrimmed(v);
    }
  }
  return "";
}

// The details public search counts, with what the listing has for each.
export function listingChecklist(doc: AnyDoc): ListingChecklistItem[] {
  const items: Array<[string, string, string]> = [
    [
      "name",
      "Business name",
      firstValue(
        doc.business_name,
        doc.businessName,
        doc.title,
        doc.name,
        doc.organization_name,
      ),
    ],
    ["description", "Description", firstValue(doc.description)],
    // Signup writes businessAddress/businessPhone and the add-listing form
    // writes addressLine1, so those count as the same information.
    [
      "address",
      "Street address",
      firstValue(doc.address, doc.addressLine1, doc.businessAddress),
    ],
    ["city", "City", firstValue(doc.city)],
    ["state", "State", firstValue(doc.state)],
    ["phone", "Phone", firstValue(doc.phone, doc.businessPhone)],
    ["category", "Category", getAliasCategory(doc)],
    ["website", "Website", firstValue(doc.website)],
    ["image", "Logo or photo", firstValue(doc.image, doc.logo, doc.coverImage)],
  ];
  return items.map(([key, label, value]) => ({
    key,
    label,
    value,
    done: value.length > 0,
  }));
}

export function computeListingCompleteness(doc: AnyDoc): CompletenessResult {
  const checks = listingChecklist(doc);
  const total = checks.length;
  const present = checks.filter((c) => c.done).length;
  const missingFields = checks.filter((c) => !c.done).map((c) => c.key);
  const completenessScore = Math.round((present / total) * 100);
  const isComplete = present >= 7; // practical threshold for public listing quality

  return { missingFields, completenessScore, isComplete };
}

// Public search only shows listings that carry these fields (see
// publicBusinessBaseQuery), so they must be re-stamped whenever a listing is
// approved or its profile changes -- otherwise it stays invisible in search.
export async function stampListingCompleteness(
  businesses: Collection<any>,
  filter: Filter<any>,
): Promise<CompletenessResult | null> {
  const doc = await businesses.findOne(filter);
  if (!doc) return null;
  const next = computeListingCompleteness(doc);
  await businesses.updateOne(
    { _id: doc._id },
    {
      $set: {
        completenessScore: next.completenessScore,
        missingFields: next.missingFields,
        isComplete: next.isComplete,
      },
    },
  );
  return next;
}
