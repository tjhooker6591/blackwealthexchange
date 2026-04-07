import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    ok: true,
    placeholder: true,
    message:
      "Nearby Travel Map route scaffold is active. Geospatial query logic not connected yet.",
    items: [],
  });
}
