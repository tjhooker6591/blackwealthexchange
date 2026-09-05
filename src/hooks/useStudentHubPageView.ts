// src/hooks/useStudentHubPageView.ts
//
// Emits a real flow_events page-view record for a Black Student
// Opportunities category page. This is the only behavioral signal the
// Student Dashboard (P4-04) has to work with, since these pages otherwise
// link straight out to external application URLs. One hook shared across
// all five category pages rather than duplicating tracking logic.

import { useEffect } from "react";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

export type StudentHubPageCategory =
  | "hub_home"
  | "scholarships"
  | "grants"
  | "internships"
  | "mentorship";

export function useStudentHubPageView(category: StudentHubPageCategory) {
  useEffect(() => {
    emitFlowEvent({
      eventType: "student_hub_page_viewed",
      pageRoute: "/black-student-opportunities",
      section: "student_hub",
      category,
      entityType: "student_opportunity_category",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
