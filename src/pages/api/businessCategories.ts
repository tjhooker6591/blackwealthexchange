import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const TOP_CATEGORIES = [
    "Beauty",
    "Food",
    "Health & Wellness",
    "Apparel",
    "Professional Services"
  ];

  // Optionally, include "All" at the top
  res.status(200).json(["All", ...TOP_CATEGORIES]);
}

