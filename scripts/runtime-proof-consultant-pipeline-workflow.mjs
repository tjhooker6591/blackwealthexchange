import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(
  ".audit/runtime-proof-consultant-pipeline-workflow",
);

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function main() {
  await ensureDir();
  const ts = Date.now();
  const consultantEmail = `pipeline.consultant.${ts}@example.com`;
  const employerEmail = `pipeline.employer.${ts}@example.com`;
  const password = "StrongPass1!";

  const browser = await chromium.launch({ headless: true });

  // Create consultant + structured profile
  const consultantCtx = await browser.newContext();
  await consultantCtx.request.post(`${BASE_URL}/api/auth/signup`, {
    data: { email: consultantEmail, password, accountType: "user" },
  });
  await consultantCtx.request.patch(`${BASE_URL}/api/consultants/profile`, {
    data: {
      name: `Morgan Pipeline ${ts}`,
      professionalTitle: "Program Delivery Consultant",
      category: "Project / Program Management",
      topSkills: ["Jira", "Scrum", "leadership"],
      yearsExperience: 10,
      availability: "Available now",
      engagementType: "Project-based",
      industriesServed: ["Healthcare"],
      summary:
        "Leads complex delivery programs with strong stakeholder governance.",
    },
  });

  // Create employer + load consultants
  const employerCtx = await browser.newContext();
  await employerCtx.request.post(`${BASE_URL}/api/auth/signup`, {
    data: { email: employerEmail, password, accountType: "employer" },
  });

  const consultantsRes = await employerCtx.request.get(
    `${BASE_URL}/api/employer/consultants?skills=Jira,Scrum&category=${encodeURIComponent("Project / Program Management")}`,
  );
  const consultantsJson = await consultantsRes.json();
  const consultantId = consultantsJson?.consultants?.[0]?.id;
  if (!consultantId) throw new Error("No consultant found for workflow proof");

  // Submit real contact request workflow
  const contactRes = await employerCtx.request.post(
    `${BASE_URL}/api/employer/consultant-contact-requests`,
    {
      data: {
        consultantId,
        requestType: "contact",
        message:
          "We need support on a healthcare delivery stream with immediate stakeholder planning kickoff.",
      },
    },
  );

  const interviewRes = await employerCtx.request.post(
    `${BASE_URL}/api/employer/consultant-contact-requests`,
    {
      data: {
        consultantId,
        requestType: "interview_request",
        message:
          "Please confirm availability for a 30-minute interview this week to review fit and timeline.",
      },
    },
  );

  const pipelineRes = await employerCtx.request.get(
    `${BASE_URL}/api/employer/consultant-pipeline`,
  );
  const requestsRes = await employerCtx.request.get(
    `${BASE_URL}/api/employer/consultant-contact-requests`,
  );
  const pipelineJson = await pipelineRes.json();
  const requestsJson = await requestsRes.json();

  // UI proof for shortlist board
  const page = await employerCtx.newPage();
  await page.goto(`${BASE_URL}/dashboard/employer/consultants/pipeline`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Consultant Shortlist Board");
  await page.screenshot({
    path: path.join(outDir, "pipeline-board.png"),
    fullPage: true,
  });

  const summary = {
    consultantsStatus: consultantsRes.status(),
    consultantsCount: consultantsJson?.consultants?.length || 0,
    consultantId,
    contactRequestStatus: contactRes.status(),
    interviewRequestStatus: interviewRes.status(),
    pipelineStatus: pipelineRes.status(),
    pipelineCount: Array.isArray(pipelineJson?.items)
      ? pipelineJson.items.length
      : 0,
    pipelineStatuses: Array.isArray(pipelineJson?.items)
      ? pipelineJson.items.slice(0, 5).map((x) => x.status)
      : [],
    contactRequestsStatus: requestsRes.status(),
    contactRequestsCount: Array.isArray(requestsJson?.items)
      ? requestsJson.items.length
      : 0,
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
