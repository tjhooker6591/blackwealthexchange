// src/lib/platformCapabilities.ts
//
// Phase 7 -- BWE AI Mode. A real, static index of BWE's actual routes and
// what they do, for "what can I do on BWE" / "how do I..." style queries.
// Every href here is a real, working route -- this mirrors (and should be
// kept in sync with) the EXPLORE_GROUPS list in src/pages/explore.tsx,
// declared independently here rather than imported from that page so AI
// Mode never risks a regression in the already-validated Explore hub.
// Nothing here is invented; every entry is a route that already exists.

export type PlatformCapability = {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
};

export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  {
    id: "business-directory",
    label: "Business Directory",
    description: "Find and support verified Black-owned businesses.",
    href: "/business-directory",
    keywords: ["directory", "business", "businesses", "find a business"],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Shop products sold directly by Black-owned sellers.",
    href: "/marketplace",
    keywords: ["marketplace", "shop", "buy", "products"],
  },
  {
    id: "jobs",
    label: "Jobs",
    description: "Browse open roles from employers building with BWE.",
    href: "/job-listings",
    keywords: ["job", "jobs", "career", "hiring", "employment"],
  },
  {
    id: "student-opportunities",
    label: "Student Opportunities",
    description: "Scholarships, internships, grants, and mentorship.",
    href: "/black-student-opportunities",
    keywords: ["scholarship", "student", "internship", "grant", "mentorship"],
  },
  {
    id: "wealth-builder",
    label: "Wealth Builder",
    description: "Track budgets, debt, savings, and net worth in one place.",
    href: "/wealth-builder",
    keywords: ["wealth", "budget", "savings", "debt", "net worth"],
  },
  {
    id: "black-card",
    label: "Black Card",
    description: "Explore membership benefits and premium access.",
    href: "/black-card",
    keywords: ["black card", "membership", "premium"],
  },
  {
    id: "start-here",
    label: "Add / Claim Business",
    description: "List a new business or claim your existing listing.",
    href: "/start-here",
    keywords: ["add business", "claim business", "list my business"],
  },
  {
    id: "sell-on-bwe",
    label: "Sell on BWE",
    description: "Set up a seller account and list products.",
    href: "/marketplace/become-a-seller",
    keywords: ["sell", "become a seller", "seller account"],
  },
  {
    id: "post-job",
    label: "Hire Talent",
    description: "Post a job and reach BWE's talent community.",
    href: "/post-job",
    keywords: ["post a job", "hire", "recruit"],
  },
  {
    id: "growth-command-center",
    label: "Growth Command Center",
    description:
      "Real profile views, revenue, and next steps for your business.",
    href: "/dashboard",
    keywords: ["dashboard", "growth", "my business"],
  },
  {
    id: "my-bwe",
    label: "My BWE",
    description:
      "Following, saved businesses/products, collections, alerts, notifications, inbox, referrals.",
    href: "/my-bwe",
    keywords: [
      "saved",
      "following",
      "notifications",
      "inbox",
      "referrals",
      "my bwe",
    ],
  },
  {
    id: "explore",
    label: "Explore",
    description: "Everything BWE can do for you, organized by category.",
    href: "/explore",
    keywords: ["explore", "everything", "what can I do"],
  },
  {
    id: "economic-freedom",
    label: "Economic Impact",
    description:
      "Black buying power in context, and BWE's own measured platform impact.",
    href: "/economic-freedom",
    keywords: ["economic impact", "economic activity", "buying power"],
  },
  {
    id: "support",
    label: "Support",
    description: "Get help, report an issue, or contact BWE support.",
    href: "/support",
    keywords: ["help", "support", "contact"],
  },
];
