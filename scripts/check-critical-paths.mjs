import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import jwt from "jsonwebtoken";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

function mongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const t = fs.readFileSync("connect.js", "utf8");
  const m = t.match(/"mongodb\+srv:[^"]+"/);
  return m ? m[0].slice(1, -1) : "";
}

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, { redirect: "manual", ...opts });
  const text = await res.text();
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: text,
  };
}

function add(result, name, pass, details) {
  result.flowsValidated.push({ name, pass, ...details });
  if (!pass) result.remainingIncompleteFlows.push({ name, ...details });
}

const out = {
  base,
  flowsValidated: [],
  remainingIncompleteFlows: [],
  routeTypoCheck: {},
};

// 1) homepage CTA destination validation
const ctaPaths = [
  "/financial-literacy",
  "/job-listings",
  "/marketplace/become-a-seller",
  "/black-student-opportunities",
  "/internships",
  "/marketplace",
  "/business-directory",
  "/advertise-with-us",
  "/affiliate",
  "/black-entertainment-news",
  "/business-directory/sponsored-business",
  "/investment",
  "/recruiting-consulting?type=employer",
  "/recruiting-consulting?type=candidate",
];
for (const p of ctaPaths) {
  const r = await req(p);
  add(out, `CTA ${p}`, [200, 302, 307, 308].includes(r.status), {
    status: r.status,
  });
}

// 2) course/class/learning path completion
const learningFlow = [
  "/financial-literacy",
  "/library-of-black-history",
  "/resources",
  "/resources/articles",
  "/resources/inclusive-job-descriptions",
];
for (const p of learningFlow) {
  const r = await req(p);
  add(out, `Learning ${p}`, [200, 302, 307, 308].includes(r.status), {
    status: r.status,
  });
}

// 3) form submission completion
const intake = await req("/api/consulting-intake", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "employer",
    name: "Critical Path QA",
    email: `critical-path-${Date.now()}@example.com`,
    details: "Need hiring support",
  }),
});
add(out, "Form consulting-intake submit", intake.status === 200, {
  status: intake.status,
});

const resetReq = await req("/api/auth/request-reset", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "critical-path@example.com" }),
});
add(out, "Form request-reset submit", resetReq.status === 200, {
  status: resetReq.status,
});

// 4 + 5) protected-route redirect correctness + role-based completion
const uri = mongoUri();
if (!uri) throw new Error("Missing Mongo URI");
const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "bwes-cluster");
const stamp = Date.now();
const pwd = "QaPass123!";
const hash = await bcrypt.hash(pwd, 10);
const accounts = [
  {
    role: "user",
    coll: "users",
    email: `cp.user.${stamp}@bwe.local`,
    accountType: "user",
    isAdmin: false,
  },
  {
    role: "seller",
    coll: "sellers",
    email: `cp.seller.${stamp}@bwe.local`,
    accountType: "seller",
    isAdmin: false,
  },
  {
    role: "employer",
    coll: "employers",
    email: `cp.employer.${stamp}@bwe.local`,
    accountType: "employer",
    isAdmin: false,
  },
  {
    role: "admin",
    coll: "users",
    email: `cp.admin.${stamp}@bwe.local`,
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

const guestProtected = [
  "/job-listings",
  "/marketplace/add-products",
  "/employer/jobs",
  "/admin/dashboard",
];
for (const p of guestProtected) {
  const r = await req(p);
  add(out, `Guest protected ${p}`, [302, 307, 308].includes(r.status), {
    status: r.status,
  });
}

const cookies = {};
for (const a of accounts) {
  const lr = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: a.email,
      password: pwd,
      accountType: a.accountType,
    }),
    redirect: "manual",
  });
  cookies[a.role] = parseCookie(
    lr.headers.getSetCookie?.() || lr.headers.get("set-cookie"),
  );
}

const roleChecks = [
  ["seller", "/marketplace/add-products", [200]],
  ["employer", "/employer/jobs", [200]],
  ["admin", "/admin/dashboard", [200]],
  ["user", "/marketplace/add-products", [302, 307, 308]],
];
for (const [role, p, expected] of roleChecks) {
  const r = await req(p, { headers: { cookie: cookies[role] } });
  add(out, `Role ${role} ${p}`, expected.includes(r.status), {
    status: r.status,
    expected,
  });
}

await client.close();

// 6) no dead-end pages for key flows (simple check: has at least one internal href)
const keyPages = [
  "/",
  "/financial-literacy",
  "/business-directory",
  "/recruiting-consulting",
  "/marketplace",
  "/black-student-opportunities",
];
for (const p of keyPages) {
  const r = await req(p);
  const internalLinkCount = (r.body.match(/href="\//g) || []).length;
  const hasForm = /<form/i.test(r.body);
  const pass =
    r.status === 200 &&
    (internalLinkCount > 0 || (p === "/recruiting-consulting" && hasForm));
  add(out, `No dead-end ${p}`, pass, {
    status: r.status,
    internalLinkCount,
    hasForm,
  });
}

// explicit typo route check
const typoRoute = await req("/resources/inclusive-job-desriptions");
const correctedRoute = await req("/resources/inclusive-job-descriptions");
out.routeTypoCheck = {
  typoRouteStatus: typoRoute.status,
  canonicalRouteStatus: correctedRoute.status,
  conclusion:
    [301, 302, 307, 308].includes(typoRoute.status) && correctedRoute.status === 200
      ? "Canonical route is /resources/inclusive-job-descriptions with backward redirect from typo slug."
      : "Route mapping differs; review required.",
};

out.summary = {
  total: out.flowsValidated.length,
  passed: out.flowsValidated.filter((f) => f.pass).length,
  failed: out.remainingIncompleteFlows.length,
};

fs.mkdirSync(".audit", { recursive: true });
fs.writeFileSync(
  ".audit/critical-paths-report.json",
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
if (out.remainingIncompleteFlows.length > 0) process.exit(1);
