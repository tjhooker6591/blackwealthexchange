import SupportCategoryPage from "@/components/support/SupportCategoryPage";
export default function Page() {
  return (
    <SupportCategoryPage
      title="Seller Support"
      intro="Resolve seller-side issues for products, orders, and payouts."
      pageTitle="Seller Support | Black Wealth Exchange"
      metaDescription="Get help with BWE seller products, orders, listing visibility, fulfillment, and payout issues."
      canonicalPath="/support/seller"
      commonIssues={[
        "Payout delay",
        "Order fulfillment issue",
        "Listing visibility drop",
      ]}
      decisionGuidance={[
        "If order exists, start from orders view.",
        "If payout issue, confirm status first.",
        "Escalate urgent buyer-impacting issues.",
      ]}
      scenarios={[
        "Buyer paid but order not visible.",
        "Product published but not searchable.",
      ]}
      stepHints={[
        "Check order status and fulfillment timestamps.",
        "Confirm product is active and in stock.",
        "Capture product/order IDs.",
      ]}
      nextActions={[
        "Use guided payout or fulfillment actions.",
        "Escalate with Urgent only for blocked transactions.",
      ]}
      quickActions={[
        { label: "Seller Products", href: "/dashboard/seller/products" },
        { label: "Seller Orders", href: "/marketplace/orders" },
      ]}
      guidedActions={[
        {
          label: "Report payout delay",
          category: "Seller/Payout",
          priority: "High",
        },
        {
          label: "Report fulfillment issue",
          category: "Marketplace Order",
          priority: "High",
        },
      ]}
    />
  );
}
