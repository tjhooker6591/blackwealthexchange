import SupportCategoryPage from "@/components/support/SupportCategoryPage";
export default function Page() {
  return (
    <SupportCategoryPage
      title="Security & Trust Support"
      intro="Report account risks, abuse, fraud, and trust/safety incidents."
      commonIssues={["Suspicious login", "Abusive content", "Possible fraud"]}
      decisionGuidance={[
        "Use Security priority for account-risk events.",
        "Use Urgent when immediate harm is possible.",
      ]}
      scenarios={[
        "Account activity appears unauthorized.",
        "User reports abusive listing or message.",
      ]}
      stepHints={[
        "Change password if account risk is suspected.",
        "Collect URLs/IDs/screenshots.",
        "Document incident timestamp.",
      ]}
      nextActions={[
        "Open security incident ticket immediately.",
        "Monitor status page for active incidents.",
      ]}
      quickActions={[
        { label: "System Status", href: "/support/status" },
        { label: "Profile", href: "/profile" },
      ]}
      guidedActions={[
        {
          label: "Report security incident",
          category: "Security/Trust & Safety",
          priority: "Security",
        },
        {
          label: "Report trust issue",
          category: "Security/Trust & Safety",
          priority: "Urgent",
        },
      ]}
    />
  );
}
