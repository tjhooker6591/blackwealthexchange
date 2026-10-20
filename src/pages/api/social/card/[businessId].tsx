// Public Business of the Day image card, as a JPEG at a stable web address.
// Instagram's publishing API only accepts JPEG images it can fetch from a
// public URL, so this renders the same card the admin page draws.

import type { NextApiRequest, NextApiResponse } from "next";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildCard, findListingById } from "@/lib/social/businessOfTheDay";

const WIDTH = 1080;
const HEIGHT = 1350;
const GOLD = "#eab308";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const businessId = String(req.query.businessId || "").replace(
      /\.jpe?g$/i,
      "",
    );
    const client = await clientPromise;
    const listing = await findListingById(
      client.db(getMongoDbName()),
      businessId,
    );
    if (!listing) {
      return res.status(404).json({ ok: false, error: "Business not found" });
    }

    const card = buildCard(listing);
    const meta = [card.location, card.category].filter(Boolean).join("  ·  ");
    const nameSize =
      card.name.length > 34 ? 72 : card.name.length > 20 ? 88 : 104;

    const image = new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0a0a0a",
          padding: 36,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `6px solid ${GOLD}`,
            padding: "88px 54px 70px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: GOLD,
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {card.eyebrow}
            </div>
            <div
              style={{
                display: "flex",
                width: 120,
                height: 6,
                backgroundColor: GOLD,
                marginTop: 22,
              }}
            />
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: nameSize,
                fontWeight: 700,
                lineHeight: 1.1,
                marginTop: 70,
              }}
            >
              {card.name}
            </div>
            {meta ? (
              <div
                style={{
                  display: "flex",
                  color: GOLD,
                  fontSize: 40,
                  fontWeight: 600,
                  marginTop: 34,
                }}
              >
                {meta}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                color: "#d4d4d8",
                fontSize: 44,
                lineHeight: 1.35,
                marginTop: 44,
              }}
            >
              {card.line}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                height: 3,
                backgroundColor: GOLD,
                marginBottom: 28,
              }}
            />
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: 46,
                fontWeight: 700,
              }}
            >
              Black Wealth Exchange
            </div>
            <div
              style={{
                display: "flex",
                color: "#a1a1aa",
                fontSize: 34,
                marginTop: 12,
              }}
            >
              {card.footer}
            </div>
          </div>
        </div>
      </div>,
      { width: WIDTH, height: HEIGHT },
    );

    const png = Buffer.from(await image.arrayBuffer());
    const jpeg = await sharp(png).jpeg({ quality: 90 }).toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, s-maxage=3600, max-age=300");
    return res.status(200).send(jpeg);
  } catch (error) {
    console.error("[social/card]", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
