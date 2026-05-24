import SupportCategoryPage from "@/components/support/SupportCategoryPage";
export default function Page() {
  return (
    <SupportCategoryPage
      title="Advertising Support"
      intro="Resolve campaign delivery, placement, and sponsor fulfillment issues."
      commonIssues={[
        "Campaign not live",
        "Placement mismatch",
        "Creative update delayed",
      ]}
      decisionGuidance={[
        "Check campaign setup first.",
        "Use guided actions for sponsor-impacting issues.",
      ]}
      scenarios={[
        "Ad approved but not showing.",
        "Sponsorship location differs from contract.",
      ]}
      stepHints={[
        "Confirm placement type and dates.",
        "Verify creative asset version.",
        "Gather campaign ID.",
      ]}
      nextActions={[
        "Submit ad delivery issue with campaign ID.",
        "Escalate urgent sponsor deadlines.",
      ]}
      quickActions={[
        { label: "Placements", href: "/advertising/placements" },
        { label: "Advertise", href: "/advertise-with-us" },
      ]}
      guidedActions={[
        {
          label: "Report ad delivery issue",
          category: "Advertising/Sponsorship",
          priority: "High",
        },
        {
          label: "Escalate sponsor issue",
          category: "Advertising/Sponsorship",
          priority: "Urgent",
        },
      ]}
    />
  );
}
