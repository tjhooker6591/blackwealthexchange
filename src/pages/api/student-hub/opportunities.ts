import type { NextApiRequest, NextApiResponse } from "next";

import { type StudentHubCategoryPage } from "@/lib/studentHub/catalog";
import {
  deriveStudentHubLifecycle,
  getStudentHubStatusLabel,
} from "@/lib/studentHub/lifecycle";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const page = typeof req.query.page === "string" ? req.query.page : undefined;
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;

  const { records: sourceRecords, storage } =
    await getStudentHubResolvedCatalog({
      page: page as StudentHubCategoryPage | undefined,
    });

  const allRecords = sourceRecords.map((record) => {
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
    };
  });

  const records = allRecords.filter((record) =>
    status ? record.derivedStatus === status : true,
  );

  const counts = allRecords.reduce(
    (acc, record) => {
      acc.total += 1;
      acc[record.derivedStatus] += 1;
      if (record.stale) acc.stale += 1;
      if (record.brokenLink) acc.brokenLinks += 1;
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
    },
  );

  res.status(200).json({
    records,
    counts,
    storage,
  });
}
