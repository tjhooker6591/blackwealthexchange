import { CONSULTANT_CATEGORIES } from "@/lib/consultants/catalog";

export type ConsultantProfileInput = {
  professionalTitle: string;
  category: string;
  topSkills: string[];
  yearsExperience: number;
  availability: string;
  engagementType: string;
  industriesServed: string[];
  summary?: string;
  toolsPlatforms?: string[];
  certifications?: string[];
  projectHistory?: string[];
  location?: string;
  remoteStatus?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
};

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => asText(x))
      .filter(Boolean)
      .slice(0, 25);
  }
  if (typeof v === "string") {
    return v
      .split(/,|\n|\|/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 25);
  }
  return [];
}

export function validateConsultantProfileInput(body: any): {
  ok: boolean;
  errors: string[];
  value: ConsultantProfileInput;
} {
  const professionalTitle = asText(body?.professionalTitle);
  const category = asText(body?.category);
  const topSkills = asList(body?.topSkills);
  const yearsExperience = Number(body?.yearsExperience);
  const availability = asText(body?.availability);
  const engagementType = asText(body?.engagementType);
  const industriesServed = asList(body?.industriesServed);

  const value: ConsultantProfileInput = {
    professionalTitle,
    category,
    topSkills,
    yearsExperience,
    availability,
    engagementType,
    industriesServed,
    summary: asText(body?.summary),
    toolsPlatforms: asList(body?.toolsPlatforms),
    certifications: asList(body?.certifications),
    projectHistory: asList(body?.projectHistory),
    location: asText(body?.location),
    remoteStatus: asText(body?.remoteStatus),
    portfolioUrl: asText(body?.portfolioUrl),
    resumeUrl: asText(body?.resumeUrl),
  };

  const errors: string[] = [];
  if (!professionalTitle) errors.push("Professional title is required.");
  if (!category) errors.push("Category is required.");
  if (category && !CONSULTANT_CATEGORIES.includes(category as any)) {
    errors.push("Category is invalid.");
  }
  if (topSkills.length < 3) errors.push("At least 3 top skills are required.");
  if (
    !Number.isFinite(yearsExperience) ||
    yearsExperience < 0 ||
    yearsExperience > 60
  ) {
    errors.push("Years of experience must be between 0 and 60.");
  }
  if (!availability) errors.push("Availability is required.");
  if (!engagementType) errors.push("Engagement type is required.");
  if (industriesServed.length < 1)
    errors.push("At least 1 industry is required.");

  return { ok: errors.length === 0, errors, value };
}

export function consultantProfileCompleteness(v: ConsultantProfileInput) {
  const checks = [
    !!v.professionalTitle,
    !!v.category,
    v.topSkills.length >= 3,
    Number.isFinite(v.yearsExperience),
    !!v.availability,
    !!v.engagementType,
    v.industriesServed.length >= 1,
    !!v.summary,
    (v.toolsPlatforms || []).length > 0,
    (v.projectHistory || []).length > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}
