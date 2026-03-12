import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import fs from "node:fs";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

function mongoUri() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    (() => {
      const t = fs.readFileSync("connect.js", "utf8");
      const m = t.match(/"mongodb\+srv:[^"]+"/);
      return m ? m[0].slice(1, -1) : "";
    })()
  );
}

function parseSetCookie(header) {
  if (!header) return "";
  const arr = Array.isArray(header) ? header : [header];
  return arr.map((s) => s.split(";")[0]).join("; ");
}

async function http(path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    redirect: "manual",
    ...opts,
  });
  const txt = await res.text();
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: txt,
  };
}

async function login(email, password, accountType) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, accountType }),
    redirect: "manual",
  });
  const body = await res.text();
  const cookie = parseSetCookie(
    res.headers.getSetCookie?.() || res.headers.get("set-cookie"),
  );
  return { status: res.status, cookie, body };
}

function ok(result, expected) {
  return expected.includes(result.status);
}

const out = {
  base,
  checks: [],
  notes: [],
};

async function ensureRuntimeHealthy() {
  const root = await http("/");
  const session = await http("/api/auth/session");
  const okRoot = root.status === 200;
  const okSession = session.status === 200;
  if (okRoot && okSession) return;

  const reason = `Runtime unhealthy before regression: / => ${root.status}, /api/auth/session => ${session.status}`;
  out.notes.push(reason);
  fs.mkdirSync(".audit", { recursive: true });
  fs.writeFileSync(
    ".audit/p2-regression-report.json",
    JSON.stringify(
      { ...out, summary: { total: 0, passed: 0, failed: 0 } },
      null,
      2,
    ),
  );
  console.error(reason);
  process.exit(2);
}

await ensureRuntimeHealthy();

const uri = mongoUri();
if (!uri) {
  console.error("Missing Mongo URI");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "bwes-cluster");

const pwd = "QaPass123!";
const hash = await bcrypt.hash(pwd, 10);
const stamp = Date.now();

const accounts = [
  {
    role: "user",
    coll: "users",
    email: `qa.user.${stamp}@bwe.local`,
    accountType: "user",
    isAdmin: false,
  },
  {
    role: "seller",
    coll: "sellers",
    email: `qa.seller.${stamp}@bwe.local`,
    accountType: "seller",
    isAdmin: false,
  },
  {
    role: "employer",
    coll: "employers",
    email: `qa.employer.${stamp}@bwe.local`,
    accountType: "employer",
    isAdmin: false,
  },
  {
    role: "business",
    coll: "businesses",
    email: `qa.business.${stamp}@bwe.local`,
    accountType: "business",
    isAdmin: false,
  },
  {
    role: "admin",
    coll: "users",
    email: `qa.admin.${stamp}@bwe.local`,
    accountType: "admin",
    isAdmin: true,
  },
];

for (const a of accounts) {
  await db.collection(a.coll).updateOne(
    { email: a.email },
    {
      $set: {
        email: a.email,
        password: hash,
        accountType: a.accountType,
        isAdmin: a.isAdmin,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

// Guest baseline
const guestRouteExpectations = [
  ["/job-listings", [200]],
  ["/marketplace/add-products", [302, 307, 308]],
  ["/employer/jobs", [302, 307, 308]],
  ["/admin/dashboard", [302, 307, 308]],
];

for (const [route, expect] of guestRouteExpectations) {
  const r = await http(route);
  out.checks.push({
    name: `guest ${route}`,
    status: r.status,
    pass: ok(r, expect),
    expect,
  });
}

const cookies = {};
for (const a of accounts) {
  const li = await login(a.email, pwd, a.accountType);
  cookies[a.role] = li.cookie;
  out.checks.push({
    name: `${a.role} login`,
    status: li.status,
    pass: li.status === 200,
  });

  const me = await http("/api/auth/me", { headers: { cookie: li.cookie } });
  out.checks.push({
    name: `${a.role} /api/auth/me`,
    status: me.status,
    pass: me.status === 200,
  });
}

// Role route checks
const roleChecks = [
  ["seller", "/marketplace/add-products", [200]],
  ["employer", "/employer/jobs", [200]],
  ["admin", "/admin/dashboard", [200]],
  ["user", "/marketplace/add-products", [302, 307, 308]],
  ["business", "/employer/jobs", [302, 307, 308]],
];

for (const [role, route, expect] of roleChecks) {
  const r = await http(route, { headers: { cookie: cookies[role] } });
  out.checks.push({
    name: `${role} ${route}`,
    status: r.status,
    pass: ok(r, expect),
    expect,
  });
}

// Directory + monetization + jobs checks
const apiBiz = await http("/api/searchBusinesses?query=food&limit=5");
out.checks.push({
  name: "search businesses",
  status: apiBiz.status,
  pass: apiBiz.status === 200,
});
let firstAlias = null;
try {
  const parsed = JSON.parse(apiBiz.body);
  firstAlias = parsed?.items?.[0]?.alias || parsed?.items?.[0]?._id;
} catch {}
if (firstAlias) {
  const d1 = await http(
    `/business-directory/${encodeURIComponent(firstAlias)}`,
    {
      headers: { cookie: cookies.user },
    },
  );
  const d2 = await http(
    `/api/getBusiness?alias=${encodeURIComponent(firstAlias)}`,
  );
  out.checks.push({
    name: "directory detail route",
    status: d1.status,
    pass: d1.status === 200,
  });
  out.checks.push({
    name: "getBusiness API",
    status: d2.status,
    pass: d2.status === 200,
  });
}

for (const route of [
  "/advertise-with-us",
  "/business-directory/sponsored-business",
  "/marketplace",
  "/job-listings",
]) {
  const r = await http(route, { headers: { cookie: cookies.user } });
  out.checks.push({
    name: `user ${route}`,
    status: r.status,
    pass: [200, 302, 307, 308].includes(r.status),
  });
}

out.summary = {
  total: out.checks.length,
  passed: out.checks.filter((c) => c.pass).length,
  failed: out.checks.filter((c) => !c.pass).length,
};

fs.mkdirSync(".audit", { recursive: true });
fs.writeFileSync(
  ".audit/p2-regression-report.json",
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));

await client.close();
if (out.summary.failed > 0) process.exit(1);
