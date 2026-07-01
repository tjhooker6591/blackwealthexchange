import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(".audit/runtime-proof-consultant-real-db");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function main() {
  await ensureDir();

  const ts = Date.now();
  const candidateEmail = `consultant.candidate.${ts}@example.com`;
  const employerEmail = `consultant.employer.${ts}@example.com`;
  const password = "StrongPass1!";

  const browser = await chromium.launch({ headless: true });

  // A) Unauthenticated role protection (real runtime)
  const unauth = await browser.newContext();
  const unauthConsultants = await unauth.request.get(
    `${BASE_URL}/api/employer/consultants`,
  );
  const unauthPipeline = await unauth.request.get(
    `${BASE_URL}/api/employer/consultant-pipeline`,
  );

  // B) Seed real candidate intake (real DB write)
  const intake = await unauth.request.post(
    `${BASE_URL}/api/consulting-intake`,
    {
      data: {
        type: "candidate",
        name: `Jordan Proof ${ts}`,
        email: candidateEmail,
        company: "Independent Consultant",
        phone: "555-0101",
        details:
          "Senior QA and PM consultant. Skills: Selenium, Jira, SQL, Scrum, HIPAA compliance, process improvement. 11 years experience in healthcare and fintech. Available for fractional and project-based engagements.",
      },
    },
  );

  // C) Real employer signup + authenticated access
  const ctx = await browser.newContext();
  const signupRes = await ctx.request.post(`${BASE_URL}/api/auth/signup`, {
    data: { email: employerEmail, password, accountType: "employer" },
  });

  const consultantsRes = await ctx.request.get(
    `${BASE_URL}/api/employer/consultants`,
  );
  const consultantsJson = await consultantsRes.json();
  const consultants = Array.isArray(consultantsJson?.consultants)
    ? consultantsJson.consultants
    : [];

  const firstConsultantId = consultants[0]?.id;
  if (!firstConsultantId) {
    throw new Error("No consultants returned from real DB-backed API");
  }

  const detailRes = await ctx.request.get(
    `${BASE_URL}/api/employer/consultants/${firstConsultantId}`,
  );

  // D) Real save/shortlist pipeline persistence
  const saveRes = await ctx.request.post(
    `${BASE_URL}/api/employer/consultant-pipeline`,
    {
      data: { consultantId: firstConsultantId, status: "saved" },
    },
  );
  const interviewRes = await ctx.request.post(
    `${BASE_URL}/api/employer/consultant-pipeline`,
    {
      data: { consultantId: firstConsultantId, status: "interview_requested" },
    },
  );
  const pipelineRes = await ctx.request.get(
    `${BASE_URL}/api/employer/consultant-pipeline`,
  );
  const pipelineJson = await pipelineRes.json();

  // E) Browser evidence on authenticated route
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/dashboard/employer/consultants`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Consultant Marketplace");
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outDir, "real-employer-hub.png"),
    fullPage: true,
  });

  await page.goto(
    `${BASE_URL}/dashboard/employer/consultants/${firstConsultantId}`,
    {
      waitUntil: "domcontentloaded",
    },
  );
  await page.waitForSelector("text=Experience & engagement");
  await page.screenshot({
    path: path.join(outDir, "real-employer-consultant-detail.png"),
    fullPage: true,
  });

  const summary = {
    intakeStatus: intake.status(),
    signupStatus: signupRes.status(),
    unauthConsultantsStatus: unauthConsultants.status(),
    unauthPipelineStatus: unauthPipeline.status(),
    consultantsStatus: consultantsRes.status(),
    consultantsCount: consultants.length,
    consultantsSource: consultantsJson?.source || null,
    firstConsultantId,
    detailStatus: detailRes.status(),
    saveStatus: saveRes.status(),
    interviewStatus: interviewRes.status(),
    pipelineStatus: pipelineRes.status(),
    pipelineCount: Array.isArray(pipelineJson?.items)
      ? pipelineJson.items.length
      : 0,
    pipelineStatuses: Array.isArray(pipelineJson?.items)
      ? pipelineJson.items.slice(0, 5).map((x) => x.status)
      : [],
  };

  await fs.writeFile(
    path.join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
  );

  console.log(JSON.stringify(summary, null, 2));

  await unauth.close();
  await ctx.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
