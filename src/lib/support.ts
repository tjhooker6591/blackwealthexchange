export const SUPPORT_CATEGORIES = [
  "Account / Login",
  "Marketplace Order",
  "Seller / Product Issue",
  "Business Directory",
  "Advertising / Sponsorship",
  "Job Posting / Employer",
  "Billing / Payment",
  "Course / Membership",
  "Black Card",
  "Technical Bug",
  "Trust & Safety",
  "General Question",
] as const;

export const SUPPORT_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
  "financial",
  "security",
] as const;

export const SUPPORT_STATUSES = [
  "new",
  "in_review",
  "waiting_on_user",
  "escalated",
  "resolved",
  "closed",
] as const;
