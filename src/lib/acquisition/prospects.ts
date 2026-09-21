// src/lib/acquisition/prospects.ts
//
// Section 1 of the brief: Admin acquisition queue. Attached to canonical
// existing business IDs; an external prospect record is only created when
// no directory match exists (never a duplicate directory record). Stage
// transitions are recorded as immutable history (acquisition_prospect_
// activities), separate from the mutable prospect document itself, so the
// pipeline's real history can never be silently rewritten.

import { ObjectId, type Db } from "mongodb";
import { COLLECTIONS, nowIso, resolveCanonicalBusiness, s } from "./shared";
import {
  PROSPECT_STAGES,
  type AcquisitionProspect,
  type PriorityFactor,
  type PriorityScore,
  type ProspectPaidStatus,
  type ProspectStage,
} from "./types";

const STAGE_ORDER: Record<ProspectStage, number> = {
  researched: 0,
  contacted: 1,
  replied: 2,
  demo_completed: 3,
  onboarding_started: 4,
  activated: 5,
};

function emptyPriorityScore(): PriorityScore {
  const factors: PriorityFactor[] = [
    "reachableContact",
    "relevantOffer",
    "profileImprovement",
    "onboardingReadiness",
    "buyerChannel",
  ];
  return Object.fromEntries(
    factors.map((f) => [f, { score: 0, note: "missing evidence" }]),
  ) as PriorityScore;
}

export function priorityTotal(score: PriorityScore): number {
  return Object.values(score).reduce((sum, entry) => sum + entry.score, 0);
}

export type CreateProspectInput = {
  businessId?: string | null;
  externalProspectName?: string | null;
  sourceUrl?: string | null;
  contactRoute?: string | null;
  contactEmail?: string | null;
  evidenceNotes?: string;
  targetOffer?: string | null;
  assignedOperator?: string | null;
  priorityScore?: Partial<PriorityScore>;
  actorId: string;
  actorEmail: string;
};

export async function createProspect(
  db: Db,
  input: CreateProspectInput,
): Promise<
  | { ok: true; prospect: AcquisitionProspect }
  | { ok: false; code: string; message: string }
> {
  const businessId = s(input.businessId);
  const externalName = s(input.externalProspectName);

  if (!businessId && !externalName) {
    return {
      ok: false,
      code: "MISSING_IDENTITY",
      message:
        "Either a canonical businessId or an external prospect name is required.",
    };
  }

  if (businessId) {
    const canonical = await resolveCanonicalBusiness(db, businessId);
    if (!canonical) {
      return {
        ok: false,
        code: "BUSINESS_NOT_FOUND",
        message: "No canonical business record matches this businessId.",
      };
    }
    // Never create duplicate directory records during intake -- and never
    // a duplicate prospect for a business already in the queue.
    const existing = await db
      .collection(COLLECTIONS.prospects)
      .findOne({ businessId });
    if (existing) {
      return {
        ok: false,
        code: "PROSPECT_ALREADY_EXISTS",
        message: `This business already has an open prospect record (${toStringId(existing._id)}).`,
      };
    }
  }

  const now = nowIso();
  const score = { ...emptyPriorityScore(), ...(input.priorityScore || {}) };

  const doc: AcquisitionProspect = {
    businessId: businessId || null,
    externalProspectName: businessId ? null : externalName,
    sourceUrl: s(input.sourceUrl) || null,
    researchTimestamp: now,
    contactRoute: s(input.contactRoute) || null,
    contactEmail: s(input.contactEmail) || null,
    evidenceNotes: s(input.evidenceNotes),
    targetOffer: s(input.targetOffer) || null,
    stage: "researched",
    paidStatus: "none",
    assignedOperator: s(input.assignedOperator) || null,
    lastActivityAt: now,
    nextAction: null,
    nextActionDueAt: null,
    lossState: "active",
    lossReason: null,
    doNotContact: false,
    priorityScore: score,
    createdAt: now,
    createdBy: input.actorId,
    updatedAt: now,
  };

  const result = await db
    .collection(COLLECTIONS.prospects)
    .insertOne(doc as any);
  const prospectId = toStringId(result.insertedId);

  await db.collection(COLLECTIONS.activities).insertOne({
    prospectId,
    fromStage: null,
    toStage: "researched",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    note: "Prospect created.",
    timestamp: now,
  });

  return { ok: true, prospect: { ...doc, _id: prospectId } };
}

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

export type TransitionInput = {
  prospectId: string;
  toStage: ProspectStage;
  note?: string | null;
  actorId: string;
  actorEmail: string;
};

export async function transitionProspectStage(
  db: Db,
  input: TransitionInput,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(input.prospectId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid prospect id." };
  }
  const prospect = await db
    .collection(COLLECTIONS.prospects)
    .findOne({ _id: new ObjectId(input.prospectId) });
  if (!prospect) {
    return { ok: false, code: "NOT_FOUND", message: "Prospect not found." };
  }
  if (!PROSPECT_STAGES.includes(input.toStage)) {
    return { ok: false, code: "INVALID_STAGE", message: "Unknown stage." };
  }

  // Stages move forward only through this transition function -- backward
  // moves (e.g. a demo that falls through) go through lossState instead,
  // so "activated" can never be reached without the intermediate stages
  // actually having happened at some point in this prospect's history.
  const fromStage = prospect.stage as ProspectStage;
  if (STAGE_ORDER[input.toStage] < STAGE_ORDER[fromStage]) {
    return {
      ok: false,
      code: "BACKWARD_TRANSITION_NOT_ALLOWED",
      message:
        "Stage history is append-only forward. Use loss/disqualify state for prospects that fall through instead of moving a stage backward.",
    };
  }

  if (input.toStage === "activated") {
    return {
      ok: false,
      code: "ACTIVATION_REQUIRES_ONBOARDING_GATE",
      message:
        "Activation must go through activateProspect() in onboarding.ts, which enforces the required checklist gate.",
    };
  }

  const now = nowIso();
  await db
    .collection(COLLECTIONS.prospects)
    .updateOne(
      { _id: new ObjectId(input.prospectId) },
      { $set: { stage: input.toStage, lastActivityAt: now, updatedAt: now } },
    );
  await db.collection(COLLECTIONS.activities).insertOne({
    prospectId: input.prospectId,
    fromStage,
    toStage: input.toStage,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    note: input.note || null,
    timestamp: now,
  });

  return { ok: true };
}

export type SetLossStateInput = {
  prospectId: string;
  lossState: "disqualified" | "not_now" | "active";
  lossReason?: string | null;
  actorId: string;
  actorEmail: string;
};

export async function setProspectLossState(
  db: Db,
  input: SetLossStateInput,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(input.prospectId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid prospect id." };
  }
  const now = nowIso();
  // Disqualified and not-now prospects remain preserved -- this only sets
  // a status field, it never deletes the prospect or its history.
  const result = await db.collection(COLLECTIONS.prospects).updateOne(
    { _id: new ObjectId(input.prospectId) },
    {
      $set: {
        lossState: input.lossState,
        lossReason:
          input.lossState === "active" ? null : s(input.lossReason) || null,
        lastActivityAt: now,
        updatedAt: now,
      },
    },
  );
  if (!result.matchedCount) {
    return { ok: false, code: "NOT_FOUND", message: "Prospect not found." };
  }
  await db.collection(COLLECTIONS.activities).insertOne({
    prospectId: input.prospectId,
    fromStage: null,
    toStage: null,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    note: `Loss state set to ${input.lossState}${input.lossReason ? `: ${input.lossReason}` : ""}`,
    timestamp: now,
  });
  return { ok: true };
}

export async function setPaidStatus(
  db: Db,
  input: {
    prospectId: string;
    paidStatus: ProspectPaidStatus;
    actorId: string;
    actorEmail: string;
  },
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(input.prospectId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid prospect id." };
  }
  const now = nowIso();
  const result = await db.collection(COLLECTIONS.prospects).updateOne(
    { _id: new ObjectId(input.prospectId) },
    {
      $set: {
        paidStatus: input.paidStatus,
        lastActivityAt: now,
        updatedAt: now,
      },
    },
  );
  if (!result.matchedCount) {
    return { ok: false, code: "NOT_FOUND", message: "Prospect not found." };
  }
  await db.collection(COLLECTIONS.activities).insertOne({
    prospectId: input.prospectId,
    fromStage: null,
    toStage: null,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    note: `Paid status set to ${input.paidStatus}.`,
    timestamp: now,
  });
  return { ok: true };
}

export async function listProspects(
  db: Db,
  filter: { stage?: ProspectStage; lossState?: string; q?: string } = {},
) {
  const mongoFilter: Record<string, unknown> = {};
  if (filter.stage) mongoFilter.stage = filter.stage;
  if (filter.lossState) mongoFilter.lossState = filter.lossState;
  if (filter.q) {
    const rx = new RegExp(filter.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    mongoFilter.$or = [
      { externalProspectName: rx },
      { evidenceNotes: rx },
      { targetOffer: rx },
    ];
  }

  const rows = await db
    .collection(COLLECTIONS.prospects)
    .find(mongoFilter)
    .sort({ lastActivityAt: -1 })
    .limit(200)
    .toArray();

  // Enrich with canonical business name/route for display -- read-only,
  // never writes back into the prospect document.
  const businessIds = Array.from(
    new Set(rows.map((r: any) => s(r.businessId)).filter(Boolean)),
  );
  const businesses = businessIds.length
    ? await db
        .collection("businesses")
        .find(
          {
            _id: {
              $in: businessIds
                .filter((id) => ObjectId.isValid(id))
                .map((id) => new ObjectId(id)),
            },
          },
          { projection: { business_name: 1, businessName: 1, name: 1 } },
        )
        .toArray()
    : [];
  const nameById = new Map(
    businesses.map((b: any) => [
      String(b._id),
      s(b.business_name) || s(b.businessName) || s(b.name) || "Business",
    ]),
  );

  return rows.map((r: any) => ({
    ...r,
    _id: toStringId(r._id),
    priorityTotal: priorityTotal(r.priorityScore || emptyPriorityScore()),
    displayName:
      (r.businessId ? nameById.get(s(r.businessId)) : null) ||
      r.externalProspectName ||
      "Unnamed prospect",
  }));
}

export async function getProspect(db: Db, prospectId: string) {
  if (!ObjectId.isValid(prospectId)) return null;
  const doc = await db
    .collection(COLLECTIONS.prospects)
    .findOne({ _id: new ObjectId(prospectId) });
  if (!doc) return null;
  const activities = await db
    .collection(COLLECTIONS.activities)
    .find({ prospectId })
    .sort({ timestamp: -1 })
    .toArray();
  return { ...doc, _id: toStringId((doc as any)._id), activities };
}
