import type { NextApiRequest, NextApiResponse } from "next";

import { getStudentHubRecords } from "@/lib/studentHub/catalog";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const rawLimit = Number(req.query.limit || 8);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 50))
    : 8;

  const records = getStudentHubRecords("hub")
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, limit)
    .map((record) => ({
      id: record.id,
      title: record.title,
      org: record.organization,
      type: record.opportunityType,
      level: record.studentLevel,
      mode: record.attendanceMode,
      note: record.statusNote || record.description,
      href: record.applicationUrl,
      status: record.status,
      sourceUrl: record.sourceUrl,
    }));

  res.status(200).json(records);
}
