export function toSlug(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fromSlug(input: string) {
  return (input || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const TOP_CITIES = [
  "Atlanta",
  "Houston",
  "Chicago",
  "New York",
  "Los Angeles",
  "Dallas",
  "Charlotte",
  "Washington",
];

export const TOP_CATEGORIES = [
  "Food",
  "Beauty",
  "Health",
  "Professional Services",
  "Shopping",
  "Education",
  "Real Estate",
  "Technology",
];

export const TOP_STATES = ["GA", "TX", "CA", "NY", "FL", "NC", "DC", "IL"];

export const JOB_NICHES = [
  "technology",
  "healthcare",
  "finance",
  "sales",
  "operations",
  "marketing",
  "education",
  "remote",
];
