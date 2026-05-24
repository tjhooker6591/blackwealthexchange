import SupportCategoryPage from "@/components/support/SupportCategoryPage";
export default function Page() {
  return (
    <SupportCategoryPage
      title="Business Directory Support"
      intro="Fix listing quality, verification, and directory visibility issues."
      commonIssues={[
        "Listing not appearing",
        "Wrong listing details",
        "Verification stalled",
      ]}
      decisionGuidance={[
        "Use Quick Actions for edits.",
        "Use Guided Actions if listing still fails after edits.",
      ]}
      scenarios={[
        "Business appears in profile but not search.",
        "Phone/address displays outdated data.",
      ]}
      stepHints={[
        "Confirm listing slug and category.",
        "Re-check city/state filters.",
        "Save edits and re-test search.",
      ]}
      nextActions={[
        "Submit listing fix request with business ID.",
        "Track updates in My Tickets.",
      ]}
      quickActions={[
        { label: "Business Profile", href: "/business/profile" },
        { label: "Edit Business", href: "/edit-business" },
        { label: "Directory", href: "/business-directory" },
      ]}
      guidedActions={[
        {
          label: "Fix listing",
          category: "Business Directory",
          priority: "Normal",
        },
        {
          label: "Request verification help",
          category: "Business Directory",
          priority: "High",
        },
      ]}
    />
  );
}
