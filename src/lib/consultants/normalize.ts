import {
  CONSULTANT_CATEGORIES,
  CONSULTANT_SKILL_LIBRARY,
  ConsultantPipelineStatus,
} from "@/lib/consultants/catalog";

export type ConsultantRecord = {
  id: string;
  name: string;
  professionalTitle: string;
  category: string;
  topSkills: string[];
  yearsExperience: number | null;
  completenessScore: number;
  industriesServed: string[];
  summary: string;
  engagementType: string;
  availability: string;
  resumeUrl: string | null;
  profileImageUrl: string | null;
  certifications: string[];
  toolsPlatforms: string[];
  projectHistory: string[];
  portfolioUrl: string | null;
  location: string | null;
  remoteStatus: string;
  trust: {
    featured: boolean;
    verified: boolean;
    vetted: boolean;
  };
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
      .split(/,|\||\n/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 25);
  }
  return [];
}

export function detectSkills(text: string, explicit: string[] = []) {
  const lowered = text.toLowerCase();
  const fromText = CONSULTANT_SKILL_LIBRARY.filter((skill) =>
    lowered.includes(skill.toLowerCase()),
  );
  const merged = [...explicit, ...fromText];
  return Array.from(new Set(merged)).slice(0, 12);
}

function detectCategory(text: string, fallback = "IT / Software") {
  const lowered = text.toLowerCase();
  const match = CONSULTANT_CATEGORIES.find((cat) =>
    lowered.includes(cat.toLowerCase().split(" /")[0].toLowerCase()),
  );
  return match || fallback;
}

export function normalizeConsultantProfile(doc: any): ConsultantRecord {
  const details = asText(doc?.details);
  const summary =
    asText(doc?.summary) || details || "Consultant profile submitted to BWE.";
  const skills = detectSkills(
    `${summary} ${asText(doc?.professionalTitle)} ${asText(doc?.category)}`,
    asList(doc?.topSkills),
  );

  const completenessScore = Number.isFinite(Number(doc?.completenessScore))
    ? Math.max(0, Math.min(100, Number(doc?.completenessScore)))
    : 55;

  return {
    id: String(doc?._id || doc?.id || ""),
    name: asText(doc?.name) || "Unnamed consultant",
    professionalTitle: asText(doc?.professionalTitle) || "Consultant",
    category: asText(doc?.category) || detectCategory(summary),
    topSkills: skills,
    yearsExperience: Number.isFinite(Number(doc?.yearsExperience))
      ? Number(doc?.yearsExperience)
      : null,
    completenessScore,
    industriesServed: asList(doc?.industriesServed),
    summary,
    engagementType: asText(doc?.engagementType) || "Project-based",
    availability: asText(doc?.availability) || "Open to opportunities",
    resumeUrl: asText(doc?.resumeUrl) || null,
    profileImageUrl: asText(doc?.profileImageUrl) || null,
    certifications: asList(doc?.certifications),
    toolsPlatforms: asList(doc?.toolsPlatforms),
    projectHistory: asList(doc?.projectHistory),
    portfolioUrl: asText(doc?.portfolioUrl) || null,
    location: asText(doc?.location) || null,
    remoteStatus: asText(doc?.remoteStatus) || "Remote-friendly",
    trust: {
      featured: doc?.trust?.featured === true,
      verified: doc?.trust?.verified === true,
      vetted: doc?.trust?.vetted === true,
    },
  };
}

export function normalizePipelineStatus(v: unknown): ConsultantPipelineStatus {
  const text = asText(v).toLowerCase();
  if (text === "contacted") return "contacted";
  if (text === "interview_requested") return "interview_requested";
  if (text === "under_review") return "under_review";
  if (text === "hired") return "hired";
  return "saved";
}
