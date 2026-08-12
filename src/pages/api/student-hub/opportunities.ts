import type { NextApiRequest, NextApiResponse } from "next";

import {
  getStudentHubCounts,
  getStudentHubRecords,
  type StudentHubCategoryPage,
} from "@/lib/studentHub/catalog";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const page = typeof req.query.page === "string" ? req.query.page : undefined;
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;

  const records = getStudentHubRecords(
    page as StudentHubCategoryPage | undefined,
  ).filter((record) => (status ? record.status === status : true));

  res.status(200).json({
    records,
    counts: getStudentHubCounts(),
  });
}
