import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Saved Travel Map places list scaffold is active.",
      items: [],
    });
  }

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Saved Travel Map place create scaffold is active.",
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res
    .status(405)
    .json({ ok: false, message: `Method ${req.method} not allowed.` });
}
