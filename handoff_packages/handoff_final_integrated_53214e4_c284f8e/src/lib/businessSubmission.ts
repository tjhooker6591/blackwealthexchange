export type BusinessSubmissionInput = {
  businessName: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  website?: string;
  description: string;
  facebook?: string;
  twitter?: string;
};

export type NormalizedLocation = {
  normalized: string;
  city: string;
  state: string;
};

export type NormalizedBusinessSubmission = {
  businessName: string;
  category: string;
  location: string;
  normalizedLocation: NormalizedLocation;
  phone: string;
  email: string;
  website: string;
  description: string;
  facebook: string;
  twitter: string;
  slugBase: string;
};

export type BusinessSubmissionValidationResult =
  | { ok: true; value: NormalizedBusinessSubmission }
  | { ok: false; error: string };

export function normalizeOptionalUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, "").trim();
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

export function normalizeLocationParts(raw: string): NormalizedLocation {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) {
    return { normalized: "", city: "", state: "" };
  }

  if (value.includes(",")) {
    const [city = "", state = ""] = value.split(",").map((s) => s.trim());
    return {
      normalized: [city, state ? state.toUpperCase() : ""].filter(Boolean).join(", "),
      city,
      state: state.toUpperCase(),
    };
  }

  const parts = value.split(" ");
  if (parts.length >= 2) {
    const state = parts[parts.length - 1]?.trim() || "";
    const city = parts.slice(0, -1).join(" ").trim();
    if (city && /^[A-Za-z]{2,}$/.test(state)) {
      return {
        normalized: `${city}, ${state.toUpperCase()}`,
        city,
        state: state.toUpperCase(),
      };
    }
  }

  return { normalized: value, city: value, state: "" };
}

export function slugifyBusinessName(businessName: string) {
  return businessName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUniqueSlug(slugBase: string, existingCount: number) {
  if (!slugBase) return undefined;
  if (existingCount <= 0) return slugBase;
  return `${slugBase}-${existingCount + 1}`;
}

export function validateBusinessSubmission(
  input: BusinessSubmissionInput,
): BusinessSubmissionValidationResult {
  const businessName = input.businessName.trim();
  const category = input.category.trim().toLowerCase();
  const location = input.location.trim();
  const normalizedLocation = normalizeLocationParts(location);
  const phone = normalizePhone(input.phone);
  const email = input.email.trim().toLowerCase();
  const website = normalizeOptionalUrl(input.website || "");
  const description = input.description.trim();
  const facebook = normalizeOptionalUrl(input.facebook || "");
  const twitter = normalizeOptionalUrl(input.twitter || "");
  const slugBase = slugifyBusinessName(businessName);

  if (!businessName || !email || !category) {
    return {
      ok: false,
      error: "Business name, email, and category are required.",
    };
  }

  if (!normalizedLocation.normalized) {
    return {
      ok: false,
      error: "Please enter a location, for example: Allentown, PA.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      error: "Please enter a valid email address.",
    };
  }

  if (!isValidPhone(phone)) {
    return {
      ok: false,
      error: "Please enter a valid phone number with at least 10 digits.",
    };
  }

  if (!description) {
    return {
      ok: false,
      error: "Please add a short business description.",
    };
  }

  return {
    ok: true,
    value: {
      businessName,
      category,
      location,
      normalizedLocation,
      phone,
      email,
      website,
      description,
      facebook,
      twitter,
      slugBase,
    },
  };
}

export function getCreateBusinessDuplicateError() {
  return "A business with this name appears to already exist. Please update the business name slightly or contact support if this is your listing.";
}

export function getCreateBusinessSuccessMessage() {
  return "Business submitted for review.";
}
