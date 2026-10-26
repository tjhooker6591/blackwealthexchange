import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { unsubscribeEmail } from "@/lib/inquiries/service";

// One-click unsubscribe from the link in inquiry replies. Adds the address
// to the do-not-email list every BWE email check uses.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const db = (await clientPromise).db(getMongoDbName());
  const ok = await unsubscribeEmail(
    db,
    String(req.query.e || ""),
    String(req.query.t || ""),
    String(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ""),
  );
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res
    .status(ok ? 200 : 400)
    .send(
      `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Black Wealth Exchange</title><div style="font-family:Arial,sans-serif;max-width:480px;margin:60px auto;padding:0 16px;line-height:1.6"><h1 style="font-size:22px">${ok ? "You're unsubscribed" : "That link didn't work"}</h1><p>${ok ? "Black Wealth Exchange won't send you emails like this again." : "Please reply to the email with the word unsubscribe and we'll take care of it."}</p><p><a href="https://www.blackwealthexchange.com">Back to Black Wealth Exchange</a></p></div>`,
    );
}
