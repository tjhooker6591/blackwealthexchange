import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(".audit/runtime-proof-consultant-discovery");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function main() {
  await ensureDir();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/employer/consultants?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "consultant_profiles",
        consultants: [
          {
            id: "c1",
            name: "Alicia Grant",
            professionalTitle: "Senior QA & Program Consultant",
            category: "QA / Testing",
            topSkills: ["Selenium", "Jira", "QA automation", "Scrum"],
            yearsExperience: 9,
            industriesServed: ["Healthcare", "Fintech"],
            summary:
              "Leads quality transformation programs across regulated enterprise environments.",
            engagementType: "Fractional / Project",
            availability: "Available in 2 weeks",
            resumeUrl: "/uploads/resumes/alicia.pdf",
            trust: { featured: true, verified: true, vetted: false },
          },
        ],
      }),
    });
  });

  await page.route("**/api/employer/consultant-pipeline", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, items: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route("**/api/employer/consultants/c1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        consultant: {
          id: "c1",
          name: "Alicia Grant",
          professionalTitle: "Senior QA & Program Consultant",
          category: "QA / Testing",
          topSkills: ["Selenium", "Jira", "QA automation", "Scrum"],
          yearsExperience: 9,
          industriesServed: ["Healthcare", "Fintech"],
          summary:
            "Leads quality transformation programs across regulated enterprise environments.",
          engagementType: "Fractional / Project",
          availability: "Available in 2 weeks",
          resumeUrl: "/uploads/resumes/alicia.pdf",
          toolsPlatforms: ["Jira", "Azure DevOps"],
          certifications: ["ISTQB", "PMP"],
          projectHistory: [
            "Built QA automation strategy for payer migration",
            "Reduced release defects by 35% over two quarters",
          ],
          location: "Atlanta, GA",
          remoteStatus: "Remote-friendly",
        },
      }),
    });
  });

  await page.goto(`${BASE_URL}/dashboard/employer/consultants`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Consultant Marketplace");
  await page.waitForSelector("text=Alicia Grant");
  await page.screenshot({
    path: path.join(outDir, "consultant-discovery-hub.png"),
    fullPage: true,
  });

  await page.click('a[href="/dashboard/employer/consultants/c1"]');
  await page.waitForURL("**/dashboard/employer/consultants/c1");
  await page.waitForSelector("text=Skills, tools, and certifications");
  await page.screenshot({
    path: path.join(outDir, "consultant-profile-detail.png"),
    fullPage: true,
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { accountType: "employer", email: "emp@example.com" },
      }),
    });
  });
  await page.route("**/api/employer/stats", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        jobsPosted: 3,
        totalApplicants: 11,
        messages: 2,
        profileCompletion: 76,
      }),
    });
  });
  await page.route("**/api/employer/jobs?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ jobs: [] }),
    });
  });
  await page.route("**/api/employer/applicants?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ applicants: [] }),
    });
  });

  await page.goto(`${BASE_URL}/employer`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Consultant Discovery");
  await page.screenshot({
    path: path.join(outDir, "employer-dashboard-access-link.png"),
    fullPage: true,
  });

  const summary = {
    discoveryHubRendered: true,
    consultantCardRendered: true,
    profileRendered: true,
    employerEntryLinkRendered: true,
  };

  await fs.writeFile(
    path.join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
