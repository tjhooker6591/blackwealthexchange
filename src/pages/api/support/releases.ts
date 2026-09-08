import { releaseMeta, releaseSections } from "@/lib/support/releases";

const staticReleasePayload: {
  ok: true;
  source: "static";
  generatedAt: string;
  releaseTitle: string;
  releaseId: string;
  publishedDate: string;
  lastUpdated: string;
  status: typeof releaseMeta.status;
  items: typeof releaseSections;
} = {
  ok: true,
  source: "static",
  generatedAt: new Date().toISOString(),
  ...releaseMeta,
  items: releaseSections,
};

const err = (res: any, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });

export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }

  return res.status(200).json(staticReleasePayload);
}
