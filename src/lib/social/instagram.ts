// src/lib/social/instagram.ts
//
// Publishing to the BWE Instagram account through Meta's Instagram API with
// Instagram Login. Called only from an explicit admin action.
//
// The access token starts as the INSTAGRAM_ACCESS_TOKEN environment variable
// (generated in the Meta App Dashboard, valid 60 days). Because a token can
// only be extended by refreshing it, the refreshed copy is kept in the
// database and preferred over the environment value from then on.

import type { Db } from "mongodb";

const GRAPH = "https://graph.instagram.com";
const TOKENS_COLLECTION = "integration_tokens";
const TOKEN_ID = "instagram";
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type StoredToken = {
  _id: string;
  accessToken: string;
  refreshedAt: Date;
};

export class InstagramError extends Error {}

async function readStoredToken(db: Db): Promise<StoredToken | null> {
  return db
    .collection<StoredToken>(TOKENS_COLLECTION)
    .findOne({ _id: TOKEN_ID });
}

export async function isInstagramConfigured(db: Db): Promise<boolean> {
  if (process.env.INSTAGRAM_ACCESS_TOKEN?.trim()) return true;
  return Boolean((await readStoredToken(db))?.accessToken);
}

async function graph(
  path: string,
  token: string,
  init: { method?: "GET" | "POST"; params?: Record<string, string> } = {},
) {
  const params = new URLSearchParams({
    ...(init.params || {}),
    access_token: token,
  });
  const method = init.method || "GET";
  const res =
    method === "GET"
      ? await fetch(`${GRAPH}${path}?${params.toString()}`)
      : await fetch(`${GRAPH}${path}`, { method, body: params });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) {
    throw new InstagramError(
      data?.error?.message || `Instagram request failed (${res.status})`,
    );
  }
  return data as Record<string, any>;
}

// Returns a usable token, refreshing it when the stored copy is more than a
// week old. A failed refresh is not fatal: the current token is still tried.
async function getAccessToken(db: Db): Promise<string> {
  const stored = await readStoredToken(db);
  const token =
    stored?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || "";
  if (!token) {
    throw new InstagramError(
      "Instagram is not connected. Add INSTAGRAM_ACCESS_TOKEN in the site settings.",
    );
  }

  const due =
    !stored || Date.now() - stored.refreshedAt.getTime() > REFRESH_AFTER_MS;
  if (!due) return token;

  try {
    const refreshed = await graph("/refresh_access_token", token, {
      params: { grant_type: "ig_refresh_token" },
    });
    const next = String(refreshed.access_token || token);
    await db
      .collection<StoredToken>(TOKENS_COLLECTION)
      .updateOne(
        { _id: TOKEN_ID },
        { $set: { accessToken: next, refreshedAt: new Date() } },
        { upsert: true },
      );
    return next;
  } catch (error) {
    console.warn("[instagram] token refresh skipped:", error);
    return token;
  }
}

async function waitForContainer(containerId: string, token: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const status = await graph(`/${containerId}`, token, {
      params: { fields: "status_code" },
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new InstagramError(
        `Instagram could not process the image (${status.status_code}).`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new InstagramError("Instagram took too long to process the image.");
}

export async function publishImageToInstagram(
  db: Db,
  args: { imageUrl: string; caption: string },
): Promise<{ mediaId: string; permalink: string; username: string }> {
  const token = await getAccessToken(db);
  const me = await graph("/me", token, {
    params: { fields: "user_id,username" },
  });
  const accountId = String(me.user_id || me.id || "");
  if (!accountId) {
    throw new InstagramError("Could not read the Instagram account id.");
  }

  const container = await graph(`/${accountId}/media`, token, {
    method: "POST",
    params: { image_url: args.imageUrl, caption: args.caption },
  });
  await waitForContainer(String(container.id), token);

  const published = await graph(`/${accountId}/media_publish`, token, {
    method: "POST",
    params: { creation_id: String(container.id) },
  });
  const mediaId = String(published.id);

  let permalink = "";
  try {
    const media = await graph(`/${mediaId}`, token, {
      params: { fields: "permalink" },
    });
    permalink = String(media.permalink || "");
  } catch {
    // The post is live even if its link could not be read back.
  }

  return { mediaId, permalink, username: String(me.username || "") };
}
