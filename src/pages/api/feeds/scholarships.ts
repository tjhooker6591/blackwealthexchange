import type { NextApiRequest, NextApiResponse } from "next";

import { getStudentHubRecords } from "@/lib/studentHub/catalog";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const rawLimit = Number(req.query.limit || 6);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 20))
    : 6;

  const items = getStudentHubRecords("scholarships")
    .slice(0, limit)
    .map((record) => ({
      title: record.title,
      link: record.applicationUrl,
      source: record.organization,
      publishedAt: record.lastVerifiedAt || undefined,
      summary: record.statusNote || record.description,
      status: record.status,
    }));

  res.status(200).json({ items });
}
