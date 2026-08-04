import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const contractSourcePath = path.join(
  repoRoot,
  "src/lib/directoryProfileContract.ts",
);
const visibilitySourcePath = path.join(
  repoRoot,
  "src/lib/directory/publicVisibility.ts",
);
const sponsorSourcePath = path.join(
  repoRoot,
  "src/lib/advertising/sponsorListings.ts",
);

const contractTargetPath = path.join(
  tmpDir,
  "directoryProfileContract-testable.mjs",
);
const visibilityTargetPath = path.join(
  tmpDir,
  "directoryPublicVisibility-testable.mjs",
);
const sponsorTargetPath = path.join(tmpDir, "sponsorListings-testable.mjs");

async function transpileFile(sourcePath, targetPath, replacements = []) {
  let source = await fs.readFile(sourcePath, "utf8");
  for (const [from, to] of replacements) {
    source = source.replace(from, to);
  }

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  await fs.writeFile(targetPath, transpiled, "utf8");
}

await transpileFile(contractSourcePath, contractTargetPath);
await transpileFile(visibilitySourcePath, visibilityTargetPath);
await transpileFile(sponsorSourcePath, sponsorTargetPath, [
  [
    'from "@/lib/directoryProfileContract";',
    'from "./directoryProfileContract-testable.mjs";',
  ],
  [
    'from "@/lib/directory/publicVisibility";',
    'from "./directoryPublicVisibility-testable.mjs";',
  ],
]);

const {
  applySponsorSearchMetadata,
  buildSponsorSearchAliases,
  findSponsorLinkForBusiness,
  isSponsorScheduleRowFallbackEligible,
  matchesSponsorSearchAlias,
  resolveSponsorBusinessLinks,
} = await import(`file://${sponsorTargetPath}`);

const aliases = buildSponsorSearchAliases(
  "TitanEra",
  "Titan Era Productions",
  "titan-era-productions",
);
assert.equal(matchesSponsorSearchAlias("TitanEra", aliases), true);
assert.equal(matchesSponsorSearchAlias("Titan Era", aliases), true);
assert.equal(matchesSponsorSearchAlias("Titan Era Productions", aliases), true);
assert.equal(
  matchesSponsorSearchAlias("Pamfa", ["Pamfa United Citizens"]),
  true,
);

const linkedBusinesses = resolveSponsorBusinessLinks(
  [
    {
      campaignId: "sched-1",
      businessId: "",
      sponsorName: "Pamfa United Citizen",
      tagline: "Bold. Fearless. Iconic.",
      imageUrl: "/images/sponsors/pamfaunitedcitizen.jpg",
      source: "featured_sponsor_schedule",
      inventoryTier: 1,
    },
    {
      campaignId: "sched-private",
      businessId: "biz-private",
      sponsorName: "Hidden Sponsor",
      tagline: "Should not resolve",
      imageUrl: "/images/sponsors/house-draft.jpg",
      source: "featured_sponsor_schedule",
      inventoryTier: 1,
    },
  ],
  [
    {
      _id: "biz-public",
      alias: "pamfa-united-citizens",
      business_name: "Pamfa United Citizens",
      approved: true,
      status: "active",
      isComplete: true,
    },
    {
      _id: "biz-private",
      alias: "hidden-sponsor",
      business_name: "Hidden Sponsor",
      approved: false,
      status: "pending",
      isComplete: true,
    },
  ],
);

assert.equal(linkedBusinesses.length, 1);
assert.equal(linkedBusinesses[0].businessId, "biz-public");
assert.equal(linkedBusinesses[0].alias, "pamfa-united-citizens");
assert.equal(
  matchesSponsorSearchAlias(
    "Pamfa United Citizen",
    linkedBusinesses[0].searchAliases,
  ),
  true,
);

const mergedMetadata = applySponsorSearchMetadata(
  {
    _id: "biz-public",
    business_name: "Pamfa United Citizens",
    isSponsored: false,
    __sponsorAliases: [],
  },
  linkedBusinesses[0],
);

assert.equal(mergedMetadata.isSponsored, true);
assert.deepEqual(
  mergedMetadata.__sponsorAliases,
  linkedBusinesses[0].searchAliases,
);
assert.equal(mergedMetadata.__sponsorCampaignId, "sched-1");
assert.equal(
  findSponsorLinkForBusiness(
    {
      business_name: "Pamfa United Citizens",
      alias: "pamfa-united-citizens",
    },
    linkedBusinesses,
  )?.campaignId,
  "sched-1",
);

assert.equal(
  isSponsorScheduleRowFallbackEligible(
    {
      status: "active",
      weekStart: "2026-03-09T00:00:00.000Z",
      weekEnd: "2026-05-04T00:00:00.000Z",
    },
    new Date("2026-08-04T12:00:00.000Z"),
  ),
  false,
);
assert.equal(
  isSponsorScheduleRowFallbackEligible(
    {
      status: "active",
      weekStart: "2026-08-04T00:00:00.000Z",
      weekEnd: "2026-08-11T00:00:00.000Z",
    },
    new Date("2026-08-04T12:00:00.000Z"),
  ),
  true,
);

console.log("sponsor-listings-tests: ok");
