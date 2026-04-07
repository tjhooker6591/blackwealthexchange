import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  return res.status(200).json({
    ok: true,
    placeholder: true,
    id,
    message: "Travel Map business detail route scaffold is active. Business lookup logic not connected yet.",
  });
}
