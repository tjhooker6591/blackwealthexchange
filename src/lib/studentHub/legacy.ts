import { studentHubCatalog } from "@/lib/studentHub/catalog";
import { deriveStudentHubLifecycle } from "@/lib/studentHub/lifecycle";

export type LegacyStudentHubPage =
  | "hub"
  | "internships"
  | "scholarships"
  | "grants"
  | "mentorship";

export type LegacyStudentHubRecord = {
  legacyId: string;
  title: string;
  organization: string;
  legacySourcePage: LegacyStudentHubPage;
  canonicalId: string;
};

export const legacyStudentHubRecords: LegacyStudentHubRecord[] = [
  {
    legacyId: "hub-1",
    title: "UNCF Scholarships & Programs",
    organization: "UNCF",
    legacySourcePage: "hub",
    canonicalId: "uncf-scholarships",
  },
  {
    legacyId: "hub-2",
    title: "TMCF Scholarships",
    organization: "Thurgood Marshall College Fund (TMCF)",
    legacySourcePage: "hub",
    canonicalId: "tmcf-scholarships",
  },
  {
    legacyId: "hub-3",
    title: "INROADS Career Development & Opportunities",
    organization: "INROADS",
    legacySourcePage: "hub",
    canonicalId: "inroads-internships",
  },
  {
    legacyId: "hub-4",
    title: "MLT Career Prep",
    organization: "Management Leadership for Tomorrow (MLT)",
    legacySourcePage: "hub",
    canonicalId: "mlt-career-prep",
  },
  {
    legacyId: "hub-5",
    title: "NSBE (STEM Community + Career Resources)",
    organization: "National Society of Black Engineers (NSBE)",
    legacySourcePage: "hub",
    canonicalId: "nsbe-student-resources",
  },
  {
    legacyId: "hub-6",
    title: "NABA Student Resources",
    organization: "National Association of Black Accountants (NABA)",
    legacySourcePage: "hub",
    canonicalId: "naba-student-resources",
  },
  {
    legacyId: "hub-7",
    title: "Scholarship Search",
    organization: "Scholarship America",
    legacySourcePage: "hub",
    canonicalId: "scholarship-america-search",
  },
  {
    legacyId: "hub-8",
    title: "NSF REU (Research Experiences for Undergraduates)",
    organization: "National Science Foundation",
    legacySourcePage: "hub",
    canonicalId: "nsf-reu",
  },
  {
    legacyId: "internships-1",
    title: "USAJOBS Pathways (Federal Internships)",
    organization: "USAJOBS / U.S. Federal Government",
    legacySourcePage: "internships",
    canonicalId: "usajobs-pathways",
  },
  {
    legacyId: "internships-2",
    title: "NIH Summer Internship Program (SIP)",
    organization: "National Institutes of Health",
    legacySourcePage: "internships",
    canonicalId: "nih-sip",
  },
  {
    legacyId: "internships-3",
    title: "NSF REU (Research Experiences for Undergraduates)",
    organization: "National Science Foundation",
    legacySourcePage: "internships",
    canonicalId: "nsf-reu",
  },
  {
    legacyId: "internships-4",
    title: "Google Careers — Student & Internship Roles",
    organization: "Google",
    legacySourcePage: "internships",
    canonicalId: "google-student-roles",
  },
  {
    legacyId: "internships-5",
    title: "Thurgood Marshall College Fund (TMCF) Opportunities",
    organization: "Thurgood Marshall College Fund (TMCF)",
    legacySourcePage: "internships",
    canonicalId: "tmcf-students-alumni-opportunities",
  },
  {
    legacyId: "internships-6",
    title: "HBCUConnect Internship & Job Board",
    organization: "HBCUConnect",
    legacySourcePage: "internships",
    canonicalId: "hbcuconnect-job-board",
  },
  {
    legacyId: "scholarships-1",
    title: "Jackie Robinson Foundation Scholarship",
    organization: "Jackie Robinson Foundation",
    legacySourcePage: "scholarships",
    canonicalId: "jackie-robinson-foundation-scholarship",
  },
  {
    legacyId: "scholarships-2",
    title: "Ron Brown Scholar Program",
    organization: "Ron Brown Scholar Program",
    legacySourcePage: "scholarships",
    canonicalId: "ron-brown-scholar-program",
  },
  {
    legacyId: "scholarships-3",
    title: "UNCF Scholarships (Search & Apply)",
    organization: "UNCF",
    legacySourcePage: "scholarships",
    canonicalId: "uncf-scholarships",
  },
  {
    legacyId: "grants-1",
    title: "Federal Pell Grant",
    organization: "Federal Student Aid",
    legacySourcePage: "grants",
    canonicalId: "pell-grant",
  },
  {
    legacyId: "grants-2",
    title: "Federal Supplemental Educational Opportunity Grant (FSEOG)",
    organization: "Federal Student Aid",
    legacySourcePage: "grants",
    canonicalId: "fseog",
  },
  {
    legacyId: "grants-3",
    title: "TEACH Grant",
    organization: "Federal Student Aid",
    legacySourcePage: "grants",
    canonicalId: "teach-grant",
  },
  {
    legacyId: "grants-4",
    title: "UNCF Emergency Student Aid",
    organization: "UNCF",
    legacySourcePage: "grants",
    canonicalId: "uncf-emergency-student-aid",
  },
  {
    legacyId: "mentorship-1",
    title: "MLT Career Prep",
    organization: "Management Leadership for Tomorrow (MLT)",
    legacySourcePage: "mentorship",
    canonicalId: "mlt-career-prep",
  },
  {
    legacyId: "mentorship-2",
    title: "INROADS",
    organization: "INROADS",
    legacySourcePage: "mentorship",
    canonicalId: "inroads-internships",
  },
  {
    legacyId: "mentorship-3",
    title: "SEO Career (Mentorship / Coach & Mentor network)",
    organization: "Sponsors for Educational Opportunity (SEO)",
    legacySourcePage: "mentorship",
    canonicalId: "seo-career",
  },
  {
    legacyId: "mentorship-4",
    title: "NSBE Professional Development Program",
    organization: "National Society of Black Engineers (NSBE)",
    legacySourcePage: "mentorship",
    canonicalId: "nsbe-professional-development",
  },
  {
    legacyId: "mentorship-5",
    title: "NABA Mentoring Program (Student-focused)",
    organization: "National Association of Black Accountants (NABA)",
    legacySourcePage: "mentorship",
    canonicalId: "naba-mentoring-program",
  },
  {
    legacyId: "mentorship-6",
    title: "The Posse Program",
    organization: "The Posse Foundation",
    legacySourcePage: "mentorship",
    canonicalId: "posse-foundation",
  },
];

export function getLegacyStudentHubReconciliation() {
  const canonicalById = new Map(
    studentHubCatalog.map((record) => [record.id, record]),
  );
  const rawCountByCanonicalId = legacyStudentHubRecords.reduce(
    (acc, record) => {
      acc.set(record.canonicalId, (acc.get(record.canonicalId) || 0) + 1);
      return acc;
    },
    new Map<string, number>(),
  );

  return legacyStudentHubRecords.map((legacyRecord) => {
    const canonicalRecord = canonicalById.get(legacyRecord.canonicalId) || null;
    const lifecycle = canonicalRecord
      ? deriveStudentHubLifecycle(canonicalRecord)
      : null;

    return {
      ...legacyRecord,
      canonicalRecordPresent: Boolean(canonicalRecord),
      duplicateGroup:
        rawCountByCanonicalId.get(legacyRecord.canonicalId)! > 1
          ? legacyRecord.canonicalId
          : null,
      lifecycleStatus: lifecycle?.status || "needs_review",
      sourceVerified: Boolean(canonicalRecord?.lastVerifiedAt),
      sourceUrl: canonicalRecord?.sourceUrl || null,
      applicationUrl: canonicalRecord?.applicationUrl || null,
      openDate: canonicalRecord?.opensAt || null,
      deadline: canonicalRecord?.deadline || null,
      lastVerified: canonicalRecord?.lastVerifiedAt || null,
    };
  });
}

export function getLegacyStudentHubSummary() {
  const reconciliation = getLegacyStudentHubReconciliation();
  const uniqueOpportunityTotal = new Set(
    reconciliation.map((record) => record.canonicalId),
  ).size;
  const duplicateRawRecords = reconciliation.length - uniqueOpportunityTotal;

  const counts = reconciliation.reduce(
    (acc, record) => {
      const key = record.lifecycleStatus;
      acc[key] += 1;
      return acc;
    },
    {
      open: 0,
      closing_soon: 0,
      upcoming: 0,
      closed: 0,
      needs_review: 0,
    },
  );

  return {
    legacyRecordTotal: reconciliation.length,
    uniqueOpportunityTotal,
    duplicateRawRecords,
    removedFromUniqueCountAsDuplicates: duplicateRawRecords,
    unaccountedRecords: 0,
    counts,
  };
}
