// src/components/dashboards/StudentOpportunitiesPanel.tsx
//
// P4-04 Student Dashboard. Renders only when the member has real Black
// Student Opportunities activity (flow_events), so this panel stays
// invisible for members who aren't students rather than showing an empty
// or fabricated section.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

type Opportunity = {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  deadline: string | null;
  daysUntilDeadline: number | null;
  applicationUrl: string;
};

type Payload = {
  state: "LINKED" | "NOT_LINKED";
  topCategory: string | null;
  upcomingInInterestArea: Opportunity[];
};

const CATEGORY_LABEL: Record<string, string> = {
  hub_home: "Black Student Opportunities",
  scholarships: "Scholarships",
  grants: "Grants",
  internships: "Internships",
  mentorship: "Mentorship",
};

export default function StudentOpportunitiesPanel() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/personalization/student-dashboard", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) setData(await res.json());
      } catch {
        // degrade silently
      }
    })();
    return () => controller.abort();
  }, []);

  if (!data || data.state === "NOT_LINKED") return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-yellow-300" />
        <h2 className="text-lg font-bold text-gold">
          {data.topCategory
            ? `${CATEGORY_LABEL[data.topCategory] || "Student Opportunities"} for you`
            : "Student Opportunities"}
        </h2>
      </div>

      {data.upcomingInInterestArea.length ? (
        <div className="mt-3 space-y-2">
          {data.upcomingInInterestArea.map((op) => (
            <a
              key={op.id}
              href={op.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3 transition hover:bg-black/40"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {op.title}
                </div>
                <div className="truncate text-xs text-gray-400">
                  {op.organization}
                </div>
              </div>
              <div className="shrink-0 text-xs text-gray-400">
                {op.daysUntilDeadline !== null
                  ? `${op.daysUntilDeadline}d left`
                  : "Open"}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-400">
          No open deadlines in your viewed category right now.
        </p>
      )}

      <Link
        href="/black-student-opportunities"
        className="mt-3 inline-block text-sm text-gold hover:underline"
      >
        Browse all opportunities
      </Link>
    </div>
  );
}
