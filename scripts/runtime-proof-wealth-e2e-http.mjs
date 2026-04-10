#!/usr/bin/env node
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

const base = process.env.APP_URL || "http://127.0.0.1:3000";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!uri) throw new Error("MONGODB_URI is required");
if (!secret) throw new Error("JWT_SECRET or NEXTAUTH_SECRET is required");

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const runId = `wealth-proof-${Date.now()}`;
const email = `${runId}@example.com`;

const userInsert = await db.collection("users").insertOne({
  email,
  accountType: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
});

const token = jwt.sign(
  {
    userId: String(userInsert.insertedId),
    email,
    accountType: "user",
  },
  secret,
  { expiresIn: "30m" },
);

const cookie = `session_token=${token}; accountType=user`;

async function api(path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

const tx = await api("/api/wealth-builder/transactions", {
  method: "POST",
  body: JSON.stringify({
    category: "Income",
    amount: 6200,
    type: "income",
    merchant: "Employer",
  }),
});

await api("/api/wealth-builder/transactions", {
  method: "POST",
  body: JSON.stringify({
    category: "Housing",
    amount: 1800,
    type: "expense",
    merchant: "Landlord",
  }),
});

const budget = await api("/api/wealth-builder/budget", {
  method: "POST",
  body: JSON.stringify({
    categories: [
      { name: "Housing", plannedAmount: 1800, actualAmount: 1800 },
      { name: "Food", plannedAmount: 500, actualAmount: 420 },
    ],
  }),
});

const debt = await api("/api/wealth-builder/debts", {
  method: "POST",
  body: JSON.stringify({
    name: "Credit Card",
    lender: "Bank",
    balance: 2400,
    minimumPayment: 95,
    status: "active",
  }),
});

const goal = await api("/api/wealth-builder/goals", {
  method: "POST",
  body: JSON.stringify({
    goalName: "Emergency Fund",
    targetAmount: 3000,
    currentAmount: 900,
    status: "active",
  }),
});

const entitlement = await api("/api/wealth-builder/entitlement");
const dashboard = await api("/api/wealth-builder/dashboard");

console.log(
  JSON.stringify(
    {
      ok: true,
      runId,
      checks: {
        transactionPost: tx.ok,
        budgetPost: budget.ok,
        debtPost: debt.ok,
        goalPost: goal.ok,
        entitlementGet: entitlement.ok,
        dashboardGet: dashboard.ok,
      },
      summary: dashboard.data?.dashboard?.summary || null,
      entitlement: entitlement.data?.entitlement || null,
    },
    null,
    2,
  ),
);

await client.close();
