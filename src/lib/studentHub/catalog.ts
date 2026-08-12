export type StudentHubOpportunityType =
  | "scholarship"
  | "financial_aid"
  | "grant"
  | "internship"
  | "fellowship"
  | "research"
  | "student_job"
  | "mentorship"
  | "career_development"
  | "entrepreneurship"
  | "conference"
  | "event"
  | "hbcu_resource";

export type StudentHubStatus =
  | "open"
  | "upcoming"
  | "closing_soon"
  | "closed"
  | "needs_review";

export type StudentHubStudentLevel =
  | "high_school"
  | "undergraduate"
  | "graduate"
  | "any";

export type StudentHubAttendanceMode =
  | "remote"
  | "in_person"
  | "hybrid"
  | "any";

export type StudentHubEligibilityType =
  | "black_student_specific"
  | "black_student_targeted"
  | "hbcu_student_specific"
  | "hbcu_outreach"
  | "open_to_all_eligible_students"
  | "needs_review";

export type StudentHubInstitutionRelationship =
  | "hbcu"
  | "non_hbcu"
  | "multi_institution"
  | "none";

export type StudentHubCategoryPage =
  | "hub"
  | "scholarships"
  | "grants"
  | "internships"
  | "mentorship";

export type StudentHubRecord = {
  id: string;
  title: string;
  organization: string;
  opportunityType: StudentHubOpportunityType;
  categoryPages: StudentHubCategoryPage[];
  description: string;
  eligibilitySummary: string;
  eligibilityType: StudentHubEligibilityType;
  targetAudience?: string | null;
  institutionRelationship?: StudentHubInstitutionRelationship | null;
  discipline?: string | null;
  studentLevel: StudentHubStudentLevel;
  location?: string | null;
  attendanceMode: StudentHubAttendanceMode;
  opensAt?: string | null;
  deadline?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: StudentHubStatus;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  lastVerifiedAt?: string | null;
  lastCheckedAt?: string | null;
  nextReviewAt?: string | null;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  tags?: string[];
  statusNote?: string | null;
  howToApply?: string[];
  duplicateGroup?: string | null;
  sourceVerified?: boolean;
  applicationUrlVerified?: boolean;
  brokenLink?: boolean;
};

const AUDIT_DATE = "2026-08-12";
const CREATED_AT = "2026-08-12T00:00:00.000Z";

export const studentHubCatalog: StudentHubRecord[] = [
  {
    id: "uncf-scholarships",
    title: "UNCF Scholarships & Programs",
    organization: "UNCF",
    opportunityType: "scholarship",
    categoryPages: ["hub", "scholarships"],
    description:
      "Scholarship and program listings managed through UNCF's official opportunity portal.",
    eligibilitySummary:
      "Varies by scholarship; many opportunities require enrollment, GPA, and FAFSA-related financial aid details.",
    eligibilityType: "black_student_targeted",
    targetAudience:
      "Black students and other students who meet the official program criteria.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official UNCF scholarships portal",
    sourceUrl: "https://uncf.org/scholarships",
    applicationUrl: "https://uncf.org/scholarships",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    featured: true,
    tags: ["Scholarships", "Black students", "HBCU support"],
    statusNote:
      "Official UNCF scholarship listings were live on August 12, 2026, with currently open opportunities.",
    howToApply: [
      "Review the official UNCF scholarship listings.",
      "Match your profile to active opportunities.",
      "Submit materials by each individual deadline.",
    ],
    duplicateGroup: "uncf-scholarships",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "tmcf-scholarships",
    title: "TMCF Scholarships",
    organization: "Thurgood Marshall College Fund (TMCF)",
    opportunityType: "scholarship",
    categoryPages: ["hub", "internships"],
    description:
      "Scholarships and related student opportunities supporting HBCU, HBCC, and PBI students through TMCF's official portal.",
    eligibilitySummary:
      "Varies by scholarship; many opportunities focus on HBCU, HBCC, and PBI students or alumni.",
    eligibilityType: "hbcu_outreach",
    targetAudience:
      "Students at HBCUs, historically Black community colleges, and predominantly Black institutions where specified.",
    institutionRelationship: "hbcu",
    discipline: null,
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: "2026-08-03",
    deadline: "2027-04-23",
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official TMCF scholarships portal",
    sourceUrl: "https://tmcf.org/scholarships/open-scholarships/",
    applicationUrl: "https://tmcf.org/scholarships/open-scholarships/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    featured: true,
    tags: ["Scholarships", "HBCU", "TMCF"],
    statusNote:
      "TMCF's official open scholarships portal was live on August 12, 2026, and included currently open scholarships.",
    duplicateGroup: "tmcf-student-opportunities",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "inroads-internships",
    title: "INROADS Internship Program",
    organization: "INROADS",
    opportunityType: "internship",
    categoryPages: ["hub", "mentorship"],
    description:
      "Career readiness, coaching, and access to paid internships for college students.",
    eligibilitySummary:
      "College student requirements vary by program and employer partner.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience:
      "Students seeking paid internships and structured career development.",
    institutionRelationship: "multi_institution",
    discipline: "Business, STEM, finance, and related fields",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official INROADS internships program page",
    sourceUrl: "https://inroads.org/internships-program/",
    applicationUrl: "https://inroads.org/internships-program/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Internships", "Career development"],
    statusNote:
      "INROADS' official internships program page was live on August 12, 2026 and described an active paid internship pathway with mentorship and career readiness support.",
    duplicateGroup: "inroads",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "mlt-career-prep",
    title: "MLT Career Prep",
    organization: "Management Leadership for Tomorrow (MLT)",
    opportunityType: "career_development",
    categoryPages: ["hub", "mentorship"],
    description:
      "Structured coaching, community, and career readiness support for high-achieving undergraduates.",
    eligibilitySummary:
      "Primarily undergraduate students preparing for business, consulting, technology, and related career tracks.",
    eligibilityType: "black_student_targeted",
    targetAudience:
      "Black students and other undergraduates aligned with the official cohort criteria.",
    institutionRelationship: "multi_institution",
    discipline: "Business, consulting, technology, and corporate management",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "hybrid",
    opensAt: null,
    deadline: "2026-09-01",
    startsAt: null,
    endsAt: null,
    status: "closing_soon",
    source: "Official MLT Career Prep page",
    sourceUrl: "https://mlt.org/career-prep/",
    applicationUrl: "https://mlt.org/career-prep/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-08-25",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Career development", "Black students", "Mentorship"],
    statusNote:
      "MLT's official site showed the Career Prep application open on August 12, 2026, with upcoming track deadlines including September 1, 2026.",
    duplicateGroup: "mlt-career-prep",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "nsbe-student-resources",
    title: "NSBE Student Resources",
    organization: "National Society of Black Engineers (NSBE)",
    opportunityType: "career_development",
    categoryPages: ["hub"],
    description:
      "Programs, initiatives, career connections, and development resources across STEM pathways.",
    eligibilitySummary:
      "Open to students and professionals engaging with NSBE programs; individual initiatives vary.",
    eligibilityType: "black_student_targeted",
    targetAudience: "Students in STEM, especially Black engineering talent.",
    institutionRelationship: "multi_institution",
    discipline: "STEM",
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official NSBE programs landing page",
    sourceUrl: "https://nsbe.org/programs/",
    applicationUrl: "https://nsbe.org/programs/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["STEM", "Black students", "Professional development"],
    statusNote:
      "NSBE's official programs hub was live on August 12, 2026 and continues to present active student-facing academic, scholarship, and professional development resources.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "naba-student-resources",
    title: "NABA Student Resources",
    organization: "National Association of Black Accountants (NABA)",
    opportunityType: "career_development",
    categoryPages: ["hub"],
    description:
      "Student-facing accounting, finance, and career support resources through NABA.",
    eligibilitySummary:
      "Varies by chapter, membership status, and individual program.",
    eligibilityType: "black_student_targeted",
    targetAudience:
      "Students interested in accounting, finance, and business careers.",
    institutionRelationship: "multi_institution",
    discipline: "Finance and accounting",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official NABA organization site",
    sourceUrl: "https://www.nabainc.org/",
    applicationUrl: "https://www.nabainc.org/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Finance", "Business", "Mentorship"],
    statusNote:
      "NABA's official student programs and education resources were live on August 12, 2026 and continue to advertise student conferences, workforce development, and career readiness support.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "scholarship-america-search",
    title: "Scholarship Search",
    organization: "Scholarship America",
    opportunityType: "scholarship",
    categoryPages: ["hub"],
    description:
      "Broad scholarship search and planning resource that can complement more targeted Black student opportunity searches.",
    eligibilitySummary: "Varies by scholarship or scholarship search result.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience:
      "Students researching scholarships across institutions and majors.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official Scholarship America site",
    sourceUrl: "https://www.scholarshipamerica.org/",
    applicationUrl: "https://www.scholarshipamerica.org/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Scholarships", "Open to all students"],
    statusNote:
      "Scholarship America's official browse page was live on August 12, 2026 and explicitly surfaced currently open and upcoming scholarship opportunities.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "nsf-reu",
    title: "NSF REU (Research Experiences for Undergraduates)",
    organization: "National Science Foundation",
    opportunityType: "research",
    categoryPages: ["hub", "internships"],
    description:
      "University-hosted undergraduate research opportunities listed through NSF's official REU program hub.",
    eligibilitySummary:
      "Undergraduates; exact eligibility and deadlines vary by individual REU site.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience:
      "Undergraduates pursuing research experience, especially in STEM.",
    institutionRelationship: "multi_institution",
    discipline: "STEM",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official NSF REU information for students page",
    sourceUrl: "https://www.nsf.gov/funding/initiatives/reu/students",
    applicationUrl: "https://www.nsf.gov/funding/initiatives/reu/students",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Research", "STEM", "Undergraduate"],
    statusNote:
      "NSF's official REU student information page was live on August 12, 2026 and directs students to active REU site opportunities, though each site maintains its own dates.",
    duplicateGroup: "nsf-reu",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "jackie-robinson-foundation-scholarship",
    title: "Jackie Robinson Foundation Scholarship",
    organization: "Jackie Robinson Foundation",
    opportunityType: "scholarship",
    categoryPages: ["scholarships"],
    description:
      "Four-year scholarship and leadership program for graduating high school seniors.",
    eligibilitySummary:
      "Graduating high school seniors who meet citizenship, financial need, academic, and leadership criteria.",
    eligibilityType: "black_student_targeted",
    targetAudience: "Primarily graduating high school seniors.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "high_school",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: "2026-01-07",
    startsAt: null,
    endsAt: null,
    status: "closed",
    source: "Official Jackie Robinson Foundation application FAQ",
    sourceUrl: "https://jackierobinson.org/apply/application-faqs/",
    applicationUrl: "https://jackierobinson.org/apply/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-10-01",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Scholarship", "Leadership", "High school seniors"],
    statusNote:
      "The official FAQ still listed a January 7, 2026 deadline on August 12, 2026, so this cycle is treated as closed pending a confirmed next window.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "ron-brown-scholar-program",
    title: "Ron Brown Scholar Program",
    organization: "Ron Brown Scholar Program",
    opportunityType: "scholarship",
    categoryPages: ["scholarships"],
    description:
      "Prestige scholarship recognizing academic excellence, leadership, and service.",
    eligibilitySummary:
      "Black/African American high school seniors with strong academics, leadership, and service.",
    eligibilityType: "black_student_specific",
    targetAudience: "Black high school seniors.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "high_school",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official Ron Brown scholarship page",
    sourceUrl: "https://ronbrown.org/ron-brown-scholarship/",
    applicationUrl: "https://ronbrown.org/ron-brown-scholarship/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-01",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Scholarship", "Black students", "Leadership"],
    statusNote:
      "Ron Brown's official scholarship page stated on August 12, 2026 that the 2026 scholarship competition is currently open for eligible Black high school seniors.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "pell-grant",
    title: "Federal Pell Grant",
    organization: "Federal Student Aid",
    opportunityType: "financial_aid",
    categoryPages: ["grants"],
    description:
      "Need-based federal grant support for undergraduate students who file FAFSA and qualify.",
    eligibilitySummary:
      "Undergraduate students with financial need based on FAFSA and federal aid rules.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Students with financial need.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official Federal Student Aid Pell Grant page",
    sourceUrl: "https://studentaid.gov/understand-aid/types/grants/pell",
    applicationUrl: "https://studentaid.gov/h/apply-for-aid/fafsa",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Federal aid", "Need-based", "FAFSA"],
    statusNote:
      "Federal Student Aid continues to list Pell Grant information and eligibility as active.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "fseog",
    title: "Federal Supplemental Educational Opportunity Grant (FSEOG)",
    organization: "Federal Student Aid",
    opportunityType: "grant",
    categoryPages: ["grants"],
    description:
      "Campus-administered federal grant support for undergraduates with exceptional financial need.",
    eligibilitySummary:
      "Undergraduates with exceptional financial need at participating schools.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Students with exceptional financial need.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official Federal Student Aid FSEOG page",
    sourceUrl: "https://studentaid.gov/understand-aid/types/grants/fseog",
    applicationUrl: "https://studentaid.gov/h/apply-for-aid/fafsa",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Federal aid", "Need-based", "Campus-based"],
    statusNote:
      "Federal Student Aid continues to list FSEOG information and eligibility as active.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "teach-grant",
    title: "TEACH Grant",
    organization: "Federal Student Aid",
    opportunityType: "grant",
    categoryPages: ["grants"],
    description:
      "Federal grant support for students planning to teach in high-need fields and low-income areas.",
    eligibilitySummary:
      "Students in eligible teaching programs who can meet the TEACH service requirements.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Future teachers in eligible programs.",
    institutionRelationship: "multi_institution",
    discipline: "Education",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official Federal Student Aid TEACH Grant page",
    sourceUrl: "https://studentaid.gov/teach-grant-program",
    applicationUrl: "https://studentaid.gov/h/apply-for-aid/fafsa",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Federal aid", "Teaching", "Service requirement"],
    statusNote:
      "Federal Student Aid continues to list TEACH Grant information as active.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "uncf-emergency-student-aid",
    title: "UNCF Emergency Student Aid",
    organization: "UNCF",
    opportunityType: "grant",
    categoryPages: ["grants"],
    description:
      "Emergency support resource for students facing acute financial hardship.",
    eligibilitySummary:
      "Varies by campus or program criteria and may require documentation of emergency need.",
    eligibilityType: "black_student_targeted",
    targetAudience: "Students facing urgent financial barriers.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official UNCF Emergency Student Aid page",
    sourceUrl: "https://uncf.org/pages/cesa",
    applicationUrl: "https://uncf.org/pages/cesa",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Emergency aid", "UNCF"],
    statusNote:
      "UNCF's official Emergency Student Aid page was live on August 12, 2026. The prior legacy URL was broken and has been replaced with the current official ESA page.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "usajobs-pathways",
    title: "USAJOBS Pathways (Federal Internships)",
    organization: "USAJOBS / U.S. Federal Government",
    opportunityType: "internship",
    categoryPages: ["internships"],
    description:
      "Federal student and recent graduate hiring path with internships across agencies.",
    eligibilitySummary:
      "Student status required; exact requirements vary by agency posting.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Students seeking federal internships.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official USAJOBS students and recent graduates page",
    sourceUrl:
      "https://www.usajobs.gov/Help/working-in-government/unique-hiring-paths/students/",
    applicationUrl:
      "https://www.usajobs.gov/Help/working-in-government/unique-hiring-paths/students/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Internships", "Federal", "Open to all eligible students"],
    statusNote:
      "USAJOBS student pathway information remains active and publicly available.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "nih-sip",
    title: "NIH Summer Internship Program (SIP)",
    organization: "National Institutes of Health",
    opportunityType: "internship",
    categoryPages: ["internships"],
    description:
      "Research-focused summer internships across NIH labs and offices.",
    eligibilitySummary:
      "Varies by program and student level; see official NIH SIP criteria.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience:
      "Students pursuing STEM, biomedical, and health research experience.",
    institutionRelationship: "multi_institution",
    discipline: "STEM and health",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "in_person",
    opensAt: null,
    deadline: null,
    startsAt: "2027-06-01",
    endsAt: "2027-08-31",
    status: "upcoming",
    source: "Official NIH SIP page",
    sourceUrl: "https://www.training.nih.gov/research-training/pb/sip/",
    applicationUrl: "https://www.training.nih.gov/research-training/pb/sip/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-11-20",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Internship", "Research", "Upcoming"],
    statusNote:
      "NIH's official SIP page stated on August 12, 2026 that the SIP 2027 application will open in mid-November 2026 and close in mid-February 2027.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "google-student-roles",
    title: "Google Careers — Student & Internship Roles",
    organization: "Google",
    opportunityType: "internship",
    categoryPages: ["internships"],
    description:
      "Google's careers portal for internships and student roles across functions.",
    eligibilitySummary: "Varies by role and location.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Students pursuing internships or student roles.",
    institutionRelationship: "multi_institution",
    discipline: "Technology, design, business, and more",
    studentLevel: "any",
    location: "Global",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official Google Careers student internships page",
    sourceUrl:
      "https://careers.google.com/students/business-internships/?embed=true&hl=en_US",
    applicationUrl:
      "https://careers.google.com/students/business-internships/?embed=true&hl=en_US",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Internship", "Technology", "Open to all eligible students"],
    statusNote:
      "Google Careers' official student internships page was live on August 12, 2026 and continues to route students to current internship and student-role opportunities.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "tmcf-students-alumni-opportunities",
    title: "TMCF Opportunities",
    organization: "Thurgood Marshall College Fund (TMCF)",
    opportunityType: "internship",
    categoryPages: ["internships"],
    description:
      "Official TMCF student and alumni opportunities page spanning scholarships, programs, and career pathways.",
    eligibilitySummary: "Varies by opportunity and student background.",
    eligibilityType: "hbcu_outreach",
    targetAudience:
      "Students and alumni at HBCUs, HBCCs, and PBIs where specified.",
    institutionRelationship: "hbcu",
    discipline: null,
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official TMCF students and alumni page",
    sourceUrl: "https://www.tmcf.org/students-alumni/",
    applicationUrl: "https://www.tmcf.org/students-alumni/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["HBCU", "Internships", "Scholarships"],
    statusNote:
      "The official TMCF student opportunities page remained live on August 12, 2026.",
    duplicateGroup: "tmcf-student-opportunities",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "hbcuconnect-job-board",
    title: "HBCUConnect Internship & Job Board",
    organization: "HBCUConnect",
    opportunityType: "hbcu_resource",
    categoryPages: ["internships"],
    description:
      "HBCU-focused career board and recruiting resource with internships and jobs.",
    eligibilitySummary: "Varies by listing and employer.",
    eligibilityType: "hbcu_outreach",
    targetAudience:
      "Students interested in HBCU-connected recruiting and outreach opportunities.",
    institutionRelationship: "hbcu",
    discipline: null,
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official HBCUConnect jobs and internships board",
    sourceUrl: "https://hbcuconnect.com/jobs",
    applicationUrl: "https://hbcuconnect.com/jobs",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["HBCU", "Recruiting", "Career board"],
    statusNote:
      "HBCUConnect's official jobs and internships board was live on August 12, 2026 and remains a current HBCU-connected recruiting resource.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "seo-career",
    title: "SEO Career",
    organization: "Sponsors for Educational Opportunity (SEO)",
    opportunityType: "mentorship",
    categoryPages: ["mentorship"],
    description:
      "Recruiting, mentorship, and internship-readiness pathway for high-achieving undergraduates.",
    eligibilitySummary:
      "High-achieving undergraduates pursuing internship and career pathways.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Students seeking internship preparation and mentorship.",
    institutionRelationship: "multi_institution",
    discipline: "Business, finance, technology, and related fields",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "hybrid",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official SEO Career site",
    sourceUrl: "https://career.seo-usa.org/apply-faq/",
    applicationUrl: "https://career.seo-usa.org/apply-faq/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Mentorship", "Internship pipeline", "Career development"],
    statusNote:
      "SEO Career's official Apply & FAQ page was live on August 12, 2026 and states that applications are reviewed on a rolling basis year-round.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "nsbe-professional-development",
    title: "NSBE Professional Development Program",
    organization: "National Society of Black Engineers (NSBE)",
    opportunityType: "mentorship",
    categoryPages: ["mentorship"],
    description:
      "Professional development and skills-building resources connected to NSBE's STEM community.",
    eligibilitySummary: "Varies by NSBE program, membership, and initiative.",
    eligibilityType: "black_student_targeted",
    targetAudience:
      "Students and professionals engaging with NSBE development programs.",
    institutionRelationship: "multi_institution",
    discipline: "STEM",
    studentLevel: "any",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "open",
    source: "Official NSBE professional development page",
    sourceUrl: "https://nsbe.org/initiative/professional-development-program/",
    applicationUrl:
      "https://nsbe.org/initiative/professional-development-program/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["STEM", "Professional development", "Black students"],
    statusNote:
      "NSBE's official professional development page was live on August 12, 2026 and continues to present active coursework, workshops, and certifications.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "naba-mentoring-program",
    title: "NABA Mentoring Program",
    organization: "National Association of Black Accountants (NABA)",
    opportunityType: "mentorship",
    categoryPages: ["mentorship"],
    description:
      "Mentoring and chapter-based support for students pursuing accounting and finance pathways.",
    eligibilitySummary: "Varies by chapter and participation requirements.",
    eligibilityType: "black_student_targeted",
    targetAudience: "Students seeking accounting and finance mentorship.",
    institutionRelationship: "multi_institution",
    discipline: "Finance and accounting",
    studentLevel: "undergraduate",
    location: "United States",
    attendanceMode: "any",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "needs_review",
    source: "Official NABA mentoring page",
    sourceUrl:
      "https://community.nabainc.org/shpcchapter/aboutus/naba-mentoring-program",
    applicationUrl:
      "https://community.nabainc.org/shpcchapter/aboutus/naba-mentoring-program",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Mentorship", "Finance", "Black students"],
    statusNote:
      "The official NABA community mentoring page was live on August 12, 2026, but availability still depends on chapter-level program timing and should remain under review.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
  {
    id: "posse-foundation",
    title: "The Posse Program",
    organization: "The Posse Foundation",
    opportunityType: "mentorship",
    categoryPages: ["mentorship"],
    description:
      "Cohort-based leadership and college support model for students selected through Posse.",
    eligibilitySummary:
      "Selection and cohort rules vary by city and partner institution.",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "Students selected through Posse partner pipelines.",
    institutionRelationship: "multi_institution",
    discipline: null,
    studentLevel: "high_school",
    location: "United States",
    attendanceMode: "hybrid",
    opensAt: null,
    deadline: null,
    startsAt: null,
    endsAt: null,
    status: "needs_review",
    source: "Official Posse Foundation site",
    sourceUrl: "https://www.possefoundation.org/",
    applicationUrl: "https://www.possefoundation.org/",
    lastVerifiedAt: AUDIT_DATE,
    lastCheckedAt: AUDIT_DATE,
    nextReviewAt: "2026-09-12",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tags: ["Mentorship", "Leadership", "Cohort program"],
    statusNote:
      "The official Posse nomination process pages were live on August 12, 2026, but local nomination windows vary by city and should remain under review before being presented as universally open.",
    sourceVerified: true,
    applicationUrlVerified: true,
    brokenLink: false,
  },
];

export function getStudentHubRecords(
  page?: StudentHubCategoryPage,
): StudentHubRecord[] {
  if (!page) return studentHubCatalog;
  return studentHubCatalog.filter((record) =>
    record.categoryPages.includes(page),
  );
}

export function getStudentHubCounts() {
  return studentHubCatalog.reduce(
    (acc, record) => {
      acc.total += 1;
      acc[record.status] += 1;
      return acc;
    },
    {
      total: 0,
      open: 0,
      upcoming: 0,
      closing_soon: 0,
      closed: 0,
      needs_review: 0,
    },
  );
}
