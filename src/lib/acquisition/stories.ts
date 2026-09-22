// src/lib/acquisition/stories.ts
//
// Section 6 of the brief: evidence and customer story. A story is created
// from a versioned metrics snapshot (never live-recomputed after
// approval, so an approved story's numbers can't silently drift), and
// moves through draft -> owner_reviewed -> approved -> published.
// Editing approved content invalidates approval (bumps contentVersion and
// resets state to draft). Publication is a distinct, explicit action from
// approval -- approving never auto-publishes.

import { ObjectId, type Db } from "mongodb";
import { COLLECTIONS, nowIso, s } from "./shared";
import { resolveOwnerReport } from "./reports";
import type { AcquisitionStory, StoryState } from "./types";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

export type CreateSnapshotInput = {
  businessId: string;
  windowStart: string;
  windowEnd: string;
};

/** A versioned, immutable metrics snapshot -- the story's numbers are
 * always drawn from one of these, never recomputed live once approved. */
export async function createReportSnapshot(db: Db, input: CreateSnapshotInput) {
  const report = await resolveOwnerReport(db, {
    businessId: input.businessId,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
  });
  const doc = {
    businessId: s(input.businessId),
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    generatedAt: nowIso(),
    metrics: report,
    schemaVersion: 1,
  };
  const result = await db
    .collection(COLLECTIONS.reportSnapshots)
    .insertOne(doc as any);
  return { ...doc, _id: toStringId(result.insertedId) };
}

export type CreateStoryInput = {
  businessId: string;
  snapshotId: string;
  period: string;
  actionsTaken: string;
  observedOutcomes: string;
  sourceReferences: string;
  limitations: string;
  salesFigureText?: string | null;
  comparisonText?: string | null;
  actorId: string;
};

export async function createStory(
  db: Db,
  input: CreateStoryInput,
): Promise<
  | { ok: true; story: AcquisitionStory }
  | { ok: false; code: string; message: string }
> {
  if (!ObjectId.isValid(input.snapshotId)) {
    return {
      ok: false,
      code: "INVALID_SNAPSHOT",
      message: "Invalid snapshotId.",
    };
  }
  const snapshot = await db
    .collection(COLLECTIONS.reportSnapshots)
    .findOne({ _id: new ObjectId(input.snapshotId) });
  if (!snapshot) {
    return {
      ok: false,
      code: "SNAPSHOT_NOT_FOUND",
      message: "Report snapshot not found.",
    };
  }

  const now = nowIso();
  const doc: AcquisitionStory = {
    businessId: s(input.businessId),
    snapshotId: input.snapshotId,
    contentVersion: 1,
    state: "draft",
    content: {
      period: s(input.period),
      actionsTaken: s(input.actionsTaken),
      observedOutcomes: s(input.observedOutcomes),
      sourceReferences: s(input.sourceReferences),
      limitations: s(input.limitations),
      salesFigureText: s(input.salesFigureText || "") || null,
      comparisonText: s(input.comparisonText || "") || null,
    },
    quotesApprovedBy: null,
    approverId: null,
    approvedAt: null,
    publishedAt: null,
    createdBy: input.actorId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(COLLECTIONS.stories).insertOne(doc as any);
  return { ok: true, story: { ...doc, _id: toStringId(result.insertedId) } };
}

export async function editStoryContent(
  db: Db,
  storyId: string,
  content: Partial<AcquisitionStory["content"]>,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(storyId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid story id." };
  }
  const story = await db
    .collection(COLLECTIONS.stories)
    .findOne({ _id: new ObjectId(storyId) });
  if (!story)
    return { ok: false, code: "NOT_FOUND", message: "Story not found." };

  // Editing invalidates any prior approval -- new version, back to draft.
  await db.collection(COLLECTIONS.stories).updateOne(
    { _id: new ObjectId(storyId) },
    {
      $set: {
        content: { ...(story as any).content, ...content },
        state: "draft",
        approverId: null,
        approvedAt: null,
        contentVersion: (Number((story as any).contentVersion) || 1) + 1,
        updatedAt: nowIso(),
      },
    },
  );
  return { ok: true };
}

const NEXT_STATE: Record<StoryState, StoryState | null> = {
  draft: "owner_reviewed",
  owner_reviewed: "approved",
  approved: "published",
  published: null,
};

export type AdvanceStoryInput = {
  storyId: string;
  toState: StoryState;
  approverId?: string;
  quotesApprovedBy?: string | null;
};

export async function advanceStoryState(
  db: Db,
  input: AdvanceStoryInput,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(input.storyId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid story id." };
  }
  const story = await db
    .collection(COLLECTIONS.stories)
    .findOne({ _id: new ObjectId(input.storyId) });
  if (!story)
    return { ok: false, code: "NOT_FOUND", message: "Story not found." };

  const currentState = (story as any).state as StoryState;
  if (NEXT_STATE[currentState] !== input.toState) {
    return {
      ok: false,
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move from ${currentState} to ${input.toState}. Approval states only move forward one step at a time.`,
    };
  }

  if (input.toState === "approved" && !input.approverId) {
    return {
      ok: false,
      code: "APPROVER_REQUIRED",
      message: "An approverId is required to approve a story.",
    };
  }

  const now = nowIso();
  const set: Record<string, unknown> = { state: input.toState, updatedAt: now };
  if (input.toState === "approved") {
    set.approverId = input.approverId;
    set.approvedAt = now;
    if (typeof input.quotesApprovedBy === "string") {
      set.quotesApprovedBy = input.quotesApprovedBy;
    }
  }
  if (input.toState === "published") {
    // Publication is an explicit, distinct action -- approval alone never
    // auto-publishes, and this only ever fires on an already-approved
    // exact content version (the transition table above enforces the
    // approved -> published order).
    set.publishedAt = now;
  }

  await db
    .collection(COLLECTIONS.stories)
    .updateOne({ _id: new ObjectId(input.storyId) }, { $set: set });
  return { ok: true };
}

/** Public-safe story fetch -- only ever returns a story whose state is
 * "published", and only the fields meant for public output (no private
 * sales notes, no personal customer data -- those never entered `content`
 * in the first place). */
export async function getPublishedStoriesForBusiness(
  db: Db,
  businessId: string,
) {
  const rows = await db
    .collection(COLLECTIONS.stories)
    .find({ businessId: s(businessId), state: "published" })
    .sort({ publishedAt: -1 })
    .toArray();
  return rows.map((r: any) => ({
    businessId: r.businessId,
    contentVersion: r.contentVersion,
    content: r.content,
    publishedAt: r.publishedAt,
  }));
}

export async function listStoriesForBusiness(db: Db, businessId: string) {
  const rows = await db
    .collection(COLLECTIONS.stories)
    .find({ businessId: s(businessId) })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map((r: any) => ({ ...r, _id: toStringId(r._id) }));
}
