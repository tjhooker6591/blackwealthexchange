import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(".audit/runtime-proof-consultant-structured-profile");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function main() {
  await ensureDir();
  const ts = Date.now();
  const consultantEmail = `structured.consultant.${ts}@example.com`;
  const employerEmail = `structured.employer.${ts}@example.com`;
  const password = "StrongPass1!";

  const browser = await chromium.launch({ headless: true });

  // 1) Create consultant account and author structured profile (real DB)
  const consultantCtx = await browser.newContext();
  const consultantSignup = await consultantCtx.request.post(
    `${BASE_URL}/api/auth/signup`,
    { data: { email: consultantEmail, password, accountType: "user" } },
  );

  const consultantProfile = await consultantCtx.request.patch(
    `${BASE_URL}/api/consultants/profile`,
    {
      data: {
        name: `Taylor Structured ${ts}`,
        professionalTitle: "Senior Cloud & Security Consultant",
        category: "Cloud / DevOps",
        topSkills: ["AWS", "Azure", "SOC 2", "compliance", "leadership"],
        yearsExperience: 12,
        availability: "Available in 1 week",
        engagementType: "Fractional / Project",
        industriesServed: ["Healthcare", "Public Sector"],
        summary:
          "Leads cloud modernization and compliance programs with executive-level stakeholder alignment.",
        toolsPlatforms: ["AWS", "Azure", "Terraform"],
        certifications: ["AWS Solutions Architect", "CISSP"],
        projectHistory: [
          "Migrated regulated workloads to AWS with SOC 2 controls",
          "Built security governance model for public sector delivery",
        ],
        location: "Los Angeles, CA",
        remoteStatus: "Remote-friendly",
        portfolioUrl: "https://example.com/portfolio/taylor",
        resumeUrl: "https://example.com/resume/taylor.pdf",
      },
    },
  );
  const consultantProfileJson = await consultantProfile.json();

  // 2) Create employer and validate discovery precision on structured data
  const employerCtx = await browser.newContext();
  const employerSignup = await employerCtx.request.post(
    `${BASE_URL}/api/auth/signup`,
    { data: { email: employerEmail, password, accountType: "employer" } },
  );

  const consultantsRes = await employerCtx.request.get(
    `${BASE_URL}/api/employer/consultants?category=${encodeURIComponent("Cloud / DevOps")}&skills=AWS,Azure&industries=Healthcare&minExperience=10&availability=${encodeURIComponent("Available")}`,
  );
  const consultantsJson = await consultantsRes.json();

  // 3) UI route proof for authoring + employer card quality signal
  const consultantPage = await consultantCtx.newPage();
  await consultantPage.goto(`${BASE_URL}/dashboard/consultant/profile`, {
    waitUntil: "domcontentloaded",
  });
  await consultantPage.waitForSelector("text=Build your consultant profile");
  await consultantPage.screenshot({
    path: path.join(outDir, "consultant-authoring-page.png"),
    fullPage: true,
  });

  const employerPage = await employerCtx.newPage();
  await employerPage.goto(`${BASE_URL}/dashboard/employer/consultants`, {
    waitUntil: "domcontentloaded",
  });
  await employerPage.waitForSelector("text=Consultant Marketplace");
  await employerPage.screenshot({
    path: path.join(outDir, "employer-card-quality.png"),
    fullPage: true,
  });

  const summary = {
    consultantSignupStatus: consultantSignup.status(),
    consultantProfileStatus: consultantProfile.status(),
    consultantCompleteness:
      consultantProfileJson?.profile?.completenessScore ?? null,
    employerSignupStatus: employerSignup.status(),
    filteredConsultantsStatus: consultantsRes.status(),
    filteredConsultantsCount: Array.isArray(consultantsJson?.consultants)
      ? consultantsJson.consultants.length
      : 0,
    source: consultantsJson?.source || null,
    firstConsultantCategory: consultantsJson?.consultants?.[0]?.category || null,
    firstConsultantSkills: consultantsJson?.consultants?.[0]?.topSkills || [],
    firstConsultantCompleteness:
      consultantsJson?.consultants?.[0]?.completenessScore ?? null,
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
