function safeText(v) {
  return typeof v === "string" ? v.trim() : "";
}

function hasPublicBusinessRoute(doc) {
  return Boolean(safeText(doc?.alias) || safeText(doc?.slug));
}

function isApprovedActiveBusiness(doc) {
  const status = safeText(doc?.status).toLowerCase();
  const approved = doc?.approved === true;
  return approved && status === "active";
}

function isPublicBusinessVisible(doc) {
  if (!isApprovedActiveBusiness(doc)) return false;
  if (!hasPublicBusinessRoute(doc)) return false;
  return (
    doc?.isComplete === true ||
    Number(doc?.completenessScore || 0) >= 70 ||
    Number(doc?.qualityScore || 0) >= 70 ||
    doc?.directoryVisibilityApproved === true
  );
}

function assert(name, condition) {
  if (!condition) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

const base = {
  approved: true,
  status: "active",
  alias: "sample-biz",
  business_name: "Sample Biz",
  description: "Useful factual description for reviewed business.",
  category: "Category",
  display_categories: "Display",
  completenessScore: 44,
  qualityScore: 0,
  isComplete: false,
};

assert(
  "normal unreviewed low-completeness record remains excluded",
  isPublicBusinessVisible({ ...base, directoryVisibilityApproved: false }) === false,
);
assert(
  "approved and active override record is included despite low completeness",
  isPublicBusinessVisible({ ...base, directoryVisibilityApproved: true }) === true,
);
assert(
  "inactive record stays excluded even with override",
  isPublicBusinessVisible({ ...base, status: "inactive", directoryVisibilityApproved: true }) === false,
);
assert(
  "unapproved record stays excluded even with override",
  isPublicBusinessVisible({ ...base, approved: false, directoryVisibilityApproved: true }) === false,
);
assert(
  "missing alias remains excluded",
  isPublicBusinessVisible({ ...base, alias: "", slug: "", directoryVisibilityApproved: true }) === false,
);
assert(
  "existing 7-of-9 pathway still works",
  isPublicBusinessVisible({ ...base, completenessScore: 78, isComplete: true, directoryVisibilityApproved: false }) === true,
);
assert(
  "existing qualityScore pathway still works",
  isPublicBusinessVisible({ ...base, qualityScore: 70, directoryVisibilityApproved: false }) === true,
);
