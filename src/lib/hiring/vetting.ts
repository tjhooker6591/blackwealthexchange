import { ObjectId } from "mongodb";

export type VettingStatus = "qualified" | "review_needed" | "not_yet_qualified";
export type VettingConfidenceBand = "high" | "medium" | "low";

export type VettingSignals = {
  profileCompleteness: { passed: boolean; score: number; missing: string[] };
  resume: { present: boolean; parseable: boolean };
  roleMatch: { band: VettingConfidenceBand; matchedKeywords: string[]; missingKeywords: string[] };
  experienceFit: { passed: boolean; note: string };
  locationFit: { passed: boolean; note: string };
  compensationFit: { passed: boolean; note: string };
  knockout: { triggered: boolean; reasons: string[] };
};

export async function runApplicantVetting(db: any, args: { userId: ObjectId; jobId: ObjectId; resumeUrl?: string | null }) {
  const [user, job] = await Promise.all([
    db.collection("users").findOne({ _id: args.userId }),
    db.collection("jobs").findOne({ _id: args.jobId }),
  ]);

  const profileFields = [user?.name, user?.email, user?.phone, user?.city || user?.location, user?.state, user?.bio || user?.summary];
  const presentCount = profileFields.filter(Boolean).length;
  const profileScore = Math.round((presentCount / profileFields.length) * 100);
  const missing = ["name", "email", "phone", "city/location", "state", "bio/summary"].filter((_, i) => !profileFields[i]);

  const resumePresent = Boolean(args.resumeUrl && String(args.resumeUrl).trim());
  const resumeParseable = resumePresent && /^https?:\/\//i.test(String(args.resumeUrl));

  const jobText = `${job?.title || ""} ${job?.description || ""}`.toLowerCase();
  const candidateText = `${user?.bio || ""} ${user?.summary || ""} ${user?.skills || ""} ${user?.experience || ""}`.toLowerCase();
  const keywords = Array.from(new Set(jobText.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 5))).slice(0, 12);
  const matched = keywords.filter((k: string) => candidateText.includes(k));
  const missingK = keywords.filter((k: string) => !candidateText.includes(k));
  const matchRatio = keywords.length ? matched.length / keywords.length : 0.5;
  const roleBand: VettingConfidenceBand = matchRatio >= 0.5 ? "high" : matchRatio >= 0.25 ? "medium" : "low";

  const experienceFit = { passed: Boolean(user?.experience || user?.yearsExperience), note: user?.yearsExperience ? `${user.yearsExperience} years listed` : "No explicit years of experience listed" };

  const locationFit = { passed: true, note: "No strict location requirement configured" };
  if (job?.location && user?.location) {
    locationFit.passed = String(job.location).toLowerCase().includes(String(user.location).toLowerCase()) || String(user.location).toLowerCase().includes(String(job.location).toLowerCase());
    locationFit.note = locationFit.passed ? "Location appears compatible" : "Location may require review";
  }

  const compensationFit = { passed: true, note: "No compensation preference data available" };

  const knockoutReasons: string[] = [];
  if (job?.requiresResume === true && !resumePresent) knockoutReasons.push("Resume required by role");
  if (job?.requiredSkills && Array.isArray(job.requiredSkills)) {
    const missingRequired = job.requiredSkills.filter((s: string) => !candidateText.includes(String(s).toLowerCase()));
    if (missingRequired.length === job.requiredSkills.length && job.requiredSkills.length > 0) {
      knockoutReasons.push("Required skills not detected");
    }
  }

  const signals: VettingSignals = {
    profileCompleteness: { passed: profileScore >= 60, score: profileScore, missing },
    resume: { present: resumePresent, parseable: resumeParseable },
    roleMatch: { band: roleBand, matchedKeywords: matched.slice(0, 6), missingKeywords: missingK.slice(0, 6) },
    experienceFit,
    locationFit,
    compensationFit,
    knockout: { triggered: knockoutReasons.length > 0, reasons: knockoutReasons },
  };

  let vettingStatus: VettingStatus = "review_needed";
  if (signals.knockout.triggered) vettingStatus = "not_yet_qualified";
  else if (signals.profileCompleteness.passed && signals.resume.present && signals.resume.parseable && roleBand !== "low") vettingStatus = "qualified";
  else if (!signals.profileCompleteness.passed || roleBand === "low") vettingStatus = "review_needed";

  const vettingConfidenceBand: VettingConfidenceBand = signals.knockout.triggered ? "low" : roleBand;
  const vettingSummary = signals.knockout.triggered
    ? `Flagged for review: ${signals.knockout.reasons.join(", ")}.`
    : vettingStatus === "qualified"
      ? "Meets core readiness checks with resume and role-match signals."
      : "Needs human review due to partial profile or weaker role-match signals.";

  return { vettingStatus, vettingSignals: signals, vettingSummary, vettingUpdatedAt: new Date(), vettingConfidenceBand };
}
