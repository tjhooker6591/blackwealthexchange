const { MongoClient, ObjectId } = require("mongodb");
const { runApplicantVetting } = require("../src/lib/hiring/vetting.ts");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB || "bwes-cluster";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const now = Date.now();
  const employerEmail = "proof-employer@example.com";

  const job = {
    title: `Proof Job ${now}`,
    company: "ProofCo",
    location: "Atlanta, GA",
    type: "Full-Time",
    description: "Need react node aws leadership",
    salary: "120000",
    contactEmail: employerEmail,
    email: employerEmail,
    userId: "proof-employer-user",
    status: "pending",
    createdAt: new Date(),
    requiresResume: true,
    requiredSkills: ["react", "node", "aws"],
    requiredCertifications: ["pmp"],
    minimumYearsExperience: 3,
    workAuthorizationRequired: true,
  };

  const { insertedId: jobId } = await db.collection("jobs").insertOne(job);

  const users = [
    {
      email: `proof-qualified-${now}@example.com`,
      name: "Qualified Candidate",
      phone: "555-1111",
      city: "Atlanta",
      state: "GA",
      bio: "react node aws pmp engineering manager",
      summary: "react node aws pmp",
      yearsExperience: 5,
      workAuthorization: true,
      resumeUrl: "https://example.com/resume-q.pdf",
    },
    {
      email: `proof-review-${now}@example.com`,
      name: "Review Candidate",
      phone: "555-2222",
      city: "Atlanta",
      state: "GA",
      bio: "react intern",
      summary: "entry level",
      yearsExperience: 0,
      workAuthorization: true,
      resumeUrl: "https://example.com/resume-r.pdf",
    },
    {
      email: `proof-nyq-${now}@example.com`,
      name: "Not Yet Qualified Candidate",
      phone: "555-3333",
      city: "Atlanta",
      state: "GA",
      bio: "customer support",
      summary: "generalist",
      yearsExperience: 1,
      workAuthorization: false,
      resumeUrl: "",
    },
  ];

  const output = { jobId: String(jobId), jobConfig: job, applicants: [] };

  for (const u of users) {
    const { insertedId: userId } = await db.collection("users").insertOne(u);
    const vetting = await runApplicantVetting(db, {
      userId: new ObjectId(userId),
      jobId: new ObjectId(jobId),
      resumeUrl: u.resumeUrl,
    });
    const appDoc = {
      jobId: new ObjectId(jobId),
      userId: new ObjectId(userId),
      name: u.name,
      email: u.email,
      resumeUrl: u.resumeUrl,
      appliedAt: new Date(),
      hiringStatus: "new",
      statusUpdatedAt: new Date(),
      vettingStatus: vetting.vettingStatus,
      vettingSignals: vetting.vettingSignals,
      vettingSummary: vetting.vettingSummary,
      vettingUpdatedAt: vetting.vettingUpdatedAt,
      vettingConfidenceBand: vetting.vettingConfidenceBand,
      manualOverride: false,
      overrideReason: "",
      statusHistory: [
        { status: "new", changedAt: new Date(), actor: "proof-script" },
      ],
    };
    const { insertedId: applicantId } = await db
      .collection("applicants")
      .insertOne(appDoc);
    output.applicants.push({
      applicantId: String(applicantId),
      email: u.email,
      vettingStatus: vetting.vettingStatus,
      vettingConfidenceBand: vetting.vettingConfidenceBand,
      vettingSummary: vetting.vettingSummary,
      knockoutReasons: vetting.vettingSignals?.knockout?.reasons || [],
      matched: vetting.vettingSignals?.roleMatch?.matchedKeywords || [],
      missing: vetting.vettingSignals?.roleMatch?.missingKeywords || [],
    });
  }

  console.log(JSON.stringify(output, null, 2));
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
