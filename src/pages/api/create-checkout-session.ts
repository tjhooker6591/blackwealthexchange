import { NextApiRequest, NextApiResponse } from "next";
import stripeCheckoutHandler from "@/pages/api/stripe/checkout";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return stripeCheckoutHandler(req, res);
}
