import type { NextApiRequest, NextApiResponse } from "next";

import { deriveStudentHubLifecycle } from "@/lib/studentHub/lifecycle";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const rawLimit = Number(req.query.limit || 6);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 20))
    : 6;

  const { records } = await getStudentHubResolvedCatalog({
    page: "scholarships",
  });
  const items = records.slice(0, limit).map((record) => ({
    title: record.title,
    link: record.applicationUrl,
    source: record.organization,
    publishedAt: record.lastVerifiedAt || undefined,
    summary: record.statusNote || record.description,
    status: deriveStudentHubLifecycle(record).status,
  }));

  res.status(200).json({ items });
}
