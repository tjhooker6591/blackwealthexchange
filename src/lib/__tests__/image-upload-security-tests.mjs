import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp/image-upload-security-tests");
await fs.mkdir(tmpDir, { recursive: true });

async function writeFile(name, contents) {
  const filePath = path.join(tmpDir, name);
  await fs.writeFile(filePath, contents, "utf8");
  return filePath;
}

async function writeBinary(name, buffer) {
  const filePath = path.join(tmpDir, name);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function transpileToTmp(sourceRelativePath, targetFilename, replacer) {
  const sourcePath = path.join(repoRoot, sourceRelativePath);
  const targetPath = path.join(tmpDir, targetFilename);
  const source = await fs.readFile(sourcePath, "utf8");
  let transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  if (replacer) {
    transpiled = replacer(transpiled);
  }

  await fs.writeFile(targetPath, transpiled, "utf8");
  return targetPath;
}

await writeFile(
  "env-stub.mjs",
  [
    'export const getJwtSecret = () => "test-secret";',
    'export const getMongoDbName = () => "bwes-cluster";',
    'export const getMarketplaceDbName = () => "marketplace";',
  ].join("\n"),
);

await writeFile(
  "client-stub.mjs",
  [
    "const clientPromise = {",
    "  then(resolve, reject) {",
    "    return Promise.resolve(globalThis.__UPLOAD_TEST_CLIENT_PROMISE__).then(resolve, reject);",
    "  },",
    "  catch(reject) {",
    "    return Promise.resolve(globalThis.__UPLOAD_TEST_CLIENT_PROMISE__).catch(reject);",
    "  },",
    "};",
    "export default clientPromise;",
  ].join("\n"),
);

await writeFile(
  "directory-ownership-stub.mjs",
  [
    "export function buildObjectIdOrStringFilter(key, value) {",
    "  return { [key]: value };",
    "}",
    "export function parseSessionIdentity(req) {",
    "  return globalThis.__UPLOAD_TEST_PARSE_SESSION_IDENTITY__(req);",
    "}",
    "export async function resolveVerifiedOwnership(db, payload) {",
    "  return globalThis.__UPLOAD_TEST_RESOLVE_VERIFIED_OWNERSHIP__(db, payload);",
    "}",
  ].join("\n"),
);

await writeFile(
  "formidable-stub.mjs",
  [
    "export default function formidable(options = {}) {",
    "  return {",
    "    parse(req, callback) {",
    "      return globalThis.__UPLOAD_TEST_PARSE__(options, req, callback);",
    "    },",
    "  };",
    "}",
    "export class IncomingForm {",
    "  constructor(options = {}) {",
    "    this.options = options;",
    "  }",
    "  parse(req, callback) {",
    "    return globalThis.__UPLOAD_TEST_PARSE__(this.options, req, callback);",
    "  }",
    "}",
  ].join("\n"),
);

await transpileToTmp(
  "src/lib/security/imageUploadValidation.ts",
  "image-upload-validation.mjs",
);
await transpileToTmp(
  "src/pages/api/business/media.ts",
  "business-media.mjs",
  (code) =>
    code
      .replace(/from "formidable"/g, 'from "./formidable-stub.mjs"')
      .replace(/from "@\/lib\/mongodb"/g, 'from "./client-stub.mjs"')
      .replace(/from "@\/lib\/env"/g, 'from "./env-stub.mjs"')
      .replace(
        /from "@\/lib\/directoryOwnership"/g,
        'from "./directory-ownership-stub.mjs"',
      )
      .replace(
        /from "@\/lib\/security\/imageUploadValidation"/g,
        'from "./image-upload-validation.mjs"',
      ),
);
await transpileToTmp(
  "src/pages/api/marketplace/add-product.ts",
  "marketplace-add-product.mjs",
  (code) =>
    code
      .replace(/from "formidable"/g, 'from "./formidable-stub.mjs"')
      .replace(/from "@\/lib\/mongodb"/g, 'from "./client-stub.mjs"')
      .replace(/from "@\/lib\/marketplace\/db"/g, 'from "./env-stub.mjs"')
      .replace(/from "@\/lib\/env"/g, 'from "./env-stub.mjs"')
      .replace(
        /from "@\/lib\/security\/imageUploadValidation"/g,
        'from "./image-upload-validation.mjs"',
      ),
);
await transpileToTmp(
  "src/pages/api/profile/avatar.ts",
  "profile-avatar.mjs",
  (code) =>
    code
      .replace(/from "formidable"/g, 'from "./formidable-stub.mjs"')
      .replace(/from "@\/lib\/mongodb"/g, 'from "./client-stub.mjs"')
      .replace(/from "@\/lib\/env"/g, 'from "./env-stub.mjs"')
      .replace(
        /from "@\/lib\/security\/imageUploadValidation"/g,
        'from "./image-upload-validation.mjs"',
      ),
);

const { validateUploadedImageFile } = await import(
  `file://${path.join(tmpDir, "image-upload-validation.mjs")}`
);
const { default: businessMediaHandler } = await import(
  `file://${path.join(tmpDir, "business-media.mjs")}`
);
const { default: marketplaceAddProductHandler } = await import(
  `file://${path.join(tmpDir, "marketplace-add-product.mjs")}`
);
const { default: profileAvatarHandler } = await import(
  `file://${path.join(tmpDir, "profile-avatar.mjs")}`
);

class FakeCollection {
  constructor(docs = []) {
    this.docs = docs.map((doc) => ({ ...doc }));
    this.inserted = [];
    this.updated = [];
  }

  async findOne(query = {}) {
    return this.docs.find((doc) => matches(doc, query)) || null;
  }

  async updateOne(query, update) {
    this.updated.push({ query, update });
    const hit = this.docs.find((doc) => matches(doc, query));
    if (hit && update?.$set) Object.assign(hit, { ...update.$set });
    return { matchedCount: hit ? 1 : 0, modifiedCount: hit ? 1 : 0 };
  }

  async insertOne(doc) {
    const inserted = { ...doc };
    inserted._id ||= `doc-${this.docs.length + this.inserted.length + 1}`;
    this.inserted.push(inserted);
    this.docs.push(inserted);
    return { insertedId: inserted._id };
  }
}

class FakeDb {
  constructor(seed = {}) {
    this.collections = new Map(
      Object.entries(seed).map(([name, docs]) => [
        name,
        new FakeCollection(docs),
      ]),
    );
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new FakeCollection());
    }
    return this.collections.get(name);
  }
}

function matches(doc, query) {
  return Object.entries(query || {}).every(([key, value]) => {
    const left = doc[key];
    if (
      left &&
      value &&
      typeof left === "object" &&
      typeof value === "object" &&
      typeof left.toString === "function" &&
      typeof value.toString === "function"
    ) {
      return left.toString() === value.toString();
    }
    return left === value;
  });
}

function createClient(seedByDbName) {
  return Promise.resolve({
    db(name) {
      return seedByDbName[name];
    },
  });
}

function createJsonResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    },
  };
}

function sessionCookie(payload) {
  const token = jwt.sign(payload, "test-secret");
  return `session_token=${token}`;
}

async function runHandler(handler, req, res) {
  await handler(req, res);
  for (let i = 0; i < 50; i += 1) {
    if (res.body !== undefined) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

async function cleanupUploadedUrl(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return;
  const localPath = path.join(repoRoot, "public", url.replace(/^\//, ""));
  await fs.unlink(localPath).catch(() => {});
}

async function createImageFixtures() {
  const create = sharp({
    create: {
      width: 1,
      height: 1,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  const jpeg = await create.jpeg().toBuffer();
  const png = await create.png().toBuffer();
  const webp = await create.webp().toBuffer();
  const gif = await create.gif().toBuffer();
  const tiff = await create.tiff().toBuffer();
  const unknown = Buffer.from("not-an-image");
  const vips = Buffer.from([0x08, 0xf2, 0xa6, 0xb6, 0, 0, 0, 0]);

  return {
    jpegPath: await writeBinary("valid.jpg", jpeg),
    pngPath: await writeBinary("valid.png", png),
    webpPath: await writeBinary("valid.webp", webp),
    gifPath: await writeBinary("spoofed.gif", gif),
    tiffPath: await writeBinary("spoofed.tiff", tiff),
    vipsPath: await writeBinary("spoofed.v", vips),
    unknownPath: await writeBinary("unknown.bin", unknown),
  };
}

const fixtures = await createImageFixtures();

{
  const result = await validateUploadedImageFile(
    { filepath: fixtures.jpegPath, size: 1024 },
    8 * 1024 * 1024,
  );
  assert.equal(result.ok, true);
  assert.equal(result.detectedType, "jpeg");
  assert.equal(result.canonicalExtension, ".jpg");
}

{
  const result = await validateUploadedImageFile(
    { filepath: fixtures.pngPath, size: 1024 },
    8 * 1024 * 1024,
  );
  assert.equal(result.ok, true);
  assert.equal(result.detectedType, "png");
}

{
  const result = await validateUploadedImageFile(
    { filepath: fixtures.webpPath, size: 1024 },
    8 * 1024 * 1024,
  );
  assert.equal(result.ok, true);
  assert.equal(result.detectedType, "webp");
}

for (const [name, filepath, type] of [
  ["gif", fixtures.gifPath, "gif"],
  ["tiff", fixtures.tiffPath, "tiff"],
  ["vips", fixtures.vipsPath, "vips"],
]) {
  const result = await validateUploadedImageFile(
    { filepath, size: 1024 },
    8 * 1024 * 1024,
  );
  assert.equal(result.ok, false, `${name} should be rejected`);
  assert.equal(result.reason, "unsupported_image_type");
  assert.equal(result.detectedType, type);
}

{
  const result = await validateUploadedImageFile(
    { filepath: fixtures.unknownPath, size: 1024 },
    8 * 1024 * 1024,
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid_image_content");
}

{
  const result = await validateUploadedImageFile(
    { filepath: fixtures.jpegPath, size: 9 * 1024 * 1024 },
    8 * 1024 * 1024,
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, "file_too_large");
}

globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
  callback(null, {}, {});
globalThis.__UPLOAD_TEST_PARSE_SESSION_IDENTITY__ =
  function parseAnonymousSession() {
    return null;
  };
globalThis.__UPLOAD_TEST_RESOLVE_VERIFIED_OWNERSHIP__ =
  async function resolveNoOwnership() {
    return null;
  };

{
  const anonymousRes = createJsonResponse();
  await runHandler(
    businessMediaHandler,
    { method: "POST", headers: {}, query: {} },
    anonymousRes,
  );
  assert.equal(anonymousRes.statusCode, 401);
}

{
  const db = new FakeDb({
    businesses: [{ _id: "biz-1", images: [] }],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE_SESSION_IDENTITY__ =
    function parseBusinessSession() {
      return { userId: "u-1" };
    };
  globalThis.__UPLOAD_TEST_RESOLVE_VERIFIED_OWNERSHIP__ =
    async function resolveForbiddenOwnership() {
      return null;
    };
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      { businessId: "biz-1", slot: "logo" },
      {
        file: {
          filepath: fixtures.jpegPath,
          size: 128,
          mimetype: "image/jpeg",
          originalFilename: "spoofed.gif",
        },
      },
    );

  const forbiddenRes = createJsonResponse();
  await runHandler(
    businessMediaHandler,
    { method: "POST", headers: {}, query: {} },
    forbiddenRes,
  );
  assert.equal(forbiddenRes.statusCode, 403);
}

{
  const db = new FakeDb({
    businesses: [{ _id: "biz-1", images: [] }],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE_SESSION_IDENTITY__ = () => ({ userId: "u-1" });
  globalThis.__UPLOAD_TEST_RESOLVE_VERIFIED_OWNERSHIP__ = async () => ({
    entityId: "biz-1",
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      { businessId: "biz-1", slot: "logo" },
      {
        file: {
          filepath: fixtures.gifPath,
          size: 128,
          mimetype: "image/jpeg",
          originalFilename: "safe.jpg",
        },
      },
    );

  const spoofedRes = createJsonResponse();
  await runHandler(
    businessMediaHandler,
    { method: "POST", headers: {}, query: {} },
    spoofedRes,
  );
  assert.equal(spoofedRes.statusCode, 400);
  assert.equal(spoofedRes.body.error, "unsupported_media_type");
}

{
  const db = new FakeDb({
    businesses: [{ _id: "biz-1", images: [] }],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE_SESSION_IDENTITY__ = () => ({ userId: "u-1" });
  globalThis.__UPLOAD_TEST_RESOLVE_VERIFIED_OWNERSHIP__ = async () => ({
    entityId: "biz-1",
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      { businessId: "biz-1", slot: "logo" },
      {
        file: {
          filepath: fixtures.jpegPath,
          size: 9 * 1024 * 1024,
          mimetype: "image/jpeg",
          originalFilename: "big.jpg",
        },
      },
    );

  const oversizeRes = createJsonResponse();
  await runHandler(
    businessMediaHandler,
    { method: "POST", headers: {}, query: {} },
    oversizeRes,
  );
  assert.equal(oversizeRes.statusCode, 400);
  assert.equal(oversizeRes.body.error, "file_too_large");
}

{
  const db = new FakeDb({
    businesses: [{ _id: "biz-1", images: [] }],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE_SESSION_IDENTITY__ = () => ({ userId: "u-1" });
  globalThis.__UPLOAD_TEST_RESOLVE_VERIFIED_OWNERSHIP__ = async () => ({
    entityId: "biz-1",
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      { businessId: "biz-1", slot: "logo" },
      {
        file: {
          filepath: fixtures.jpegPath,
          size: 128,
          mimetype: "image/gif",
          originalFilename: "mismatch.gif",
        },
      },
    );

  const validRes = createJsonResponse();
  await runHandler(
    businessMediaHandler,
    { method: "POST", headers: {}, query: {} },
    validRes,
  );
  assert.equal(validRes.statusCode, 200);
  assert.match(validRes.body.url, /\.jpg$/);
  await cleanupUploadedUrl(validRes.body.url);
}

{
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    marketplace: new FakeDb({
      sellers: [{ _id: new ObjectId("507f1f77bcf86cd799439011") }],
    }),
  });
  const anonymousRes = createJsonResponse();
  await runHandler(
    marketplaceAddProductHandler,
    { method: "POST", headers: {}, cookies: {} },
    anonymousRes,
  );
  assert.equal(anonymousRes.statusCode, 401);
}

{
  const marketplaceDb = new FakeDb({
    sellers: [{ _id: new ObjectId("507f1f77bcf86cd799439011") }],
    products: [],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    marketplace: marketplaceDb,
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      {
        name: "Safe Product",
        description: "Product description",
        price: "10.00",
        category: "books",
      },
      {
        image: {
          filepath: fixtures.tiffPath,
          size: 128,
          mimetype: "image/jpeg",
          originalFilename: "photo.jpg",
        },
      },
    );

  const spoofedRes = createJsonResponse();
  await runHandler(
    marketplaceAddProductHandler,
    {
      method: "POST",
      headers: {
        cookie: sessionCookie({
          userId: "507f1f77bcf86cd799439011",
          accountType: "seller",
          email: "seller@example.com",
        }),
      },
      cookies: {},
    },
    spoofedRes,
  );
  assert.equal(spoofedRes.statusCode, 400);
  assert.equal(spoofedRes.body.error, "unsupported_media_type");
}

{
  const marketplaceDb = new FakeDb({
    sellers: [{ _id: new ObjectId("507f1f77bcf86cd799439011") }],
    products: [],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    marketplace: marketplaceDb,
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      {
        name: "Safe Product",
        description: "Product description",
        price: "10.00",
        category: "books",
      },
      {
        image: {
          filepath: fixtures.pngPath,
          size: 9 * 1024 * 1024,
          mimetype: "image/png",
          originalFilename: "oversize.png",
        },
      },
    );

  const oversizeRes = createJsonResponse();
  await runHandler(
    marketplaceAddProductHandler,
    {
      method: "POST",
      headers: {
        cookie: sessionCookie({
          userId: "507f1f77bcf86cd799439011",
          accountType: "seller",
          email: "seller@example.com",
        }),
      },
      cookies: {},
    },
    oversizeRes,
  );
  assert.equal(oversizeRes.statusCode, 400);
  assert.equal(oversizeRes.body.error, "file_too_large");
}

{
  const marketplaceDb = new FakeDb({
    sellers: [{ _id: new ObjectId("507f1f77bcf86cd799439011") }],
    products: [],
  });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    marketplace: marketplaceDb,
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      {
        name: "Safe Product",
        description: "Product description",
        price: "10.00",
        category: "books",
      },
      {
        image: {
          filepath: fixtures.pngPath,
          size: 128,
          mimetype: "image/jpeg",
          originalFilename: "safe.gif",
        },
      },
    );

  const validRes = createJsonResponse();
  await runHandler(
    marketplaceAddProductHandler,
    {
      method: "POST",
      headers: {
        cookie: sessionCookie({
          userId: "507f1f77bcf86cd799439011",
          accountType: "seller",
          email: "seller@example.com",
        }),
      },
      cookies: {},
    },
    validRes,
  );
  assert.equal(validRes.statusCode, 201);
  assert.match(validRes.body.product.imageUrl, /\.png$/);
  await cleanupUploadedUrl(validRes.body.product.imageUrl);
}

{
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": new FakeDb({ users: [{ email: "user@example.com" }] }),
  });
  const anonymousRes = createJsonResponse();
  await runHandler(
    profileAvatarHandler,
    { method: "POST", headers: {} },
    anonymousRes,
  );
  assert.equal(anonymousRes.statusCode, 401);
}

{
  const db = new FakeDb({ users: [{ email: "user@example.com" }] });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      {},
      {
        avatar: {
          filepath: fixtures.unknownPath,
          size: 128,
          mimetype: "image/png",
          originalFilename: "avatar.png",
        },
      },
    );

  const spoofedRes = createJsonResponse();
  await runHandler(
    profileAvatarHandler,
    {
      method: "POST",
      headers: {
        cookie: sessionCookie({
          email: "user@example.com",
          accountType: "user",
        }),
      },
    },
    spoofedRes,
  );
  assert.equal(spoofedRes.statusCode, 400);
  assert.equal(spoofedRes.body.error, "unsupported_media_type");
}

{
  const db = new FakeDb({ users: [{ email: "user@example.com" }] });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      {},
      {
        avatar: {
          filepath: fixtures.webpPath,
          size: 6 * 1024 * 1024,
          mimetype: "image/webp",
          originalFilename: "avatar.webp",
        },
      },
    );

  const oversizeRes = createJsonResponse();
  await runHandler(
    profileAvatarHandler,
    {
      method: "POST",
      headers: {
        cookie: sessionCookie({
          email: "user@example.com",
          accountType: "user",
        }),
      },
    },
    oversizeRes,
  );
  assert.equal(oversizeRes.statusCode, 400);
  assert.equal(oversizeRes.body.error, "file_too_large");
}

{
  const db = new FakeDb({ users: [{ email: "user@example.com" }] });
  globalThis.__UPLOAD_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });
  globalThis.__UPLOAD_TEST_PARSE__ = (_options, _req, callback) =>
    callback(
      null,
      {},
      {
        avatar: {
          filepath: fixtures.webpPath,
          size: 128,
          mimetype: "image/jpeg",
          originalFilename: "avatar.jpg",
        },
      },
    );

  const validRes = createJsonResponse();
  await runHandler(
    profileAvatarHandler,
    {
      method: "POST",
      headers: {
        cookie: sessionCookie({
          email: "user@example.com",
          accountType: "user",
        }),
      },
    },
    validRes,
  );
  assert.equal(validRes.statusCode, 200);
  assert.match(validRes.body.avatarUrl, /\.webp$/);
  await cleanupUploadedUrl(validRes.body.avatarUrl);
}

console.log("image-upload-security-tests: ok");
