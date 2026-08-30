export type DirectoryEntityType = "business" | "organization";

export type DirectoryProfileData = {
  displayName?: string;
  shortSummary?: string;
  description?: string;
  publicEmail?: string;
  phone?: string;
  website?: string;
  streetAddress?: string;
  addressLine2?: string;
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeCityValue(args: {
  city: string;
  streetAddress: string;
  state: string;
  postalCode: string;
}) {
  let city = collapseWhitespace(args.city);
  if (!city) return "";

  const streetAddress = collapseWhitespace(args.streetAddress);
  const state = collapseWhitespace(args.state);
  const postalCode = collapseWhitespace(args.postalCode);

  const streetNumber = streetAddress.match(/^\d+\b/)?.[0] || "";
  if (streetNumber) {
    city = city.replace(
      new RegExp(`^${escapeRegex(streetNumber)}\\s+`, "i"),
      "",
    );
  }
  if (streetAddress) {
    city = city.replace(new RegExp(escapeRegex(streetAddress), "ig"), "");
  }
  if (state) {
    city = city.replace(new RegExp(`\\b${escapeRegex(state)}\\b`, "ig"), "");
  }
  if (postalCode) {
    city = city.replace(
      new RegExp(`\\b${escapeRegex(postalCode)}\\b`, "ig"),
      "",
    );
  }

  return collapseWhitespace(city.replace(/^[,\-]+|[,\-]+$/g, ""));
}

function hasOwn(value: unknown, key: string) {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function pickProvided(body: any, keys: string[]) {
  for (const key of keys) {
    if (hasOwn(body, key)) {
      return { present: true, value: body[key] };
    }
  }
  return { present: false, value: undefined };
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
  const displayName = pickProvided(body, [
    "displayName",
    "businessName",
    "name",
  ]);
  const shortSummary = pickProvided(body, ["shortSummary", "summary"]);
  const description = pickProvided(body, ["description"]);
  const publicEmail = pickProvided(body, ["publicEmail", "email"]);
  const phone = pickProvided(body, ["phone", "businessPhone"]);
  const website = pickProvided(body, ["website"]);
  const streetAddress = pickProvided(body, [
    "streetAddress",
    "businessAddress",
    "address",
  ]);
  const addressLine2 = pickProvided(body, ["addressLine2", "suite", "unit"]);
  const city = pickProvided(body, ["city"]);
  const state = pickProvided(body, ["state"]);
  const postalCode = pickProvided(body, ["postalCode", "zip", "zipCode"]);
  const serviceArea = pickProvided(body, ["serviceArea"]);
  const primaryCategory = pickProvided(body, ["primaryCategory", "category"]);
  const secondaryCategories = pickProvided(body, [
    "secondaryCategories",
    "categories",
  ]);
  const logo = pickProvided(body, ["logo"]);
  const coverImage = pickProvided(body, ["coverImage", "image"]);
  const galleryImages = pickProvided(body, ["galleryImages", "images"]);
  const facebook = pickProvided(body, ["facebook"]);
  const instagram = pickProvided(body, ["instagram"]);
  const linkedin = pickProvided(body, ["linkedin"]);
  const twitter = pickProvided(body, ["twitter"]);
  const youtube = pickProvided(body, ["youtube"]);
  const tiktok = pickProvided(body, ["tiktok"]);
  const operatingHours = pickProvided(body, ["operatingHours", "hours"]);
  const tags = pickProvided(body, ["tags", "specialties", "keywords"]);
  const offeringsSummary = pickProvided(body, [
    "offeringsSummary",
    "productsServicesSummary",
    "productsServices",
    "programsSummary",
  ]);
  const primaryCtaLabel = pickProvided(body, ["primaryCtaLabel"]);
  const primaryCtaUrl = pickProvided(body, ["primaryCtaUrl"]);
  const additionalCtas = pickProvided(body, ["additionalCtas"]);

  return {
    displayName: displayName.present ? s(displayName.value) : undefined,
    shortSummary: shortSummary.present ? s(shortSummary.value) : undefined,
    description: description.present ? s(description.value) : undefined,
    publicEmail: publicEmail.present
      ? s(publicEmail.value).toLowerCase()
      : undefined,
    phone: phone.present ? s(phone.value) : undefined,
    website: website.present ? asOptionalUrl(website.value) : undefined,
    streetAddress: streetAddress.present ? s(streetAddress.value) : undefined,
    addressLine2: addressLine2.present ? s(addressLine2.value) : undefined,
    city: city.present ? s(city.value) : undefined,
    state: state.present ? s(state.value).toUpperCase() : undefined,
    postalCode: postalCode.present ? s(postalCode.value) : undefined,
    serviceArea: serviceArea.present ? s(serviceArea.value) : undefined,
    primaryCategory: primaryCategory.present
      ? s(primaryCategory.value)
      : undefined,
    secondaryCategories: secondaryCategories.present
      ? asArray(secondaryCategories.value)
      : undefined,
    logo: logo.present
      ? logo.value === null
        ? null
        : s(logo.value)
      : undefined,
    coverImage: coverImage.present
      ? coverImage.value === null
        ? null
        : s(coverImage.value)
      : undefined,
    galleryImages: galleryImages.present
      ? asArray(galleryImages.value)
      : undefined,
    facebook: facebook.present ? asOptionalUrl(facebook.value) : undefined,
    instagram: instagram.present ? asOptionalUrl(instagram.value) : undefined,
    linkedin: linkedin.present ? asOptionalUrl(linkedin.value) : undefined,
    twitter: twitter.present ? asOptionalUrl(twitter.value) : undefined,
    youtube: youtube.present ? asOptionalUrl(youtube.value) : undefined,
    tiktok: tiktok.present ? asOptionalUrl(tiktok.value) : undefined,
    operatingHours: operatingHours.present
      ? s(operatingHours.value)
      : undefined,
    tags: tags.present ? asArray(tags.value) : undefined,
    offeringsSummary: offeringsSummary.present
      ? s(offeringsSummary.value)
      : undefined,
    primaryCtaLabel: primaryCtaLabel.present
      ? s(primaryCtaLabel.value)
      : undefined,
    primaryCtaUrl: primaryCtaUrl.present
      ? asOptionalUrl(primaryCtaUrl.value)
      : undefined,
    additionalCtas: additionalCtas.present
      ? asCtas(additionalCtas.value)
      : undefined,
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
  mapString("addressLine2", input.addressLine2, ["suite", "unit"]);
  mapString("city", input.city);
  mapString("state", input.state);
  mapString("zip", input.postalCode, ["postalCode", "zipCode"]);
  mapString("serviceArea", input.serviceArea);
  mapString("category", input.primaryCategory, [
    "primaryCategory",
    "display_categories",
  ]);
  if (input.coverImage !== undefined) {
    mapString("image", input.coverImage || "", ["coverImage"]);
  }
  if (input.logo !== undefined) {
    mapString("logo", input.logo || "");
  }
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
    addressLine2: s(doc?.addressLine2 || doc?.suite || doc?.unit),
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

export function normalizeDirectoryLocationParts(doc: any) {
  const profile = mapDirectoryProfileFromDoc(doc);
  const streetAddress = s(
    profile.streetAddress ||
      doc?.addressLine1 ||
      doc?.streetAddress ||
      doc?.businessAddress ||
      doc?.address,
  );
  const addressLine2 = s(
    profile.addressLine2 || doc?.addressLine2 || doc?.suite || doc?.unit,
  );
  const state = s(
    profile.state || doc?.address?.state || doc?.state,
  ).toUpperCase();
  const postalCode = s(
    profile.postalCode ||
      doc?.postalCode ||
      doc?.zip ||
      doc?.zipCode ||
      doc?.address?.postalCode,
  );
  const rawCity = s(profile.city || doc?.address?.city || doc?.city);
  const city = sanitizeCityValue({
    city: rawCity,
    streetAddress,
    state,
    postalCode,
  });
  const locality = [city, state].filter(Boolean).join(", ");
  const localityWithPostal = [locality, postalCode]
    .filter(Boolean)
    .join(locality && postalCode ? " " : "");
  const fullAddress = [streetAddress, addressLine2, localityWithPostal]
    .filter(Boolean)
    .join(", ");

  return {
    streetAddress,
    addressLine2,
    city,
    state,
    postalCode,
    locality,
    localityWithPostal,
    fullAddress,
  };
}
