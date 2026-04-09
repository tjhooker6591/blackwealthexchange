import { chromium } from "playwright";
import { MongoClient } from "mongodb";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(
  ".audit/runtime-proof-consultant-inbox-moderation-events",
);

let envCache = null;
function env(name) {
  if (process.env[name]) return process.env[name];
  if (!envCache) {
    envCache = {};
    try {
      const raw = readFileSync(".env.local", "utf8");
      for (const line of raw.split(/\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) envCache[m[1]] = m[2];
      }
    } catch {
      // ignore
    }
  }
  return envCache?.[name] || "";
}

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function main() {
  await ensureDir();
  const ts = Date.now();
  const consultantEmail = `inbox.consultant.${ts}@example.com`;
  const employerEmail = `inbox.employer.${ts}@example.com`;
  const password = "StrongPass1!";

  const browser = await chromium.launch({ headless: true });

  const consultantCtx = await browser.newContext();
  await consultantCtx.request.post(`${BASE_URL}/api/auth/signup`, {
    data: { email: consultantEmail, password, accountType: "user" },
  });
  const profileRes = await consultantCtx.request.patch(
    `${BASE_URL}/api/consultants/profile`,
    {
      data: {
        name: `Inbox Consultant ${ts}`,
        professionalTitle: "Cybersecurity Consultant",
        category: "Cybersecurity",
        topSkills: ["SOC 2", "audit", "compliance"],
        yearsExperience: 9,
        availability: "Available now",
        engagementType: "Project-based",
        industriesServed: ["Finance"],
        summary: "Security consultant for regulated programs.",
      },
    },
  );
  const profileJson = await profileRes.json();
  const consultantId = profileJson?.profile?._id;
  if (!consultantId) throw new Error("consultant profile id missing");

  const employerCtx = await browser.newContext();
  await employerCtx.request.post(`${BASE_URL}/api/auth/signup`, {
    data: { email: employerEmail, password, accountType: "employer" },
  });

  const contactRes = await employerCtx.request.post(
    `${BASE_URL}/api/employer/consultant-contact-requests`,
    {
      data: {
        consultantId,
        requestType: "contact",
        message:
          "We need SOC 2 readiness support for a finance deployment with immediate kickoff this month.",
      },
    },
  );

  const blockedRes = await employerCtx.request.post(
    `${BASE_URL}/api/employer/consultant-contact-requests`,
    {
      data: {
        consultantId,
        requestType: "contact",
        message: "WIRE MONEY NOW via telegram only and send gift card details.",
      },
    },
  );

  const consultantInboxRes = await consultantCtx.request.get(
    `${BASE_URL}/api/consultants/contact-requests`,
  );
  const consultantInboxJson = await consultantInboxRes.json();

  const consultantPage = await consultantCtx.newPage();
  await consultantPage.goto(`${BASE_URL}/dashboard/consultant/requests`, {
    waitUntil: "domcontentloaded",
  });
  await consultantPage.waitForSelector("text=Employer Requests");
  await consultantPage.screenshot({
    path: path.join(outDir, "consultant-inbox.png"),
    fullPage: true,
  });

  const uri = env("MONGODB_URI");
  const dbName = env("MONGODB_DB") || "bwes-cluster";
  const mongo = new MongoClient(uri);
  await mongo.connect();
  const db = mongo.db(dbName);

  const submittedEvents = await db.collection("flow_events").countDocuments({
    eventType: "consultant_contact_request_submitted",
    consultantId,
  });
  const blockedEvents = await db.collection("flow_events").countDocuments({
    eventType: "consultant_contact_request_blocked",
    consultantId,
  });
  const pipelineEvents = await db.collection("flow_events").countDocuments({
    eventType: "consultant_pipeline_status_set",
    consultantId,
  });

  await mongo.close();

  const summary = {
    consultantProfileStatus: profileRes.status(),
    consultantId,
    contactStatus: contactRes.status(),
    blockedStatus: blockedRes.status(),
    inboxStatus: consultantInboxRes.status(),
    inboxCount: Array.isArray(consultantInboxJson?.items)
      ? consultantInboxJson.items.length
      : 0,
    inboxModerationValues: Array.isArray(consultantInboxJson?.items)
      ? consultantInboxJson.items.slice(0, 5).map((x) => x.moderationStatus)
      : [],
    submittedEvents,
    blockedEvents,
    pipelineEvents,
  };

  await fs.writeFile(
    path.join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));

  await consultantCtx.close();
  await employerCtx.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
