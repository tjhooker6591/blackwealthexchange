export const SUPPORT_CATEGORIES = [
  "Account/Login",
  "Marketplace Order",
  "Seller/Payout",
  "Business Directory",
  "Advertising/Sponsorship",
  "Jobs/Employer",
  "Billing/Refund",
  "Membership/Black Card",
  "Financial Education",
  "Wealth Builder",
  "Music/Creator",
  "Security/Trust & Safety",
  "Technical Issue",
  "General Question",
] as const;

export const SUPPORT_PRIORITIES = [
  "Low",
  "Normal",
  "High",
  "Urgent",
  "Financial",
  "Security",
] as const;

export const SUPPORT_STATUSES = [
  "New",
  "In Review",
  "Waiting on User",
  "Escalated",
  "Resolved",
  "Closed",
] as const;

export const SLA_HOURS = { firstResponse: 24, resolve: 72 } as const;
