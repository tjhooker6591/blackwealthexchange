// src/lib/acquisition/types.ts
//
// BWE Acquisition & Proof -- shared types.
//
// Implements the brief at /Users/blackforge/Downloads/
// BWE_Acquisition_and_Proof_Implementation.md. Anchors every record to the
// existing canonical business identity (`businesses._id`, the same anchor
// Person360/Business360 use) rather than inventing a parallel identity
// system. Revenue truth stays in `bmev_records` (see
// src/lib/economicActivity360.ts) -- nothing here duplicates a payment or
// order ledger; acquisition_events only ever *reference* a bmev_records
// document for a paid_order, never restates its amount.

export type ProspectStage =
  | "researched"
  | "contacted"
  | "replied"
  | "demo_completed"
  | "onboarding_started"
  | "activated";

export const PROSPECT_STAGES: ProspectStage[] = [
  "researched",
  "contacted",
  "replied",
  "demo_completed",
  "onboarding_started",
  "activated",
];

// Paid status is tracked independently of stage per the brief: "Record
// paid status separately from these stages so free activation is never
// misreported as paid conversion."
export type ProspectPaidStatus = "none" | "free_activated" | "paid";

export type ProspectLossState = "active" | "disqualified" | "not_now";

export type PriorityFactor =
  | "reachableContact"
  | "relevantOffer"
  | "profileImprovement"
  | "onboardingReadiness"
  | "buyerChannel";

export type PriorityScoreEntry = {
  score: 0 | 1 | 2;
  note: string | null; // required when score is 0 for missing-evidence reasons
};

export type PriorityScore = Record<PriorityFactor, PriorityScoreEntry>;

export type AcquisitionProspect = {
  _id?: string;
  businessId: string | null; // canonical businesses._id as string; null only when no directory match exists
  externalProspectName: string | null; // only set when businessId is null
  sourceUrl: string | null;
  researchTimestamp: string; // ISO
  contactRoute: string | null; // publicly documented contact route
  evidenceNotes: string;
  targetOffer: string | null;
  stage: ProspectStage;
  paidStatus: ProspectPaidStatus;
  assignedOperator: string | null;
  lastActivityAt: string;
  nextAction: string | null;
  nextActionDueAt: string | null;
  lossState: ProspectLossState;
  lossReason: string | null;
  doNotContact: boolean;
  priorityScore: PriorityScore;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
};

export type ProspectActivity = {
  _id?: string;
  prospectId: string;
  fromStage: ProspectStage | null;
  toStage: ProspectStage;
  actorId: string;
  actorEmail: string;
  note: string | null;
  timestamp: string;
};

export type PreviewField = {
  field: string;
  value: string;
  isProposed: boolean; // true = drafted by BWE, not yet owner-confirmed
};

export type AcquisitionPreview = {
  _id?: string;
  prospectId: string;
  businessId: string;
  proposedFields: PreviewField[];
  missingFacts: string[];
  accessToken: string; // opaque, expiring, revocable -- no auth required to view
  expiresAt: string;
  revoked: boolean;
  createdBy: string;
  createdAt: string;
  internalViewCount: number; // preview visits -- must never count toward buyer/customer reporting
};

export type OnboardingChecklist = {
  claimVerified: boolean;
  ownerConfirmedFacts: boolean;
  contactActionTested: boolean;
  productsReady: boolean | null; // null = not applicable to this business type
  paidOfferSelected: boolean | null; // null = not applicable
  baselineCaptured: boolean;
  buyerCampaignPrepared: boolean;
  activationDateRecorded: boolean;
};

export type OnboardingNotes = {
  ownerGoal: string | null;
  desiredBuyer: string | null;
  offer: string | null;
  serviceArea: string | null;
  preferredContactMethod: string | null;
  agreedDeliverables: string | null;
  openQuestions: string | null;
  successMeasure: string | null;
};

export type AcquisitionOnboarding = {
  _id?: string;
  prospectId: string;
  businessId: string;
  notes: OnboardingNotes;
  aiSummaryDraft: string | null; // always a draft requiring human review; underlying notes are retained regardless
  checklist: OnboardingChecklist;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcquisitionCampaign = {
  _id?: string;
  campaignId: string; // allowlisted short code, unique
  businessId: string;
  channel: string;
  audience: string;
  destination: string;
  startDate: string;
  endDate: string | null;
  costCents: number;
  operator: string;
  createdAt: string;
};

export type AcquisitionEventType =
  | "profile_view"
  | "website_click"
  | "phone_click"
  | "directions_click"
  | "inquiry_submitted"
  | "storefront_view"
  | "paid_order";

export const ACQUISITION_EVENT_TYPES: AcquisitionEventType[] = [
  "profile_view",
  "website_click",
  "phone_click",
  "directions_click",
  "inquiry_submitted",
  "storefront_view",
  "paid_order",
];

export type AcquisitionEventSource =
  | "browser"
  | "server"
  | "provider"
  | "owner_attestation";

export type AcquisitionEvent = {
  _id?: string;
  eventId: string;
  eventType: AcquisitionEventType;
  businessId: string;
  eventTime: string;
  serverReceivedTime: string;
  source: AcquisitionEventSource;
  campaignId: string | null;
  sessionId: string | null; // pseudonymous
  entityRef: string | null; // e.g. bmev_records._id for paid_order, never a restated amount
  dedupeKey: string; // unique index; retries/webhook redelivery collapse to one row
  demoFlag: boolean;
  filtered: { isFiltered: boolean; reason: string | null }; // bot/internal traffic, kept not deleted, for transparent reporting
};

export type OffPlatformSaleAttestation = {
  _id?: string;
  businessId: string;
  attesterId: string;
  attesterEmail: string;
  date: string;
  amountCents: number;
  evidenceRef: string;
  attributionExplanation: string;
  createdAt: string;
};

export type StoryState = "draft" | "owner_reviewed" | "approved" | "published";

export type AcquisitionStory = {
  _id?: string;
  businessId: string;
  snapshotId: string;
  contentVersion: number;
  state: StoryState;
  content: {
    period: string;
    actionsTaken: string;
    observedOutcomes: string;
    sourceReferences: string;
    limitations: string;
    salesFigureText: string | null;
    comparisonText: string | null;
  };
  quotesApprovedBy: string | null;
  approverId: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
