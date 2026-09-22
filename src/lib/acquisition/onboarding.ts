// src/lib/acquisition/onboarding.ts
//
// Section 3 of the brief: conversation-to-onboarding workflow. Re-uses the
// existing claim/representative authorization (directoryOwnership.ts) --
// checklist completion never bypasses ownership checks, and activation is
// only permitted after the required checklist items for that business
// type pass. This is the single place "activated" can be reached; stage
// transitions in prospects.ts explicitly refuse to set "activated"
// directly.

import { ObjectId, type Db } from "mongodb";
import { COLLECTIONS, nowIso, s } from "./shared";
import { resolveBusiness360 } from "@/lib/business360";
import type {
  AcquisitionOnboarding,
  OnboardingChecklist,
  OnboardingNotes,
} from "./types";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

const DEFAULT_CHECKLIST: OnboardingChecklist = {
  claimVerified: false,
  ownerConfirmedFacts: false,
  contactActionTested: false,
  productsReady: null,
  paidOfferSelected: null,
  baselineCaptured: false,
  buyerCampaignPrepared: false,
  activationDateRecorded: false,
};

export async function getOrCreateOnboarding(
  db: Db,
  prospectId: string,
): Promise<AcquisitionOnboarding | null> {
  if (!ObjectId.isValid(prospectId)) return null;
  const prospect = await db
    .collection(COLLECTIONS.prospects)
    .findOne({ _id: new ObjectId(prospectId) });
  if (!prospect || !(prospect as any).businessId) return null;

  const existing = await db
    .collection(COLLECTIONS.onboarding)
    .findOne({ prospectId });
  if (existing) {
    return {
      ...existing,
      _id: toStringId((existing as any)._id),
    } as AcquisitionOnboarding;
  }

  const now = nowIso();
  const doc: AcquisitionOnboarding = {
    prospectId,
    businessId: s((prospect as any).businessId),
    notes: {
      ownerGoal: null,
      desiredBuyer: null,
      offer: null,
      serviceArea: null,
      preferredContactMethod: null,
      agreedDeliverables: null,
      openQuestions: null,
      successMeasure: null,
    },
    aiSummaryDraft: null,
    checklist: { ...DEFAULT_CHECKLIST },
    activatedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db
    .collection(COLLECTIONS.onboarding)
    .insertOne(doc as any);
  return { ...doc, _id: toStringId(result.insertedId) };
}

export async function updateOnboardingNotes(
  db: Db,
  prospectId: string,
  notes: Partial<OnboardingNotes>,
  aiSummaryDraft?: string | null,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const record = await getOrCreateOnboarding(db, prospectId);
  if (!record) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "No onboarding record for this prospect.",
    };
  }
  const set: Record<string, unknown> = {
    notes: { ...record.notes, ...notes },
    updatedAt: nowIso(),
  };
  // An AI-generated summary is always a draft requiring human review; the
  // underlying notes above are retained regardless of whether the draft
  // is ever used.
  if (typeof aiSummaryDraft === "string") set.aiSummaryDraft = aiSummaryDraft;

  await db
    .collection(COLLECTIONS.onboarding)
    .updateOne({ prospectId }, { $set: set });
  return { ok: true };
}

export async function updateOnboardingChecklist(
  db: Db,
  prospectId: string,
  checklist: Partial<OnboardingChecklist>,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const record = await getOrCreateOnboarding(db, prospectId);
  if (!record) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "No onboarding record for this prospect.",
    };
  }
  await db
    .collection(COLLECTIONS.onboarding)
    .updateOne(
      { prospectId },
      {
        $set: {
          checklist: { ...record.checklist, ...checklist },
          updatedAt: nowIso(),
        },
      },
    );
  return { ok: true };
}

/**
 * Checklist items required for EVERY business type. `productsReady` and
 * `paidOfferSelected` are conditionally required only "where applicable" --
 * a checklist value of `null` means "not applicable to this business
 * type" and does not block activation; `false` does.
 */
function checklistPasses(checklist: OnboardingChecklist): {
  pass: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!checklist.claimVerified) missing.push("claimVerified");
  if (!checklist.ownerConfirmedFacts) missing.push("ownerConfirmedFacts");
  if (!checklist.contactActionTested) missing.push("contactActionTested");
  if (checklist.productsReady === false) missing.push("productsReady");
  if (checklist.paidOfferSelected === false) missing.push("paidOfferSelected");
  if (!checklist.baselineCaptured) missing.push("baselineCaptured");
  if (!checklist.buyerCampaignPrepared) missing.push("buyerCampaignPrepared");
  return { pass: missing.length === 0, missing };
}

export type ActivateProspectInput = {
  prospectId: string;
  actorId: string;
  actorEmail: string;
};

export async function activateProspect(
  db: Db,
  input: ActivateProspectInput,
): Promise<
  | { ok: true }
  | { ok: false; code: "MISSING_CHECKLIST_ITEMS"; missing: string[] }
  | {
      ok: false;
      code: "NOT_FOUND" | "CLAIM_NOT_VERIFIED" | "ALREADY_ACTIVATED";
      message: string;
    }
> {
  if (!ObjectId.isValid(input.prospectId)) {
    return { ok: false, code: "NOT_FOUND", message: "Invalid prospect id." };
  }
  const prospect = await db
    .collection(COLLECTIONS.prospects)
    .findOne({ _id: new ObjectId(input.prospectId) });
  if (!prospect) {
    return { ok: false, code: "NOT_FOUND", message: "Prospect not found." };
  }
  if ((prospect as any).stage === "activated") {
    return {
      ok: false,
      code: "ALREADY_ACTIVATED",
      message: "This prospect is already activated.",
    };
  }
  const businessId = s((prospect as any).businessId);
  if (!businessId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message:
        "Activation requires a canonical businessId (external-only prospects cannot activate).",
    };
  }

  const onboarding = await getOrCreateOnboarding(db, input.prospectId);
  if (!onboarding) {
    return { ok: false, code: "NOT_FOUND", message: "No onboarding record." };
  }

  const { pass, missing } = checklistPasses(onboarding.checklist);
  if (!pass) {
    return { ok: false, code: "MISSING_CHECKLIST_ITEMS", missing };
  }

  // Re-use existing claim/representative authorization as the actual
  // source of truth for "claimed" -- the checklist's claimVerified box is
  // an operator attestation that they checked, but activation still
  // requires a REAL verified ownership record to exist (same signal
  // src/lib/personalization/businessGrowth.ts already uses), so checklist
  // completion can never substitute for or bypass ownership verification.
  const business360 = await resolveBusiness360(db, {
    businessId,
    sections: ["ownership"],
  });
  const hasVerifiedOwner =
    business360.ok &&
    (business360.ownership.data.claimState === "ownership_verified" ||
      business360.ownership.data.verifiedRepresentativeUserIds.length > 0);
  if (!hasVerifiedOwner) {
    return {
      ok: false,
      code: "CLAIM_NOT_VERIFIED",
      message:
        "No verified ownership record exists for this business yet. Complete claim verification before activating.",
    };
  }

  const now = nowIso();
  await db.collection(COLLECTIONS.onboarding).updateOne(
    { prospectId: input.prospectId },
    {
      $set: {
        "checklist.activationDateRecorded": true,
        activatedAt: now,
        updatedAt: now,
      },
    },
  );
  await db
    .collection(COLLECTIONS.prospects)
    .updateOne(
      { _id: new ObjectId(input.prospectId) },
      { $set: { stage: "activated", lastActivityAt: now, updatedAt: now } },
    );
  await db.collection(COLLECTIONS.activities).insertOne({
    prospectId: input.prospectId,
    fromStage: (prospect as any).stage,
    toStage: "activated",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    note: "Activated -- onboarding checklist and verified ownership both confirmed.",
    timestamp: now,
  });

  return { ok: true };
}
