import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      id,
      message: "Saved Travel Map place delete scaffold is active.",
    });
  }

  res.setHeader("Allow", ["DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
