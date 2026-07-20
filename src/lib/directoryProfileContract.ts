export type DirectoryEntityType = "business" | "organization";

export type DirectoryProfileData = {
  displayName?: string;
  shortSummary?: string;
  description?: string;
  publicEmail?: string;
  phone?: string;
  website?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  serviceArea?: string;
  primaryCategory?: string;
  secondaryCategories?: string[];
  logo?: string | null;
  coverImage?: string | null;
  galleryImages?: string[];
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  operatingHours?: string;
  tags?: string[];
  offeringsSummary?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  additionalCtas?: Array<{ label: string; url: string }>;
};

function s(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalUrl(value: unknown) {
  const raw = s(value);
  if (!raw) return "";
  if (/^(https?:\/\/|\/)/i.test(raw)) return raw;
  return `https://${raw}`;
}

function asArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => s(entry)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

function asCtas(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ label: string; url: string }>;
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const label = s((entry as any).label);
      const url = asOptionalUrl((entry as any).url);
      if (!label || !url) return null;
      return { label, url };
    })
    .filter(Boolean) as Array<{ label: string; url: string }>;
}

export function normalizeDirectoryProfileInput(
  body: any,
): DirectoryProfileData {
  return {
    displayName:
      s(body?.displayName || body?.businessName || body?.name) || undefined,
    shortSummary: s(body?.shortSummary || body?.summary) || undefined,
    description: s(body?.description) || undefined,
    publicEmail: s(body?.publicEmail || body?.email).toLowerCase() || undefined,
    phone: s(body?.phone || body?.businessPhone) || undefined,
    website: asOptionalUrl(body?.website) || undefined,
    streetAddress:
      s(body?.streetAddress || body?.businessAddress || body?.address) ||
      undefined,
    city: s(body?.city) || undefined,
    state: s(body?.state).toUpperCase() || undefined,
    postalCode: s(body?.postalCode || body?.zip || body?.zipCode) || undefined,
    serviceArea: s(body?.serviceArea) || undefined,
    primaryCategory: s(body?.primaryCategory || body?.category) || undefined,
    secondaryCategories: asArray(body?.secondaryCategories || body?.categories),
    logo: body?.logo === null ? null : s(body?.logo) || undefined,
    coverImage:
      body?.coverImage === null
        ? null
        : s(body?.coverImage || body?.image) || undefined,
    galleryImages: asArray(body?.galleryImages || body?.images),
    facebook: asOptionalUrl(body?.facebook) || undefined,
    instagram: asOptionalUrl(body?.instagram) || undefined,
    linkedin: asOptionalUrl(body?.linkedin) || undefined,
    twitter: asOptionalUrl(body?.twitter) || undefined,
    youtube: asOptionalUrl(body?.youtube) || undefined,
    tiktok: asOptionalUrl(body?.tiktok) || undefined,
    operatingHours: s(body?.operatingHours || body?.hours) || undefined,
    tags: asArray(body?.tags || body?.specialties || body?.keywords),
    offeringsSummary:
      s(
        body?.offeringsSummary ||
          body?.productsServicesSummary ||
          body?.productsServices ||
          body?.programsSummary,
      ) || undefined,
    primaryCtaLabel: s(body?.primaryCtaLabel) || undefined,
    primaryCtaUrl: asOptionalUrl(body?.primaryCtaUrl) || undefined,
    additionalCtas: asCtas(body?.additionalCtas),
  };
}

export function buildDirectoryProfileUpdate(input: DirectoryProfileData) {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  const $unset: Record<string, ""> = {};

  const mapString = (
    key: string,
    value: string | undefined,
    aliases: string[] = [],
  ) => {
    if (value === undefined) return;
    if (value) {
      $set[key] = value;
      for (const alias of aliases) $set[alias] = value;
    } else {
      $unset[key] = "";
      for (const alias of aliases) $unset[alias] = "";
    }
  };

  mapString("businessName", input.displayName, [
    "business_name",
    "title",
    "name",
  ]);
  mapString("shortSummary", input.shortSummary, ["summary"]);
  mapString("description", input.description);
  mapString("email", input.publicEmail, ["publicEmail"]);
  mapString("phone", input.phone, ["businessPhone"]);
  mapString("website", input.website);
  mapString("address", input.streetAddress, [
    "businessAddress",
    "streetAddress",
  ]);
  mapString("city", input.city);
  mapString("state", input.state);
  mapString("zip", input.postalCode, ["postalCode", "zipCode"]);
  mapString("serviceArea", input.serviceArea);
  mapString("category", input.primaryCategory, [
    "primaryCategory",
    "display_categories",
  ]);
  mapString("image", input.coverImage ?? undefined, ["coverImage"]);
  mapString("logo", input.logo ?? undefined);
  mapString("operatingHours", input.operatingHours, ["hours"]);
  mapString("offeringsSummary", input.offeringsSummary, [
    "productsServicesSummary",
    "programsSummary",
  ]);
  mapString("primaryCtaLabel", input.primaryCtaLabel);
  mapString("primaryCtaUrl", input.primaryCtaUrl);

  if (input.secondaryCategories !== undefined) {
    if (input.secondaryCategories.length) {
      $set.categories = input.secondaryCategories;
      $set.secondaryCategories = input.secondaryCategories;
    } else {
      $unset.categories = "";
      $unset.secondaryCategories = "";
    }
  }

  if (input.galleryImages !== undefined) {
    if (input.galleryImages.length) {
      $set.images = input.galleryImages;
      $set.galleryImages = input.galleryImages;
    } else {
      $unset.images = "";
      $unset.galleryImages = "";
    }
  }

  if (input.tags !== undefined) {
    if (input.tags.length) {
      $set.tags = input.tags;
      $set.specialties = input.tags;
      $set.keywords = input.tags;
    } else {
      $unset.tags = "";
      $unset.specialties = "";
      $unset.keywords = "";
    }
  }

  if (input.additionalCtas !== undefined) {
    if (input.additionalCtas.length) $set.additionalCtas = input.additionalCtas;
    else $unset.additionalCtas = "";
  }

  const socialFields: Array<[keyof DirectoryProfileData, string]> = [
    ["facebook", "social.facebook"],
    ["instagram", "social.instagram"],
    ["linkedin", "social.linkedin"],
    ["twitter", "social.twitter"],
    ["youtube", "social.youtube"],
    ["tiktok", "social.tiktok"],
  ];

  for (const [inputKey, docKey] of socialFields) {
    const value = input[inputKey] as string | undefined;
    if (value === undefined) continue;
    if (value) $set[docKey] = value;
    else $unset[docKey] = "";
  }

  const update: Record<string, unknown> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  return update;
}

export function mapDirectoryProfileFromDoc(doc: any) {
  const social =
    doc?.social && typeof doc.social === "object" ? doc.social : {};
  const categories = Array.isArray(doc?.secondaryCategories)
    ? doc.secondaryCategories
    : Array.isArray(doc?.categories)
      ? doc.categories
      : typeof doc?.categories === "string"
        ? doc.categories
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        : [];
  const gallery = Array.isArray(doc?.galleryImages)
    ? doc.galleryImages
    : Array.isArray(doc?.images)
      ? doc.images
          .map((item: any) =>
            typeof item === "string" ? s(item) : s(item?.url || item?.src),
          )
          .filter(Boolean)
      : [];

  return {
    id: String(doc?._id || ""),
    displayName: s(
      doc?.businessName || doc?.business_name || doc?.name || doc?.title,
    ),
    shortSummary: s(doc?.shortSummary || doc?.summary),
    description: s(doc?.description),
    publicEmail: s(doc?.email || doc?.publicEmail),
    phone: s(doc?.phone || doc?.businessPhone),
    website: asOptionalUrl(doc?.website) || undefined,
    streetAddress: s(
      doc?.streetAddress || doc?.businessAddress || doc?.address,
    ),
    city: s(doc?.city),
    state: s(doc?.state),
    postalCode: s(doc?.postalCode || doc?.zip || doc?.zipCode),
    serviceArea: s(doc?.serviceArea),
    primaryCategory: s(
      doc?.primaryCategory || doc?.category || doc?.display_categories,
    ),
    secondaryCategories: categories,
    logo: s(doc?.logo),
    coverImage: s(doc?.coverImage || doc?.image),
    galleryImages: gallery,
    facebook: asOptionalUrl(social.facebook || doc?.facebook) || undefined,
    instagram: asOptionalUrl(social.instagram || doc?.instagram) || undefined,
    linkedin: asOptionalUrl(social.linkedin || doc?.linkedin) || undefined,
    twitter: asOptionalUrl(social.twitter || doc?.twitter) || undefined,
    youtube: asOptionalUrl(social.youtube || doc?.youtube) || undefined,
    tiktok: asOptionalUrl(social.tiktok || doc?.tiktok) || undefined,
    operatingHours: s(doc?.operatingHours || doc?.hours),
    tags: Array.isArray(doc?.tags)
      ? doc.tags.map((item: any) => s(item)).filter(Boolean)
      : Array.isArray(doc?.specialties)
        ? doc.specialties.map((item: any) => s(item)).filter(Boolean)
        : Array.isArray(doc?.keywords)
          ? doc.keywords.map((item: any) => s(item)).filter(Boolean)
          : [],
    offeringsSummary: s(
      doc?.offeringsSummary ||
        doc?.productsServicesSummary ||
        doc?.productsServices ||
        doc?.programsSummary,
    ),
    primaryCtaLabel: s(doc?.primaryCtaLabel),
    primaryCtaUrl: asOptionalUrl(doc?.primaryCtaUrl) || undefined,
    additionalCtas: asCtas(doc?.additionalCtas),
  };
}
