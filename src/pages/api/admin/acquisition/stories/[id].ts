import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { advanceStoryState, editStoryContent } from "@/lib/acquisition/stories";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const storyId = String(req.query.id || "");
  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (body.action === "edit_content") {
    const result = await editStoryContent(db, storyId, body.content || {});
    return res.status(result.ok ? 200 : 400).json(result);
  }

  if (body.action === "advance_state") {
    const result = await advanceStoryState(db, {
      storyId,
      toState: body.toState,
      approverId: admin.userId || admin.email || "admin",
      quotesApprovedBy: body.quotesApprovedBy,
    });
    return res.status(result.ok ? 200 : 400).json(result);
  }

  return res
    .status(400)
    .json({
      ok: false,
      code: "UNKNOWN_ACTION",
      message: `Unknown action: ${body.action}`,
    });
}
