function s(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return s(entry);
      if (entry && typeof entry === "object") {
        return s(
          (entry as any).url || (entry as any).src || (entry as any).image,
        );
      }
      return "";
    })
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function looksLikePostal(value: string) {
  return /\b\d{5}(?:-\d{4})?\b/.test(value);
}

function looksLikeStreet(value: string) {
  return /^\d+[A-Za-z0-9-]*\s+/.test(value.trim());
}

function normalizeLegacyAddressLine(value: string) {
  return s(value).replace(/\s+/g, " ").trim();
}

function parseLegacyCombinedAddress(value: string) {
  const normalized = normalizeLegacyAddressLine(value);
  if (!normalized) {
    return {
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
    };
  }

  const match = normalized.match(
    /^(\d+\s+.+)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+([A-Za-z]{2,})\s+(\d{5}(?:-\d{4})?)$/i,
  );

  if (!match) {
    return {
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
    };
  }

  const [, street = "", city = "", state = "", postal = ""] = match;

  return {
    streetAddress: normalizeLegacyAddressLine(street),
    city: normalizeLegacyAddressLine(city),
    state: s(state),
    postalCode: s(postal),
  };
}

export function getCanonicalBusinessAddressParts(source: any) {
  const rawAddress = normalizeLegacyAddressLine(
    source?.streetAddress ||
      source?.businessAddress ||
      source?.addressLine1 ||
      source?.address,
  );
  const rawCity = normalizeLegacyAddressLine(source?.city);
  const rawState = s(source?.state);
  const rawPostalCode = s(source?.postalCode || source?.zip || source?.zipCode);
  const addressLine2 = s(source?.addressLine2 || source?.suite || source?.unit);

  const cityLooksLikeFullAddress =
    looksLikeStreet(rawCity) && looksLikePostal(rawCity);
  const addressLooksLikeFullAddress =
    looksLikeStreet(rawAddress) && looksLikePostal(rawAddress);
  const parsedLegacy = cityLooksLikeFullAddress
    ? parseLegacyCombinedAddress(rawCity)
    : addressLooksLikeFullAddress
      ? parseLegacyCombinedAddress(rawAddress)
      : null;

  const streetAddress =
    rawAddress ||
    parsedLegacy?.streetAddress ||
    (cityLooksLikeFullAddress ? rawCity : "");
  const city =
    parsedLegacy?.city ||
    (cityLooksLikeFullAddress || addressLooksLikeFullAddress ? "" : rawCity);
  const state = rawState || parsedLegacy?.state || "";
  const postalCode = rawPostalCode || parsedLegacy?.postalCode || "";

  return {
    streetAddress,
    addressLine2,
    city,
    state,
    postalCode,
  };
}

export function buildBusinessDirectionsQuery(source: any) {
  const { streetAddress, addressLine2, city, state, postalCode } =
    getCanonicalBusinessAddressParts(source);

  const normalizedStreet = normalizeLegacyAddressLine(streetAddress);
  const normalizedAddressLine2 = s(addressLine2);
  const normalizedCity = s(city);
  const normalizedState = s(state);
  const normalizedPostal = s(postalCode);

  if (looksLikeStreet(normalizedStreet) && looksLikePostal(normalizedStreet)) {
    return [normalizedStreet, normalizedAddressLine2]
      .filter(Boolean)
      .join(", ");
  }

  const lowerStreet = normalizedStreet.toLowerCase();
  const dedupedState =
    normalizedState && lowerStreet.includes(normalizedState.toLowerCase())
      ? ""
      : normalizedState;
  const dedupedPostal =
    normalizedPostal && lowerStreet.includes(normalizedPostal.toLowerCase())
      ? ""
      : normalizedPostal;
  const dedupedCity =
    normalizedCity && lowerStreet.includes(normalizedCity.toLowerCase())
      ? ""
      : normalizedCity;

  const localityParts = [dedupedCity, dedupedState]
    .map((value) => s(value))
    .filter(Boolean);
  const locality = localityParts.join(", ");
  const tail = [locality, dedupedPostal]
    .filter(Boolean)
    .join(locality && dedupedPostal ? " " : "");
  const parts = [normalizedStreet, normalizedAddressLine2, tail]
    .map((value) => s(value))
    .filter(Boolean);

  return parts.join(", ");
}

export function buildBusinessDirectionsUrl(source: any) {
  const query = buildBusinessDirectionsQuery(source);
  return query
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
    : null;
}

export function getBusinessMediaSet(source: any) {
  const galleryImages = unique([
    ...asUrlList(source?.galleryImages),
    ...asUrlList(source?.images),
  ]);

  const coverImage = s(source?.coverImage || source?.image);
  const logo = s(source?.logo);
  const primaryImage = coverImage || galleryImages[0] || logo || "";

  return {
    primaryImage: primaryImage || null,
    coverImage: coverImage || null,
    logo: logo || null,
    galleryImages,
  };
}
