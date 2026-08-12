import { type StudentHubCategoryPage } from "@/lib/studentHub/catalog";
import {
  deriveStudentHubLifecycle,
  getStudentHubStatusLabel,
} from "@/lib/studentHub/lifecycle";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";

export type PublicStudentHubRecord = {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  description: string;
  eligibilitySummary: string;
  targetAudience?: string | null;
  discipline?: string | null;
  studentLevel: string;
  attendanceMode: string;
  location?: string | null;
  applicationUrl: string;
  sourceUrl: string;
  source: string;
  tags: string[];
  featured: boolean;
  status: "open" | "upcoming" | "closing_soon" | "closed" | "needs_review";
  statusLabel: string;
  statusNote?: string | null;
  howToApply: string[];
  opensAt?: string | null;
  deadline?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export async function getPublicStudentHubPageRecords(
  page: StudentHubCategoryPage,
) {
  const { records, storage } = await getStudentHubResolvedCatalog({ page });
  return {
    records: records.map((record) => {
      const lifecycle = deriveStudentHubLifecycle(record);
      return {
        id: record.id,
        title: record.title,
        organization: record.organization,
        opportunityType: record.opportunityType,
        description: record.description,
        eligibilitySummary: record.eligibilitySummary,
        targetAudience: record.targetAudience ?? null,
        discipline: record.discipline ?? null,
        studentLevel: record.studentLevel,
        attendanceMode: record.attendanceMode,
        location: record.location ?? null,
        applicationUrl: record.applicationUrl,
        sourceUrl: record.sourceUrl,
        source: record.source,
        tags: record.tags || [],
        featured: Boolean(record.featured),
        status: lifecycle.status,
        statusLabel: getStudentHubStatusLabel(lifecycle.status),
        statusNote: record.statusNote ?? null,
        howToApply: record.howToApply || [],
        opensAt: record.opensAt ?? null,
        deadline: record.deadline ?? null,
        startsAt: record.startsAt ?? null,
        endsAt: record.endsAt ?? null,
      } as PublicStudentHubRecord;
    }),
    storage,
  };
}
