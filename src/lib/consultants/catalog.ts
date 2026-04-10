export const CONSULTANT_CATEGORIES = [
  "IT / Software",
  "QA / Testing",
  "Project / Program Management",
  "Product Management",
  "Cybersecurity",
  "Cloud / DevOps",
  "Data / Analytics / AI",
  "ERP / Salesforce / SAP / CRM",
  "Business Analysis",
  "Change Management / Training",
  "Operations",
  "Finance / Accounting",
  "HR / Recruiting",
  "Marketing / Brand / Growth",
  "Healthcare / Public Sector / Compliance",
  "Legal / Risk / Governance",
] as const;

export const CONSULTANT_SKILL_LIBRARY = [
  "Selenium",
  "Jira",
  "SQL",
  "Power BI",
  "AWS",
  "Azure",
  "Salesforce",
  "Scrum",
  "CAPA",
  "HIPAA",
  "SOC 2",
  "QA automation",
  "implementation",
  "audit",
  "compliance",
  "leadership",
  "training",
  "process improvement",
] as const;

export const CONSULTANT_PIPELINE_STATUSES = [
  "saved",
  "contacted",
  "interview_requested",
  "under_review",
  "hired",
] as const;

export type ConsultantPipelineStatus =
  (typeof CONSULTANT_PIPELINE_STATUSES)[number];

export const CONSULTANT_CONTACT_REQUEST_STATUSES = [
  "submitted",
  "accepted",
  "declined",
  "more_info_requested",
] as const;

export type ConsultantContactRequestStatus =
  (typeof CONSULTANT_CONTACT_REQUEST_STATUSES)[number];
