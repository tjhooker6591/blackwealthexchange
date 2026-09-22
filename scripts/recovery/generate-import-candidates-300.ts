import fs from "node:fs";
import path from "node:path";

const categories = [
  "Restaurants / Food","Barbershops","Hair Salons","Beauty / Nails","Beauty Supply","Health / Wellness","Fitness","Clothing / Apparel","Shoes / Footwear","Retail","E-commerce Brands","Books / Authors","Professional Services","Legal Services","Accounting / Tax","Real Estate","Construction","Home Services","Auto Services","Childcare","Education / Tutoring","Technology","Marketing / Creative","Events","Entertainment","Nonprofits","Financial Services","Insurance","Travel","Cleaning Services"
];

const outPath = path.join(process.cwd(), "scripts", "recovery", "out", "import-candidates-300.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const missingCredentials = [] as any[];
if (!process.env.GOOGLE_PLACES_API_KEY) missingCredentials.push({ source: "Google Places", envVar: "GOOGLE_PLACES_API_KEY", whyNeeded: "verified place details enrichment", recordsAffected: 300 });
if (!process.env.YELP_API_KEY) missingCredentials.push({ source: "Yelp Fusion", envVar: "YELP_API_KEY", whyNeeded: "business match/phone search", recordsAffected: 300 });

const candidates: any[] = [];
for (const category of categories) {
  for (let i = 1; i <= 10; i++) {
    candidates.push({
      business_name: "",
      category,
      city: "",
      state: "",
      website: "",
      phone: "",
      address: "",
      sourceUrl: "",
      sourceType: "",
      sourceEvidenceSummary: "",
      confidenceScore: "NONE",
      verificationStatus: "pending_source_verification",
      claimStatus: "unclaimed",
      proposed_alias: "",
      proposed_slug: "",
      importedAt: new Date().toISOString(),
      lastVerifiedAt: null,
      isImported: true,
      publicEligible: false,
      slot: i,
    });
  }
}

const payload = {
  categoriesAttempted: categories.length,
  candidatesStaged: candidates.length,
  highConfidenceCount: 0,
  mediumConfidenceCount: 0,
  skippedDueToMissingSourceAccess: candidates.length,
  duplicateConflicts: 0,
  missingCredentials,
  candidates,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ outPath, categories: categories.length, candidates: candidates.length }, null, 2));
