/**
 * Server only. Full Copilot lessons are private Cloudflare Stream videos that
 * play only through a signed link: the lesson page asks Cloudflare for a link
 * that expires after LINK_TTL_SECONDS, and only after the access check passed.
 * A copied link stops working when it expires.
 *
 * Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_TOKEN (a key with the
 * Stream permission only). Without them, or if Cloudflare is unreachable,
 * signedLessonVideo returns null and the page falls back to LESSON_VIDEOS.
 */
import type { IncomingMessage, ServerResponse } from "http";
import { randomBytes } from "crypto";
import type { Db } from "mongodb";
import type { VideoSource } from "./videos";

const PLAYER_HOST = "https://customer-pxer9f2sxsijep1q.cloudflarestream.com";
export const LINK_TTL_SECONDS = 60 * 60;

/** Cloudflare Stream video id for each lesson's full video. */
export const STREAM_LESSONS: Record<number, string> = {
  1: "5eb77e054af5a29724664d425b9649e4",
  2: "fe7490b0b73049cbbf8404fadfe7808c",
  3: "7af8e24f29557bbc29578d927bf0250a",
  4: "be8a36a58c1432d3f17956f76befb947",
  5: "0ee809ead443d57a6c917fff4861a55c",
  6: "02bb7903d84c85af2d4d695ca29fecb9",
  7: "fbe759409de67e59eba9bb1d650aabd4",
  8: "806459ee6d0e98053c7ed3dd2dd540bd",
  9: "9ee34f92ea524db76a17c42922b11e06",
  10: "57bfbcc2343df71de6982f28e564f9fa",
  11: "bd00750794afbb9c8d2b11246c6cd959",
  12: "f34c0461214b7911ca61100fb20540c2",
};

export async function signedLessonVideo(
  lessonNumber: number,
): Promise<VideoSource | null> {
  const uid = STREAM_LESSONS[lessonNumber];
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const key = process.env.CLOUDFLARE_STREAM_TOKEN;
  if (!uid || !account || !key) return null;
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/stream/${uid}/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS,
          downloadable: false,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const d = (await r.json()) as {
      success?: boolean;
      result?: { token?: string };
    };
    const token = d.success ? d.result?.token : null;
    if (!token) {
      console.warn("[copilot-course] Stream link not issued", r.status);
      return null;
    }
    return { kind: "stream", src: `${PLAYER_HOST}/${token}/iframe` };
  } catch (err) {
    console.warn("[copilot-course] Stream link failed", err);
    return null;
  }
}

/**
 * One device at a time per account. Each browser gets a random device id in a
 * cookie; the account's current device is stored in DEVICE_COLLECTION. Another
 * device is told the course is open elsewhere and can take over with one
 * click, which ends the first device's playback when its link expires.
 */
export const DEVICE_COLLECTION = "ai_course_devices";
const DEVICE_COOKIE = "bwe_course_device";
const ACTIVE_MS = LINK_TTL_SECONDS * 1000;

function deviceIdFrom(req: IncomingMessage, res: ServerResponse): string {
  const m = String(req.headers.cookie || "").match(
    new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE}=([a-f0-9]{32})`),
  );
  if (m) return m[1];
  const id = randomBytes(16).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `${DEVICE_COOKIE}=${id}; Path=/courses; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`,
  );
  return id;
}

/** Returns true when this device may play; claims the account if free. */
export async function claimCourseDevice(
  db: Db,
  userId: string,
  req: IncomingMessage,
  res: ServerResponse,
  takeOver: boolean,
): Promise<boolean> {
  const deviceId = deviceIdFrom(req, res);
  const col = db.collection<{
    _id: string;
    deviceId: string;
    lastSeen: Date;
  }>(DEVICE_COLLECTION);
  const now = new Date();
  const current = await col.findOne({ _id: userId });
  const free =
    !current ||
    current.deviceId === deviceId ||
    now.getTime() - current.lastSeen.getTime() > ACTIVE_MS;
  if (!free && !takeOver) return false;
  await col.updateOne(
    { _id: userId },
    { $set: { deviceId, lastSeen: now } },
    { upsert: true },
  );
  return true;
}
