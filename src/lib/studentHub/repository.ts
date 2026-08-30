import type { Db } from "mongodb";

import clientPromise from "@/lib/mongodb";
import {
  studentHubCatalog,
  type StudentHubAttendanceMode,
  type StudentHubCategoryPage,
  type StudentHubEligibilityType,
  type StudentHubInstitutionRelationship,
  type StudentHubOpportunityType,
  type StudentHubRecord,
  type StudentHubStatus,
  type StudentHubStudentLevel,
} from "@/lib/studentHub/catalog";

export const STUDENT_HUB_COLLECTION = "studentHubOpportunities";

export type StudentHubStoredRecord = StudentHubRecord & {
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type StudentHubResolvedCatalog = {
  records: StudentHubStoredRecord[];
  storage: {
    mode: "baseline_catalog" | "database";
    collection: string;
    seeded: boolean;
  };
};

export type StudentHubWriteInput = Partial<StudentHubStoredRecord> & {
  title: string;
  organization: string;
  opportunityType: StudentHubOpportunityType;
  categoryPages: StudentHubCategoryPage[];
  description: string;
  eligibilitySummary: string;
  eligibilityType: StudentHubEligibilityType;
  studentLevel: StudentHubStudentLevel;
  attendanceMode: StudentHubAttendanceMode;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  status: StudentHubStatus;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned ? cleaned : null;
}

function cleanArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => cleanString(entry)).filter(Boolean);
}

function uniqueArray<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function normalizeStudentHubRecord(
  input: StudentHubStoredRecord,
): StudentHubStoredRecord {
  return {
    ...input,
    id: cleanString(input.id),
    title: cleanString(input.title),
    organization: cleanString(input.organization),
    categoryPages: uniqueArray(input.categoryPages || []),
    description: cleanString(input.description),
    eligibilitySummary: cleanString(input.eligibilitySummary),
    targetAudience: cleanNullableString(input.targetAudience),
    institutionRelationship:
      input.institutionRelationship ||
      ("none" as StudentHubInstitutionRelationship),
    discipline: cleanNullableString(input.discipline),
    location: cleanNullableString(input.location),
    opensAt: cleanNullableString(input.opensAt),
    deadline: cleanNullableString(input.deadline),
    startsAt: cleanNullableString(input.startsAt),
    endsAt: cleanNullableString(input.endsAt),
    source: cleanString(input.source),
    sourceUrl: cleanString(input.sourceUrl),
    applicationUrl: cleanString(input.applicationUrl),
    lastVerifiedAt: cleanNullableString(input.lastVerifiedAt),
    lastCheckedAt: cleanNullableString(input.lastCheckedAt),
    nextReviewAt: cleanNullableString(input.nextReviewAt),
    createdAt: cleanString(input.createdAt),
    updatedAt: cleanString(input.updatedAt),
    tags: cleanArray(input.tags),
    statusNote: cleanNullableString(input.statusNote),
    howToApply: cleanArray(input.howToApply),
    duplicateGroup: cleanNullableString(input.duplicateGroup),
    archivedAt: cleanNullableString(input.archivedAt),
    createdBy: cleanNullableString(input.createdBy),
    updatedBy: cleanNullableString(input.updatedBy),
  };
}

export function buildStudentHubRecordFromInput(
  input: StudentHubWriteInput,
  adminEmail?: string | null,
  existing?: StudentHubStoredRecord | null,
): StudentHubStoredRecord {
  const now = new Date().toISOString();
  const fallbackId = `${slugify(input.title || existing?.title || "student-hub-record")}-${Date.now()}`;

  const record: StudentHubStoredRecord = normalizeStudentHubRecord({
    id: cleanString(existing?.id || input.id) || fallbackId,
    title: input.title,
    organization: input.organization,
    opportunityType: input.opportunityType,
    categoryPages: input.categoryPages,
    description: input.description,
    eligibilitySummary: input.eligibilitySummary,
    eligibilityType: input.eligibilityType,
    targetAudience: input.targetAudience ?? null,
    institutionRelationship: input.institutionRelationship ?? "none",
    discipline: input.discipline ?? null,
    studentLevel: input.studentLevel,
    location: input.location ?? null,
    attendanceMode: input.attendanceMode,
    opensAt: input.opensAt ?? null,
    deadline: input.deadline ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    status: input.status,
    source: input.source,
    sourceUrl: input.sourceUrl,
    applicationUrl: input.applicationUrl,
    lastVerifiedAt: input.lastVerifiedAt ?? existing?.lastVerifiedAt ?? null,
    lastCheckedAt: input.lastCheckedAt ?? existing?.lastCheckedAt ?? null,
    nextReviewAt: input.nextReviewAt ?? existing?.nextReviewAt ?? null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    featured: input.featured ?? existing?.featured ?? false,
    tags: input.tags ?? existing?.tags ?? [],
    statusNote: input.statusNote ?? existing?.statusNote ?? null,
    howToApply: input.howToApply ?? existing?.howToApply ?? [],
    duplicateGroup: input.duplicateGroup ?? existing?.duplicateGroup ?? null,
    sourceVerified: input.sourceVerified ?? existing?.sourceVerified ?? false,
    applicationUrlVerified:
      input.applicationUrlVerified ?? existing?.applicationUrlVerified ?? false,
    brokenLink: input.brokenLink ?? existing?.brokenLink ?? false,
    archivedAt: input.archivedAt ?? existing?.archivedAt ?? null,
    createdBy: existing?.createdBy ?? adminEmail ?? null,
    updatedBy: adminEmail ?? existing?.updatedBy ?? null,
  });

  return record;
}

export function sortStudentHubRecords(records: StudentHubStoredRecord[]) {
  return [...records].sort((a, b) => {
    const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featured !== 0) return featured;
    return a.title.localeCompare(b.title);
  });
}

async function getDbOrNull(explicitDb?: Db | null) {
  if (explicitDb) return explicitDb;
  try {
    const client = await clientPromise;
    return client.db("bwes-cluster");
  } catch {
    return null;
  }
}

export async function getStudentHubResolvedCatalog(
  options: {
    db?: Db | null;
    page?: StudentHubCategoryPage;
    includeArchived?: boolean;
  } = {},
): Promise<StudentHubResolvedCatalog> {
  const db = await getDbOrNull(options.db);

  if (db) {
    const docs = await db
      .collection<StudentHubStoredRecord>(STUDENT_HUB_COLLECTION)
      .find(options.includeArchived ? {} : { archivedAt: null })
      .toArray()
      .catch(() => []);

    if (docs.length > 0) {
      const normalized = docs
        .map((doc) => normalizeStudentHubRecord(doc))
        .filter((record) =>
          options.page ? record.categoryPages.includes(options.page) : true,
        );

      return {
        records: sortStudentHubRecords(normalized),
        storage: {
          mode: "database",
          collection: STUDENT_HUB_COLLECTION,
          seeded: true,
        },
      };
    }
  }

  const baseline = studentHubCatalog
    .map((record) =>
      normalizeStudentHubRecord({
        ...record,
        archivedAt: null,
        createdBy: null,
        updatedBy: null,
      }),
    )
    .filter((record) =>
      options.page ? record.categoryPages.includes(options.page) : true,
    );

  return {
    records: sortStudentHubRecords(baseline),
    storage: {
      mode: "baseline_catalog",
      collection: STUDENT_HUB_COLLECTION,
      seeded: false,
    },
  };
}

export async function seedStudentHubBaseline(
  db: Db,
  adminEmail?: string | null,
) {
  const collection = db.collection<StudentHubStoredRecord>(
    STUDENT_HUB_COLLECTION,
  );
  const count = await collection.countDocuments({});
  if (count > 0) {
    return { inserted: 0, alreadySeeded: true };
  }

  const docs = studentHubCatalog.map((record) =>
    normalizeStudentHubRecord({
      ...record,
      archivedAt: null,
      createdBy: adminEmail ?? null,
      updatedBy: adminEmail ?? null,
    }),
  );

  await collection.insertMany(docs);
  return { inserted: docs.length, alreadySeeded: false };
}

async function ensureStudentHubBaseline(db: Db, adminEmail?: string | null) {
  const collection = db.collection<StudentHubStoredRecord>(
    STUDENT_HUB_COLLECTION,
  );
  const count = await collection.countDocuments({});
  if (count > 0) {
    return { seeded: false };
  }

  await seedStudentHubBaseline(db, adminEmail);
  return { seeded: true };
}

export async function createStudentHubRecord(
  db: Db,
  input: StudentHubWriteInput,
  adminEmail?: string | null,
) {
  await ensureStudentHubBaseline(db, adminEmail);
  const collection = db.collection<StudentHubStoredRecord>(
    STUDENT_HUB_COLLECTION,
  );
  const record = buildStudentHubRecordFromInput(input, adminEmail);
  await collection.insertOne(record);
  return record;
}

export async function updateStudentHubRecord(
  db: Db,
  id: string,
  input: Partial<StudentHubWriteInput> & {
    archivedAt?: string | null;
    lastVerifiedAt?: string | null;
    lastCheckedAt?: string | null;
    nextReviewAt?: string | null;
    sourceVerified?: boolean;
    applicationUrlVerified?: boolean;
    brokenLink?: boolean;
    statusNote?: string | null;
    tags?: string[];
    howToApply?: string[];
    duplicateGroup?: string | null;
    featured?: boolean;
  },
  adminEmail?: string | null,
) {
  await ensureStudentHubBaseline(db, adminEmail);
  const collection = db.collection<StudentHubStoredRecord>(
    STUDENT_HUB_COLLECTION,
  );
  const existing = await collection.findOne({ id });
  if (!existing) {
    throw new Error(`Student Hub record not found: ${id}`);
  }

  const record = buildStudentHubRecordFromInput(
    {
      ...existing,
      ...input,
      title: input.title ?? existing.title,
      organization: input.organization ?? existing.organization,
      opportunityType: input.opportunityType ?? existing.opportunityType,
      categoryPages: input.categoryPages ?? existing.categoryPages,
      description: input.description ?? existing.description,
      eligibilitySummary:
        input.eligibilitySummary ?? existing.eligibilitySummary,
      eligibilityType: input.eligibilityType ?? existing.eligibilityType,
      studentLevel: input.studentLevel ?? existing.studentLevel,
      attendanceMode: input.attendanceMode ?? existing.attendanceMode,
      source: input.source ?? existing.source,
      sourceUrl: input.sourceUrl ?? existing.sourceUrl,
      applicationUrl: input.applicationUrl ?? existing.applicationUrl,
      status: input.status ?? existing.status,
    },
    adminEmail,
    existing,
  );

  await collection.updateOne({ id }, { $set: record });
  return record;
}

export async function archiveStudentHubRecord(
  db: Db,
  id: string,
  adminEmail?: string | null,
) {
  return updateStudentHubRecord(
    db,
    id,
    {
      status: "closed",
      archivedAt: new Date().toISOString(),
    },
    adminEmail,
  );
}

export async function markStudentHubRecordVerified(
  db: Db,
  id: string,
  adminEmail?: string | null,
) {
  const today = new Date().toISOString().slice(0, 10);
  return updateStudentHubRecord(
    db,
    id,
    {
      lastVerifiedAt: today,
      lastCheckedAt: today,
      sourceVerified: true,
      applicationUrlVerified: true,
    },
    adminEmail,
  );
}
