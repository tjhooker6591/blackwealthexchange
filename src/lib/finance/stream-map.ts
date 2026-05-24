export type FinanceStreamKey =
  | "advertising"
  | "marketplace"
  | "jobs"
  | "membership_black_card"
  | "courses"
  | "consulting_opportunity_network"
  | "music_creator_plan"
  | "directory"
  | "affiliate_liability"
  | "affiliate_revenue"
  | "manual_offline";

export const FINANCE_STREAMS: Array<{
  label: string;
  key: FinanceStreamKey;
}> = [
  { label: "Advertising / Sponsorship Revenue", key: "advertising" },
  { label: "Marketplace Platform Fees", key: "marketplace" },
  { label: "Job Posting Revenue", key: "jobs" },
  { label: "Membership / Black Card Revenue", key: "membership_black_card" },
  { label: "Course / Financial Literacy Revenue", key: "courses" },
  {
    label: "Consulting / Opportunity Network Revenue",
    key: "consulting_opportunity_network",
  },
  { label: "Music Creator Plan Revenue", key: "music_creator_plan" },
  { label: "Directory Listing / Featured Placement Revenue", key: "directory" },
  { label: "Affiliate Revenue Received", key: "affiliate_revenue" },
  { label: "Affiliate Payout Liability", key: "affiliate_liability" },
  { label: "Manual / Offline Revenue", key: "manual_offline" },
];
