import type { NextApiRequest, NextApiResponse } from "next";

import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  type StudentHubAttendanceMode,
  type StudentHubCategoryPage,
  type StudentHubEligibilityType,
  type StudentHubOpportunityType,
  type StudentHubStatus,
  type StudentHubStudentLevel,
} from "@/lib/studentHub/catalog";
import {
  getLegacyStudentHubReconciliation,
  getLegacyStudentHubSummary,
} from "@/lib/studentHub/legacy";
import {
  deriveStudentHubLifecycle,
  getStudentHubStatusLabel,
} from "@/lib/studentHub/lifecycle";
import {
  archiveStudentHubRecord,
  createStudentHubRecord,
  getStudentHubResolvedCatalog,
  markStudentHubRecordVerified,
  seedStudentHubBaseline,
  STUDENT_HUB_COLLECTION,
  updateStudentHubRecord,
} from "@/lib/studentHub/repository";

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned ? cleaned : null;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function parseWritePayload(body: any) {
  return {
    id: cleanString(body?.id),
    title: cleanString(body?.title),
    organization: cleanString(body?.organization),
    opportunityType: cleanString(
      body?.opportunityType,
    ) as StudentHubOpportunityType,
    categoryPages: parseStringArray(
      body?.categoryPages,
    ) as StudentHubCategoryPage[],
    description: cleanString(body?.description),
    eligibilitySummary: cleanString(body?.eligibilitySummary),
    eligibilityType: cleanString(
      body?.eligibilityType,
    ) as StudentHubEligibilityType,
    targetAudience: cleanNullableString(body?.targetAudience),
    institutionRelationship: cleanNullableString(
      body?.institutionRelationship,
    ) as any,
    discipline: cleanNullableString(body?.discipline),
    studentLevel: cleanString(body?.studentLevel) as StudentHubStudentLevel,
    location: cleanNullableString(body?.location),
    attendanceMode: cleanString(
      body?.attendanceMode,
    ) as StudentHubAttendanceMode,
    opensAt: cleanNullableString(body?.opensAt),
    deadline: cleanNullableString(body?.deadline),
    startsAt: cleanNullableString(body?.startsAt),
    endsAt: cleanNullableString(body?.endsAt),
    status: cleanString(body?.status) as StudentHubStatus,
    source: cleanString(body?.source),
    sourceUrl: cleanString(body?.sourceUrl),
    applicationUrl: cleanString(body?.applicationUrl),
    lastVerifiedAt: cleanNullableString(body?.lastVerifiedAt),
    lastCheckedAt: cleanNullableString(body?.lastCheckedAt),
    nextReviewAt: cleanNullableString(body?.nextReviewAt),
    featured: parseBoolean(body?.featured, false),
    tags: parseStringArray(body?.tags),
    statusNote: cleanNullableString(body?.statusNote),
    howToApply: parseStringArray(body?.howToApply),
    duplicateGroup: cleanNullableString(body?.duplicateGroup),
    sourceVerified: parseBoolean(body?.sourceVerified, false),
    applicationUrlVerified: parseBoolean(body?.applicationUrlVerified, false),
    brokenLink: parseBoolean(body?.brokenLink, false),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!["GET", "POST", "PATCH"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  if (req.method === "POST") {
    const action = cleanString(req.body?.action);

    if (action === "seed_baseline") {
      const result = await seedStudentHubBaseline(db, admin.email);
      return res.status(200).json({
        ok: true,
        action,
        collection: STUDENT_HUB_COLLECTION,
        ...result,
      });
    }

    if (action === "mark_verified") {
      const id = cleanString(req.body?.id);
      const record = await markStudentHubRecordVerified(db, id, admin.email);
      return res.status(200).json({ ok: true, action, record });
    }

    const payload = parseWritePayload(req.body);
    const record = await createStudentHubRecord(db, payload, admin.email);
    return res.status(200).json({ ok: true, action: "create", record });
  }

  if (req.method === "PATCH") {
    const action = cleanString(req.body?.action);
    const id = cleanString(req.body?.id);
    if (!id) {
      return res.status(400).json({ error: "Record id is required." });
    }

    if (action === "archive") {
      const record = await archiveStudentHubRecord(db, id, admin.email);
      return res.status(200).json({ ok: true, action, record });
    }

    if (action === "mark_verified") {
      const record = await markStudentHubRecordVerified(db, id, admin.email);
      return res.status(200).json({ ok: true, action, record });
    }

    const payload = parseWritePayload(req.body);
    const record = await updateStudentHubRecord(db, id, payload, admin.email);
    return res.status(200).json({ ok: true, action: "update", record });
  }

  const page = typeof req.query.page === "string" ? req.query.page : undefined;
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const review =
    typeof req.query.review === "string" ? req.query.review : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const legacyReconciliation = getLegacyStudentHubReconciliation();
  const legacyPagesByCanonicalId = legacyReconciliation.reduce(
    (acc, record) => {
      const pages = acc.get(record.canonicalId) || new Set<string>();
      pages.add(record.legacySourcePage);
      acc.set(record.canonicalId, pages);
      return acc;
    },
    new Map<string, Set<string>>(),
  );

  const { records: sourceRecords, storage } =
    await getStudentHubResolvedCatalog({
      db,
      page: page as StudentHubCategoryPage | undefined,
      includeArchived: true,
    });

  const records = sourceRecords
    .map((record) => {
      const lifecycle = deriveStudentHubLifecycle(record);
      return {
        ...record,
        derivedStatus: lifecycle.status,
        statusLabel: getStudentHubStatusLabel(lifecycle.status),
        current: lifecycle.current,
        upcoming: lifecycle.upcoming,
        closed: lifecycle.closed,
        stale: lifecycle.stale,
        daysUntilDeadline: lifecycle.daysUntilDeadline,
        legacySourcePages: Array.from(
          legacyPagesByCanonicalId.get(record.id) || [],
        ).sort(),
      };
    })
    .filter((record) => (status ? record.derivedStatus === status : true))
    .filter((record) => {
      if (review === "stale") return record.stale;
      if (review === "broken") return Boolean(record.brokenLink);
      if (review === "duplicates") return Boolean(record.duplicateGroup);
      if (review === "needs_review") {
        return record.derivedStatus === "needs_review";
      }
      return true;
    })
    .filter((record) => {
      if (!q) return true;
      return [
        record.title,
        record.organization,
        record.description,
        record.eligibilitySummary,
        record.sourceUrl,
        record.applicationUrl,
        ...(record.tags || []),
      ].some((field) => includesQuery(field || "", q));
    });

  const { records: allRecords } = await getStudentHubResolvedCatalog({
    db,
    includeArchived: true,
  });

  const counts = allRecords.reduce(
    (acc, record) => {
      const lifecycle = deriveStudentHubLifecycle(record);
      acc.total += 1;
      acc[lifecycle.status] += 1;
      if (lifecycle.stale) acc.stale += 1;
      if (record.brokenLink) acc.brokenLinks += 1;
      if (record.duplicateGroup) acc.duplicateGroups.add(record.duplicateGroup);
      return acc;
    },
    {
      total: 0,
      open: 0,
      upcoming: 0,
      closing_soon: 0,
      closed: 0,
      needs_review: 0,
      stale: 0,
      brokenLinks: 0,
      duplicateGroups: new Set<string>(),
    },
  );

  return res.status(200).json({
    records,
    counts: {
      total: counts.total,
      open: counts.open,
      upcoming: counts.upcoming,
      closingSoon: counts.closing_soon,
      closed: counts.closed,
      needsReview: counts.needs_review,
      stale: counts.stale,
      brokenLinks: counts.brokenLinks,
      duplicateGroups: counts.duplicateGroups.size,
    },
    legacySummary: getLegacyStudentHubSummary(),
    adminEmail: admin.email || null,
    storage,
  });
}
