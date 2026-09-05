// src/lib/personalization/studentDashboard.ts
//
// P4-04 Student Dashboard.
//
// BWE has no separate "student" account type -- students are regular
// members who browse Black Student Opportunities (scholarships, grants,
// internships, mentorship). Saving/tracking individual opportunities is
// explicitly Phase 5 scope ("save opportunity"), so this dashboard is
// grounded in what is real today: which category pages a member has
// actually viewed (flow_events, see useStudentHubPageView), matched
// against the real catalog to surface upcoming deadlines in their
// demonstrated area of interest. Honest empty state when no student-hub
// activity has been recorded yet.

import type { Db } from "mongodb";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";
import type { StudentHubCategoryPage } from "@/lib/studentHub/catalog";
import { deriveStudentHubLifecycle } from "@/lib/studentHub/lifecycle";

export type StudentDashboardOpportunity = {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  deadline: string | null;
  daysUntilDeadline: number | null;
  applicationUrl: string;
};

export type StudentDashboardResult = {
  state: "LINKED" | "NOT_LINKED";
  categoriesViewed: { category: string; views: number }[];
  topCategory: string | null;
  upcomingInInterestArea: StudentDashboardOpportunity[];
  provenance: { source: string; authoritative: boolean }[];
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

const CATEGORY_TO_PAGE: Record<string, StudentHubCategoryPage | undefined> = {
  hub_home: "hub",
  scholarships: "scholarships",
  grants: "grants",
  internships: "internships",
  mentorship: "mentorship",
};

export async function resolveStudentDashboard(
  db: Db,
  input: { userId: string },
): Promise<StudentDashboardResult> {
  const userId = s(input.userId);
  if (!userId) {
    return {
      state: "NOT_LINKED",
      categoriesViewed: [],
      topCategory: null,
      upcomingInInterestArea: [],
      provenance: [{ source: "missing_user_id", authoritative: false }],
    };
  }

  const events = await db
    .collection("flow_events")
    .find(
      { userId, eventType: "student_hub_page_viewed" },
      { sort: { createdAt: -1 }, limit: 200 },
    )
    .toArray();

  if (!events.length) {
    return {
      state: "NOT_LINKED",
      categoriesViewed: [],
      topCategory: null,
      upcomingInInterestArea: [],
      provenance: [
        { source: "no_student_hub_activity_yet", authoritative: false },
      ],
    };
  }

  const counts = new Map<string, number>();
  for (const event of events) {
    const category = s((event as any).category);
    if (!category) continue;
    counts.set(category, (counts.get(category) || 0) + 1);
  }
  const categoriesViewed = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, views]) => ({ category, views }));

  const topCategory = categoriesViewed[0]?.category || null;
  const page = topCategory ? CATEGORY_TO_PAGE[topCategory] : undefined;

  let upcomingInInterestArea: StudentDashboardOpportunity[] = [];
  if (page) {
    const { records } = await getStudentHubResolvedCatalog({ page });
    upcomingInInterestArea = records
      .map((record) => {
        const lifecycle = deriveStudentHubLifecycle(record);
        return {
          id: record.id,
          title: record.title,
          organization: record.organization,
          opportunityType: record.opportunityType,
          deadline: record.deadline ?? null,
          daysUntilDeadline: lifecycle.daysUntilDeadline,
          applicationUrl: record.applicationUrl,
          status: lifecycle.status,
        };
      })
      .filter((r) => r.status === "open" || r.status === "closing_soon")
      .sort((a, b) => {
        if (a.daysUntilDeadline === null) return 1;
        if (b.daysUntilDeadline === null) return -1;
        return a.daysUntilDeadline - b.daysUntilDeadline;
      })
      .slice(0, 6)
      .map(({ status: _status, ...rest }) => rest);
  }

  return {
    state: "LINKED",
    categoriesViewed,
    topCategory,
    upcomingInInterestArea,
    provenance: [
      {
        source: "flow_events.userId (student_hub_page_viewed)",
        authoritative: true,
      },
    ],
  };
}
