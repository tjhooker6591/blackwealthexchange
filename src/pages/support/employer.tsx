import SupportCategoryPage from "@/components/support/SupportCategoryPage";
export default function Page() {
  return (
    <SupportCategoryPage
      title="Employer Support"
      intro="Help for job postings, applicants, and hiring workflow tools."
      commonIssues={[
        "Job not published",
        "Applicant list missing",
        "Status mismatch",
      ]}
      decisionGuidance={[
        "Start from employer jobs dashboard.",
        "If applicant data is missing, verify filters first.",
      ]}
      scenarios={[
        "Job post submitted but not visible.",
        "Applicant changed status but UI not updated.",
      ]}
      stepHints={[
        "Check job status and expiration.",
        "Refresh applicant filters.",
        "Collect job/applicant IDs.",
      ]}
      nextActions={[
        "Open Jobs/Employer ticket if unresolved.",
        "Use Urgent only when hiring is blocked.",
      ]}
      quickActions={[
        { label: "Employer Jobs", href: "/employer/jobs" },
        { label: "Applicants", href: "/employer/applicants" },
      ]}
      guidedActions={[
        {
          label: "Fix job posting",
          category: "Jobs/Employer",
          priority: "High",
        },
        {
          label: "Report applicant issue",
          category: "Jobs/Employer",
          priority: "Normal",
        },
      ]}
    />
  );
}
