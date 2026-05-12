import SupportCategoryPage from "@/components/support/SupportCategoryPage";
export default function Page() {
  return (
    <SupportCategoryPage
      title="Billing Support"
      intro="Handle payment, refund, and charge questions for BWE purchases."
      commonIssues={[
        "Unexpected charge",
        "Refund pending",
        "Card declined",
        "Invoice mismatch",
      ]}
      decisionGuidance={[
        "Use Quick Actions if the order is visible.",
        "Use Guided Actions for refund/dispute handling.",
        "Escalate only after checking payment history.",
      ]}
      scenarios={[
        "Order was charged twice.",
        "Refund was requested but not received.",
        "Subscription renewal looked incorrect.",
      ]}
      stepHints={[
        "Check order receipt and timestamp.",
        "Confirm payment method and billing email.",
        "Gather order/payment IDs.",
      ]}
      nextActions={[
        "Open a refund request with Financial priority.",
        "Track response in My Tickets.",
      ]}
      quickActions={[
        { label: "My Orders", href: "/marketplace/my-orders" },
        { label: "Billing Hub", href: "/billing-support" },
        { label: "Profile", href: "/profile" },
      ]}
      guidedActions={[
        {
          label: "Request refund",
          category: "Billing/Refund",
          priority: "Financial",
        },
        {
          label: "Dispute charge",
          category: "Billing/Refund",
          priority: "Urgent",
        },
      ]}
    />
  );
}
