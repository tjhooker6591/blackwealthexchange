import type { NextApiRequest, NextApiResponse } from "next";

import { getStudentHubRecords } from "@/lib/studentHub/catalog";
import {
  getLegacyStudentHubReconciliation,
  getLegacyStudentHubSummary,
} from "@/lib/studentHub/legacy";
import {
  deriveStudentHubLifecycle,
  getStudentHubStatusLabel,
} from "@/lib/studentHub/lifecycle";
import { requireAdminFromRequest } from "@/lib/adminAuth";

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

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

  const records = getStudentHubRecords(page as any)
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
      if (review === "needs_review")
        return record.derivedStatus === "needs_review";
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

  const counts = getStudentHubRecords().reduce(
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
  });
}
