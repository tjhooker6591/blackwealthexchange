export function publicBusinessBaseQuery() {
  return {
    $and: [
      {
        $or: [
          { status: "approved" },
          { status: "verified" },
          { status: "active" },
          { status: { $exists: false } },
          { status: "" },
          { status: null },
        ],
      },
      {
        $nor: [
          { isTest: true },
          { auditTag: { $exists: true } },
          { auditTag: /^BWE_LOCAL_AUDIT/i },
          { category: /^auditpagination$/i },
          { categories: /^auditpagination$/i },
          { display_categories: /^auditpagination$/i },
          { email: /@local\.test$/i },
          { business_name: /^auditpagination_/i },
          { name: /^auditpagination_/i },
        ],
      },
      {
        $or: [
          { alias: { $exists: true, $type: "string", $ne: "" } },
          { slug: { $exists: true, $type: "string", $ne: "" } },
        ],
      },
      {
        $or: [
          { isComplete: true },
          { completenessScore: { $gte: 70 } },
          { qualityScore: { $gte: 70 } },
          { directoryVisibilityApproved: true },
        ],
      },
    ],
  };
}
