// Every page under /admin, grouped for the directory on the admin dashboard.
// src/lib/__tests__/admin-pages-directory-tests.mjs fails if a page is added
// under src/pages/admin without being listed here.

export type AdminPageLink = { href: string; label: string };
export type AdminPageGroup = { title: string; pages: AdminPageLink[] };

export const ADMIN_PAGE_GROUPS: AdminPageGroup[] = [
  {
    title: "Growth and outreach",
    pages: [
      { href: "/admin/growth", label: "Growth Operations" },
      { href: "/admin/business-of-the-day", label: "Business of the Day" },
      {
        href: "/admin/acquisition-report",
        label: "Acquisition Financial View",
      },
      { href: "/admin/partnerships", label: "Partnerships" },
      { href: "/admin/affiliates", label: "Affiliates" },
      { href: "/admin/affiliate-attribution", label: "Affiliate Attribution" },
      { href: "/admin/affiliate-payouts", label: "Affiliate Payouts" },
      { href: "/admin/challenge", label: "0.5% Challenge" },
      { href: "/admin/student-hub", label: "Student Hub" },
    ],
  },
  {
    title: "Approvals",
    pages: [
      { href: "/admin/business-approvals", label: "Business Approvals" },
      { href: "/admin/directory-approvals", label: "Directory Approvals" },
      {
        href: "/admin/organization-approvals",
        label: "Organization Approvals",
      },
      { href: "/admin/organization-claims", label: "Organization Claims" },
      { href: "/admin/product-approvals", label: "Product Approvals" },
      { href: "/admin/job-approvals", label: "Job Approvals" },
      { href: "/admin/claim-verification", label: "Claim Verification" },
      { href: "/admin/intern-applications", label: "Intern Applications" },
      { href: "/admin/advertising-requests", label: "Advertising Requests" },
      { href: "/admin/inquiries", label: "Inquiries (contact form)" },
    ],
  },
  {
    title: "Directory and listings",
    pages: [
      { href: "/admin/directory", label: "Directory" },
      { href: "/admin/directory-duplicates", label: "Duplicates Queue" },
      { href: "/admin/organizations", label: "Organizations" },
      { href: "/admin/featured-products", label: "Featured Products" },
      { href: "/admin/business-lines", label: "Business Lines" },
    ],
  },
  {
    title: "Money",
    pages: [
      { href: "/admin/revenue", label: "Revenue" },
      { href: "/admin/subscriptions", label: "Subscriptions" },
      { href: "/admin/founding-memberships", label: "Founding Memberships" },
      { href: "/admin/financial-review", label: "Financial Review" },
      {
        href: "/admin/financial-class-reconciliation",
        label: "Financial Class Reconciliation",
      },
      { href: "/admin/economic-impact", label: "Economic Impact" },
      { href: "/admin/black-card", label: "Black Card" },
      { href: "/admin/inventory-report", label: "Inventory Report" },
    ],
  },
  {
    title: "Consulting and services",
    pages: [
      { href: "/admin/consulting-leads", label: "Consulting Leads" },
      { href: "/admin/consultant-moderation", label: "Consultant Moderation" },
      {
        href: "/admin/consultant-escalations",
        label: "Consultant Escalations",
      },
      { href: "/admin/service-engagements", label: "Service Engagements" },
    ],
  },
  {
    title: "Users, support and safety",
    pages: [
      { href: "/admin/user-management", label: "User Management" },
      { href: "/admin/support", label: "Support" },
      { href: "/admin/support/tickets", label: "Support Tickets" },
      { href: "/admin/support-review", label: "Support Review" },
      { href: "/admin/content-moderation", label: "Content Moderation" },
      { href: "/admin/trust-safety", label: "Trust and Safety" },
      { href: "/admin/verifier-unified", label: "Unified Verifier" },
      { href: "/admin/legal", label: "Legal" },
    ],
  },
  {
    title: "System",
    pages: [
      { href: "/admin/command-center", label: "Command Center" },
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/observability", label: "Observability" },
      { href: "/admin/health", label: "Health" },
      { href: "/admin/engineering", label: "Engineering" },
      { href: "/admin/releases", label: "Releases" },
      { href: "/admin/product", label: "Product" },
      { href: "/admin/phase1-scoreboard", label: "Phase 1 Scoreboard" },
      { href: "/admin/tools", label: "Tools" },
    ],
  },
];
