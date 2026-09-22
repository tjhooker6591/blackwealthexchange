import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp/legacy-write-route-security-tests");
await fs.mkdir(tmpDir, { recursive: true });

async function writeFile(name, contents) {
  const filePath = path.join(tmpDir, name);
  await fs.writeFile(filePath, contents, "utf8");
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
    "    return Promise.resolve(globalThis.__LEGACY_TEST_CLIENT_PROMISE__).then(resolve, reject);",
    "  },",
    "  catch(reject) {",
    "    return Promise.resolve(globalThis.__LEGACY_TEST_CLIENT_PROMISE__).catch(reject);",
    "  },",
    "};",
    "export default clientPromise;",
  ].join("\n"),
);
await writeFile(
  "seller-session-stub.mjs",
  [
    "export async function resolveSellerSession(req, db) {",
    "  return globalThis.__LEGACY_TEST_RESOLVE_SELLER_SESSION__(req, db);",
    "}",
  ].join("\n"),
);

await transpileToTmp(
  "src/pages/api/messages/send.ts",
  "messages-send.mjs",
  (code) =>
    code
      .replace(
        /import clientPromise from "\.\.\/\.\.\/\.\.\/lib\/mongodb";/,
        'import clientPromise from "./client-stub.mjs";',
      )
      .replace(/from "@\/lib\/env"/g, 'from "./env-stub.mjs"'),
);
await transpileToTmp(
  "src/pages/api/certificates/generate.ts",
  "certificates-generate.mjs",
  (code) =>
    code
      .replace(
        /import clientPromise from "\.\.\/\.\.\/\.\.\/lib\/mongodb";/,
        'import clientPromise from "./client-stub.mjs";',
      )
      .replace(/from "@\/lib\/env"/g, 'from "./env-stub.mjs"'),
);
await transpileToTmp(
  "src/pages/api/marketplace/create.ts",
  "marketplace-create.mjs",
  (code) =>
    code
      .replace(
        /import clientPromise from "@\/lib\/mongodb";/,
        'import clientPromise from "./client-stub.mjs";',
      )
      .replace(/from "@\/lib\/marketplace\/db"/g, 'from "./env-stub.mjs"')
      .replace(
        /from "@\/lib\/marketplace\/sellerSession"/g,
        'from "./seller-session-stub.mjs"',
      ),
);
await transpileToTmp("src/pages/api/courses/enroll.ts", "courses-enroll.mjs");
await transpileToTmp("src/pages/api/savedjobs/add.ts", "savedjobs-add.mjs");
await transpileToTmp("src/pages/api/support/create.ts", "support-create.mjs");

const { default: messagesSendHandler } = await import(
  `file://${path.join(tmpDir, "messages-send.mjs")}`
);
const { default: certificatesGenerateHandler } = await import(
  `file://${path.join(tmpDir, "certificates-generate.mjs")}`
);
const { default: marketplaceCreateHandler } = await import(
  `file://${path.join(tmpDir, "marketplace-create.mjs")}`
);
const { default: coursesEnrollHandler } = await import(
  `file://${path.join(tmpDir, "courses-enroll.mjs")}`
);
const { default: savedJobsAddHandler } = await import(
  `file://${path.join(tmpDir, "savedjobs-add.mjs")}`
);
const { default: supportCreateHandler } = await import(
  `file://${path.join(tmpDir, "support-create.mjs")}`
);

class FakeCollection {
  constructor(docs = []) {
    this.docs = docs.map((doc) => structuredClone(doc));
  }

  async findOne(query = {}) {
    return this.docs.find((doc) => matches(doc, query)) || null;
  }

  async insertOne(doc) {
    const inserted = structuredClone(doc);
    inserted._id ||= `doc-${this.docs.length + 1}`;
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
  if (!query || Object.keys(query).length === 0) return true;
  if (Array.isArray(query.$or)) {
    return query.$or.some((subQuery) => matches(doc, subQuery));
  }

  return Object.entries(query).every(([key, value]) => {
    if (key === "$or") return true;
    return doc[key] === value;
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

{
  const db = new FakeDb();
  globalThis.__LEGACY_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });

  const anonymousRes = createJsonResponse();
  await messagesSendHandler(
    {
      method: "POST",
      body: JSON.stringify({ receiverId: "user-b", message: "Hello" }),
      headers: {},
      cookies: {},
    },
    anonymousRes,
  );
  assert.equal(anonymousRes.statusCode, 401);

  const crossUserRes = createJsonResponse();
  await messagesSendHandler(
    {
      method: "POST",
      body: JSON.stringify({
        senderId: "user-b",
        receiverId: "user-b",
        message: "Spoofed",
      }),
      headers: { cookie: sessionCookie({ userId: "user-a" }) },
      cookies: {},
    },
    crossUserRes,
  );
  assert.equal(crossUserRes.statusCode, 403);

  const validRes = createJsonResponse();
  await messagesSendHandler(
    {
      method: "POST",
      body: JSON.stringify({
        senderId: "user-a",
        receiverId: "user-b",
        message: "Legit message",
      }),
      headers: { cookie: sessionCookie({ userId: "user-a" }) },
      cookies: {},
    },
    validRes,
  );
  assert.equal(validRes.statusCode, 200);
  const insertedMessage = db.collection("messages").docs[0];
  assert.equal(insertedMessage.senderId, "user-a");
  assert.equal(insertedMessage.receiverId, "user-b");
}

{
  const db = new FakeDb();
  globalThis.__LEGACY_TEST_CLIENT_PROMISE__ = createClient({
    marketplace: db,
  });
  globalThis.__LEGACY_TEST_RESOLVE_SELLER_SESSION__ = async () => ({
    ok: false,
    status: 401,
    error: "Unauthorized",
  });

  const anonymousRes = createJsonResponse();
  await marketplaceCreateHandler(
    {
      method: "POST",
      body: {
        name: "Test Product",
        description: "Desc",
        price: 49,
        category: "Books",
        imageUrl: "/placeholder.png",
      },
      headers: {},
    },
    anonymousRes,
  );
  assert.equal(anonymousRes.statusCode, 401);

  globalThis.__LEGACY_TEST_RESOLVE_SELLER_SESSION__ = async () => ({
    ok: true,
    sellerId: "seller-a",
    userId: "user-a",
    email: "seller@example.com",
  });

  const spoofedRes = createJsonResponse();
  await marketplaceCreateHandler(
    {
      method: "POST",
      body: {
        name: "Test Product",
        description: "Desc",
        price: 49,
        category: "Books",
        imageUrl: "/placeholder.png",
        sellerId: "seller-b",
      },
      headers: {},
    },
    spoofedRes,
  );
  assert.equal(spoofedRes.statusCode, 403);

  const validRes = createJsonResponse();
  await marketplaceCreateHandler(
    {
      method: "POST",
      body: {
        name: "Test Product",
        description: "Desc",
        price: 49,
        category: "Books",
        imageUrl: "/placeholder.png",
      },
      headers: {},
    },
    validRes,
  );
  assert.equal(validRes.statusCode, 201);
  const insertedProduct = db.collection("products").docs[0];
  assert.equal(insertedProduct.sellerId, "seller-a");
}

{
  const db = new FakeDb({
    users: [{ _id: "user-a", email: "user-a@example.com" }],
    courses: [{ _id: "course-1", title: "Course 1" }],
    enrollments: [
      {
        userId: "user-a",
        courseId: "course-1",
        entitlementStatus: "granted",
        completed: true,
      },
    ],
    certificates: [],
  });
  globalThis.__LEGACY_TEST_CLIENT_PROMISE__ = createClient({
    "bwes-cluster": db,
  });

  const anonymousRes = createJsonResponse();
  await certificatesGenerateHandler(
    {
      method: "POST",
      body: JSON.stringify({ courseId: "course-1" }),
      headers: {},
      cookies: {},
    },
    anonymousRes,
  );
  assert.equal(anonymousRes.statusCode, 401);

  const crossUserRes = createJsonResponse();
  await certificatesGenerateHandler(
    {
      method: "POST",
      body: JSON.stringify({ userId: "user-b", courseId: "course-1" }),
      headers: {
        cookie: sessionCookie({
          userId: "user-a",
          email: "user-a@example.com",
        }),
      },
      cookies: {},
    },
    crossUserRes,
  );
  assert.equal(crossUserRes.statusCode, 403);

  const missingCourseRes = createJsonResponse();
  await certificatesGenerateHandler(
    {
      method: "POST",
      body: JSON.stringify({ courseId: "missing-course" }),
      headers: {
        cookie: sessionCookie({
          userId: "user-a",
          email: "user-a@example.com",
        }),
      },
      cookies: {},
    },
    missingCourseRes,
  );
  assert.equal(missingCourseRes.statusCode, 404);

  const validRes = createJsonResponse();
  await certificatesGenerateHandler(
    {
      method: "POST",
      body: JSON.stringify({ courseId: "course-1" }),
      headers: {
        cookie: sessionCookie({
          userId: "user-a",
          email: "user-a@example.com",
        }),
      },
      cookies: {},
    },
    validRes,
  );
  assert.equal(validRes.statusCode, 200);
  assert.equal(db.collection("certificates").docs.length, 1);
  assert.equal(db.collection("certificates").docs[0].userId, "user-a");

  const duplicateRes = createJsonResponse();
  await certificatesGenerateHandler(
    {
      method: "POST",
      body: JSON.stringify({ courseId: "course-1" }),
      headers: {
        cookie: sessionCookie({
          userId: "user-a",
          email: "user-a@example.com",
        }),
      },
      cookies: {},
    },
    duplicateRes,
  );
  assert.equal(duplicateRes.statusCode, 200);
  assert.equal(db.collection("certificates").docs.length, 1);
}

for (const [handler, routeName] of [
  [coursesEnrollHandler, "courses/enroll"],
  [savedJobsAddHandler, "savedjobs/add"],
  [supportCreateHandler, "support/create"],
]) {
  const res = createJsonResponse();
  await handler({ method: "POST", body: {}, headers: {} }, res);
  assert.equal(res.statusCode, 410, `${routeName} should be retired`);
}

console.log("legacy-write-route-security-tests: ok");
