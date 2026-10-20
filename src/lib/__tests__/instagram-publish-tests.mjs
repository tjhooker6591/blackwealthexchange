import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp/instagram-publish-tests");
await fs.mkdir(tmpDir, { recursive: true });

const source = await fs.readFile(
  path.join(repoRoot, "src/lib/social/instagram.ts"),
  "utf8",
);
await fs.writeFile(
  path.join(tmpDir, "instagram.mjs"),
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  "utf8",
);
const { publishImageToInstagram, isInstagramConfigured, InstagramError } =
  await import(`file://${path.join(tmpDir, "instagram.mjs")}`);

function fakeDb(stored = null) {
  const state = { stored };
  return {
    state,
    collection() {
      return {
        async findOne() {
          return state.stored;
        },
        async updateOne(_filter, update) {
          state.stored = { _id: "instagram", ...update.$set };
        },
      };
    },
  };
}

function mockFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const full = String(url);
    const body = init.body ? Object.fromEntries(init.body) : null;
    calls.push({ url: full, method: init.method || "GET", body });
    const route = routes.find((r) => r.match(full, init.method || "GET"));
    const payload = route
      ? route.reply(full, body)
      : { error: { message: "unexpected" } };
    return {
      ok: !payload.error,
      status: payload.error ? 400 : 200,
      async json() {
        return payload;
      },
    };
  };
  return calls;
}

const happyRoutes = [
  {
    match: (u) => u.includes("/refresh_access_token"),
    reply: () => ({ access_token: "refreshed-token" }),
  },
  {
    match: (u) => u.includes("/me?"),
    reply: () => ({ user_id: "1789", username: "blackwealthexchsociety" }),
  },
  {
    match: (u, m) => u.endsWith("/1789/media") && m === "POST",
    reply: () => ({ id: "container-1" }),
  },
  {
    match: (u) => u.includes("/container-1?"),
    reply: () => ({ status_code: "FINISHED" }),
  },
  {
    match: (u, m) => u.endsWith("/1789/media_publish") && m === "POST",
    reply: () => ({ id: "media-9" }),
  },
  {
    match: (u) => u.includes("/media-9?"),
    reply: () => ({ permalink: "https://www.instagram.com/p/abc/" }),
  },
];

// Not connected: no token anywhere.
{
  delete process.env.INSTAGRAM_ACCESS_TOKEN;
  const db = fakeDb();
  assert.equal(await isInstagramConfigured(db), false);
  await assert.rejects(
    publishImageToInstagram(db, { imageUrl: "https://x/y.jpg", caption: "c" }),
    InstagramError,
  );
}

// First publish from the environment token: it is refreshed, stored, and the
// container is created with the image address and caption, then published.
{
  process.env.INSTAGRAM_ACCESS_TOKEN = "env-token";
  const db = fakeDb();
  assert.equal(await isInstagramConfigured(db), true);
  const calls = mockFetch(happyRoutes);
  const result = await publishImageToInstagram(db, {
    imageUrl: "https://www.blackwealthexchange.com/api/social/card/1.jpg",
    caption: "Hello",
  });
  assert.deepEqual(result, {
    mediaId: "media-9",
    permalink: "https://www.instagram.com/p/abc/",
    username: "blackwealthexchsociety",
  });
  assert.equal(db.state.stored.accessToken, "refreshed-token");
  const create = calls.find((c) => c.url.endsWith("/1789/media"));
  assert.equal(
    create.body.image_url,
    "https://www.blackwealthexchange.com/api/social/card/1.jpg",
  );
  assert.equal(create.body.caption, "Hello");
  assert.equal(create.body.access_token, "refreshed-token");
  const publish = calls.find((c) => c.url.endsWith("/1789/media_publish"));
  assert.equal(publish.body.creation_id, "container-1");
}

// A recently refreshed stored token is used as-is, with no refresh call.
{
  const db = fakeDb({
    _id: "instagram",
    accessToken: "stored-token",
    refreshedAt: new Date(),
  });
  const calls = mockFetch(happyRoutes);
  await publishImageToInstagram(db, {
    imageUrl: "https://x/y.jpg",
    caption: "c",
  });
  assert.equal(
    calls.some((c) => c.url.includes("/refresh_access_token")),
    false,
  );
  assert.ok(calls[0].url.includes("access_token=stored-token"));
}

// Instagram's own error message is surfaced.
{
  const db = fakeDb({
    _id: "instagram",
    accessToken: "stored-token",
    refreshedAt: new Date(),
  });
  mockFetch([
    { match: (u) => u.includes("/me?"), reply: () => ({ user_id: "1789" }) },
    {
      match: (u) => u.endsWith("/1789/media"),
      reply: () => ({
        error: { message: "Only photo or video can be accepted" },
      }),
    },
  ]);
  await assert.rejects(
    publishImageToInstagram(db, { imageUrl: "https://x/y.jpg", caption: "c" }),
    /Only photo or video can be accepted/,
  );
}

console.log("instagram-publish-tests: all passed");
