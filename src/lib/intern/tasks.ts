// src/lib/intern/tasks.ts

/**
 * ============================================================
 * HOW TO ADD A NEW TASK (copy/paste steps)
 * ============================================================
 * 1) Scroll to the INTERN_TASKS array below.
 * 2) Copy the _TASK_TEMPLATE object.
 * 3) Paste it INSIDE the INTERN_TASKS array (before the closing ];
 * 4) Change:
 *    - id (must be unique, kebab-case)
 *    - title, summary, category, difficulty, estimatedHours, priority, tags
 *    - status, scope, assignee, dependsOn
 *    - context, steps, acceptanceCriteria, deliverables
 *
 * After saving:
 * - Task list:  /intern/tasks
 * - Task detail: /intern/tasks/<id>
 *   Example id "my-new-task" -> /intern/tasks/my-new-task
 */

export type InternTaskDifficulty = "easy" | "medium" | "hard";

export type InternTaskCategory =
  | "UI"
  | "Backend"
  | "Database"
  | "Security"
  | "Content"
  | "DX"
  | "Bugfix";

export type InternTaskStatus =
  | "backlog"
  | "needs_spec"
  | "ready"
  | "in_progress"
  | "in_review"
  | "ready_for_preview"
  | "qa_failed"
  | "ready_for_production"
  | "done"
  | "blocked"
  | "deferred";

export type InternTaskScope =
  | "frontend"
  | "backend"
  | "fullstack"
  | "content"
  | "devops"
  | "dx"
  | "security"
  | "database"
  | "research";

export type InternAssignee = "intern" | "senior_dev" | "thomas" | "unassigned";

export type InternTask = {
  id: string; // URL-safe unique ID (kebab-case)
  title: string;
  summary: string;
  category: InternTaskCategory;
  difficulty: InternTaskDifficulty;
  estimatedHours: number;

  // 1 = highest
  priority: 1 | 2 | 3;

  tags: string[];

  // NEW workflow fields
  status: InternTaskStatus;
  scope: InternTaskScope;
  assignee: InternAssignee;
  dependsOn: string[];

  context: string;
  steps: string[];
  acceptanceCriteria: string[];
  deliverables: string[];
  resources?: { label: string; url: string }[];
  stretchGoals?: string[];
};

/**
 * Copy this object to create a new task.
 * - Keep the property names the same.
 * - Only edit the values.
 *
 * NOTE: Leading underscore keeps ESLint happy when unused.
 */
const _TASK_TEMPLATE: InternTask = {
  id: "replace-me-unique-id",
  title: "Replace me: Task title",
  summary: "Replace me: 1 sentence summary of the task.",
  category: "DX",
  difficulty: "easy",
  estimatedHours: 1,
  priority: 3,
  tags: ["replace", "me"],

  status: "backlog",
  scope: "dx",
  assignee: "unassigned",
  dependsOn: [],

  context: "Explain why this task matters and what problem it solves.",
  steps: [
    "Step 1: What to do",
    "Step 2: What to do next",
    "Step 3: Verify it works",
  ],
  acceptanceCriteria: [
    "What must be true for this to be accepted",
    "No console errors",
    "No new lint errors",
  ],
  deliverables: [
    "PR with screenshots (desktop + mobile if UI)",
    "Short test plan in PR description",
  ],
  resources: [{ label: "Optional link label", url: "https://example.com" }],
  stretchGoals: ["Optional: nice-to-have improvement"],
};

// (Optional) A tiny helper for readability when you want to group tasks.
// You do NOT need to use this to add tasks.
function addTask(task: InternTask): InternTask {
  return task;
}

export const INTERN_TASKS: InternTask[] = [
  // ============================================================
  // 1) Production Stability + DevEx
  // ============================================================
  addTask({
    id: "prod-001-build-green",
    title: "Make build + lint green everywhere",
    summary:
      "Fix lint/type/build blockers and ensure next build passes in CI/Vercel consistently.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 4,
    priority: 1,
    tags: ["build", "lint", "vercel", "ci"],

    status: "ready",
    scope: "dx",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "A green build is the foundation for shipping fast without surprises in Preview/Production.",
    steps: [
      "Run `npm run lint` and `next build` locally and note all failures.",
      "Fix TypeScript, ESLint, and any import/path issues causing failures.",
      "Verify `next build` succeeds with no new warnings introduced.",
      "Confirm Vercel Preview deploy succeeds after PR is opened.",
    ],
    acceptanceCriteria: [
      "`npm run lint` passes with zero errors.",
      "`next build` passes successfully.",
      "Vercel Preview deployment completes successfully.",
      "No regressions in core pages (home, directory, marketplace, jobs).",
    ],
    deliverables: [
      "PR with fixes and a short summary of what was changed.",
      "Paste of build output showing success (or screenshot).",
    ],
  }),

  addTask({
    id: "prod-002-env-parity-audit",
    title: "Audit Vercel env vars + runtime config parity",
    summary:
      "Verify Mongo URI, JWT secret, Stripe keys/webhook secret, app URL, and storage keys are correct in prod.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 3,
    priority: 1,
    tags: ["env", "vercel", "stripe", "mongodb"],

    status: "ready",
    scope: "devops",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "Most “works locally but not in prod” issues come from env var mismatch.",
    steps: [
      "List required env vars for local + Preview + Production.",
      "Compare Vercel env vars with `.env.local` (names + presence).",
      "Verify webhook secrets match the correct endpoint (preview vs prod).",
      "Document the final env var set in a short internal note (PR description).",
    ],
    acceptanceCriteria: [
      "All required env vars exist in Vercel for Preview and Production.",
      "No incorrect/misspelled env names.",
      "Stripe keys/webhook secret correspond to the right environment.",
    ],
    deliverables: [
      "PR or documentation update (if stored in repo) listing required env vars (no secrets).",
    ],
  }),

  addTask({
    id: "prod-003-health-endpoints",
    title: "Add /api/health and /api/ready",
    summary:
      "Add endpoints verifying server and DB connectivity; return structured status.",
    category: "Backend",
    difficulty: "easy",
    estimatedHours: 2,
    priority: 2,
    tags: ["api", "health", "db"],

    status: "ready",
    scope: "backend",
    assignee: "intern",
    dependsOn: ["prod-002-env-parity-audit"],

    context: "Health endpoints reduce debugging time when prod issues occur.",
    steps: [
      "Create `/api/health` that returns `{ ok: true }`.",
      "Create `/api/ready` that pings MongoDB and returns status fields.",
      "Ensure responses are fast and do not expose secrets.",
      "Test locally and in Vercel Preview.",
    ],
    acceptanceCriteria: [
      "/api/health returns 200 and `{ ok: true }`.",
      "/api/ready returns 200 and includes DB connectivity status.",
      "No secrets are returned.",
    ],
    deliverables: ["PR with endpoints + quick test notes."],
  }),

  addTask({
    id: "prod-004-api-error-standard",
    title: "Standardize API errors + logging",
    summary:
      "Normalize error payloads, add safe logs, make failures actionable without exposing secrets.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 5,
    priority: 2,
    tags: ["api", "errors", "logging"],

    status: "ready",
    scope: "dx",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "Consistent API errors make frontend and QA faster and reduce broken edge cases.",
    steps: [
      "Define standard error shape (statusCode, code, message).",
      "Update key APIs to return consistent errors.",
      "Add safe server logs for failures (no secrets).",
      "Validate no UI breaks due to changed error shapes.",
    ],
    acceptanceCriteria: [
      "Key APIs return consistent error payloads.",
      "No sensitive info in logs or responses.",
      "No new lint/type errors introduced.",
    ],
    deliverables: [
      "PR with standardized error handling + summary of endpoints updated.",
    ],
  }),

  addTask({
    id: "prod-005-release-checklist",
    title: "Create release checklist + smoke test script",
    summary:
      "Document deploy steps; add minimal smoke tests for auth/search/marketplace/jobs/ads.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 4,
    priority: 3,
    tags: ["release", "smoke-test", "docs"],

    status: "backlog",
    scope: "dx",
    assignee: "thomas",
    dependsOn: ["prod-001-build-green", "prod-002-env-parity-audit"],

    context:
      "A checklist prevents recurring production mistakes and speeds up releases.",
    steps: [
      "Write a 10–15 step release checklist (env, build, preview QA, merge).",
      "Define a basic smoke test list (login, directory search, marketplace list, job list, ads).",
      "Store the checklist in repo docs (or in the PR template).",
    ],
    acceptanceCriteria: [
      "Checklist exists and is easy to follow.",
      "Smoke test list covers core revenue flows.",
    ],
    deliverables: ["PR adding checklist doc + a simple PR smoke-test section."],
  }),

  // ============================================================
  // 2) Auth + Roles + Routing
  // ============================================================
  addTask({
    id: "auth-001-signup-session",
    title: "Set session cookie on signup",
    summary:
      "Signup should authenticate and persist session immediately when valid.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 5,
    priority: 1,
    tags: ["auth", "signup", "cookies"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["prod-002-env-parity-audit"],

    context:
      "Users dropping after signup is a conversion killer. Signup should behave like login.",
    steps: [
      "Update signup API to set `session_token` (and accountType) cookies like login.",
      "Ensure cookie options are correct for prod (secure, httpOnly, sameSite).",
      "Update client flow to treat signup success as logged-in state.",
      "Test locally + Vercel Preview.",
    ],
    acceptanceCriteria: [
      "After signup, user is authenticated without re-logging in.",
      "Session persists on refresh.",
      "No cookie/security regressions.",
    ],
    deliverables: ["PR with signup session persistence + test notes."],
  }),

  addTask({
    id: "auth-002-role-guards",
    title: "Role-based route guards",
    summary:
      "Block unauthorized access and redirect cleanly based on accountType.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 1,
    tags: ["auth", "rbac", "routing"],

    status: "ready",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["auth-001-signup-session"],

    context:
      "Role guards protect revenue features and reduce confusing navigation for users.",
    steps: [
      "Define which routes require which roles.",
      "Implement guard logic (server/API + client redirects as needed).",
      "Ensure unauth users are redirected to login, and wrong-role users are redirected safely.",
      "Test seller/employer/admin routes with different account types.",
    ],
    acceptanceCriteria: [
      "Unauthorized users cannot access protected pages.",
      "Correct redirects occur for each role.",
      "No infinite redirect loops.",
    ],
    deliverables: ["PR with role guards + matrix of routes tested."],
  }),

  addTask({
    id: "auth-003-forgot-password",
    title: "Forgot password end-to-end",
    summary:
      "Token, email send, reset form, token validation, password update.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 3,
    tags: ["auth", "email", "reset"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["auth-005-session-hardening"],

    context:
      "Password reset reduces support load and improves real-world usability.",
    steps: [
      "Create token generation + storage/expiry.",
      "Send reset email with link containing token.",
      "Build reset page to set new password (token validated).",
      "Invalidate token after use and log event.",
    ],
    acceptanceCriteria: [
      "Reset email can be requested and received.",
      "Token expires and cannot be reused.",
      "Password updates successfully and user can log in afterward.",
    ],
    deliverables: ["PR + manual test steps + screenshots of reset flow."],
  }),

  addTask({
    id: "auth-004-role-upgrade-flow",
    title: "Account upgrade flow (user → seller/employer/business)",
    summary: "One identity: upgrade role safely, update DB and permissions.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 2,
    tags: ["auth", "roles", "upgrade"],

    status: "needs_spec",
    scope: "backend",
    assignee: "thomas",
    dependsOn: ["auth-002-role-guards"],

    context:
      "A clean upgrade path enables growth without fragmenting users across collections.",
    steps: [
      "Define upgrade rules (which roles can upgrade, data migration rules).",
      "Design API + UI flow for upgrade.",
      "Implement upgrade with audit logging.",
      "Test upgrades with existing sessions/cookies.",
    ],
    acceptanceCriteria: [
      "Upgrade rules documented.",
      "User can upgrade and access new role pages.",
      "No broken sessions after upgrade.",
    ],
    deliverables: ["Spec doc or PR notes with rules + implemented flow."],
  }),

  addTask({
    id: "auth-005-session-hardening",
    title: "Harden session cookies and JWT validation",
    summary:
      "Refresh expiry rules, consistent cookie options, revoke/logout reliability.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 2,
    tags: ["security", "jwt", "cookies"],

    status: "ready",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["auth-001-signup-session"],

    context:
      "Session reliability and security are required for payments, admin, and role gating.",
    steps: [
      "Review cookie flags and expiry behavior in prod/preview.",
      "Ensure logout revokes session correctly and UI updates.",
      "Tighten JWT verification and invalid token handling.",
      "Test across account types.",
    ],
    acceptanceCriteria: [
      "Logout reliably clears sessions.",
      "Invalid/expired tokens are handled cleanly.",
      "Cookie options consistent across envs.",
    ],
    deliverables: ["PR + test matrix (user/seller/employer/admin)."],
  }),

  // ============================================================
  // 3) Business Directory + Search (Revenue Core)
  // ============================================================
  addTask({
    id: "dir-001-public-search-api",
    title: "Business directory search API (paged, fast)",
    summary:
      "/api/businesses/search with pagination, text search, category, city/state, verified/sponsored filters.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 1,
    tags: ["directory", "search", "api", "pagination"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["prod-002-env-parity-audit"],

    context:
      "Directory search is a core user loop and a major revenue driver (sponsored placement).",
    steps: [
      "Implement search endpoint with query params and pagination.",
      "Support filters: category, city/state, verified, sponsored.",
      "Return stable sort options and consistent response shape.",
      "Add basic input validation and rate limiting if needed.",
    ],
    acceptanceCriteria: [
      "API supports pagination and filters.",
      "Search is performant on realistic dataset sizes.",
      "Response shape is documented and stable.",
    ],
    deliverables: [
      "PR with endpoint + sample curl requests in PR description.",
    ],
  }),

  addTask({
    id: "dir-002-mongo-indexes",
    title: "Add MongoDB indexes for directory search",
    summary:
      "Text + compound indexes for name/tags/category/location/sponsor priority.",
    category: "Database",
    difficulty: "medium",
    estimatedHours: 4,
    priority: 1,
    tags: ["mongodb", "indexes", "directory"],

    status: "ready",
    scope: "database",
    assignee: "senior_dev",
    dependsOn: ["dir-001-public-search-api"],

    context: "Indexes keep directory search fast as listings scale.",
    steps: [
      "Identify query patterns used by search endpoint.",
      "Add text + compound indexes to support filters and sorts.",
      "Validate no breaking changes and measure basic performance improvement.",
    ],
    acceptanceCriteria: [
      "Indexes exist and match search query patterns.",
      "Search endpoint remains correct.",
    ],
    deliverables: [
      "PR with index creation migration/script + brief explanation.",
    ],
  }),

  addTask({
    id: "dir-003-directory-ui",
    title: "Directory UI: search + filters + pagination",
    summary:
      "Search bar, chips, location filters, verified toggle, pagination/infinite scroll, empty states.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 1,
    tags: ["directory", "ui", "filters", "mobile"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["dir-001-public-search-api"],

    context: "A strong directory UI increases engagement and ad conversion.",
    steps: [
      "Build directory list page consuming the search API.",
      "Add category/location filters and search input.",
      "Implement pagination or infinite scroll.",
      "Add empty-state CTAs: 'Add Your Business' and 'Promote'.",
      "Do a mobile-first pass for layout and tap targets.",
    ],
    acceptanceCriteria: [
      "Search and filters update results correctly.",
      "Pagination/infinite scroll works without duplication.",
      "Mobile UI is clean and usable.",
      "No console errors and no new lint errors.",
    ],
    deliverables: ["PR with screenshots (desktop + mobile) and test notes."],
  }),

  addTask({
    id: "dir-004-business-profile-page",
    title: "Public business profile page",
    summary:
      "Details, gallery, contact, hours, links, and “Promote this Business” CTA.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["directory", "profile", "cta"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["dir-003-directory-ui"],

    context:
      "Profile pages are where leads happen (calls, clicks, conversions).",
    steps: [
      "Create business detail route/page with clear info hierarchy.",
      "Add contact buttons (phone/email/website) and hours/location blocks.",
      "Add image gallery/logo area (placeholder if needed).",
      "Add CTA: 'Promote this Business'.",
    ],
    acceptanceCriteria: [
      "Business detail page renders correctly for real data.",
      "CTA is visible and routes to promote flow.",
      "Mobile layout is readable and buttons are tappable.",
    ],
    deliverables: ["PR with screenshots + tested business IDs/URLs."],
  }),

  addTask({
    id: "dir-005-click-tracking",
    title: "Track clicks/leads (phone/email/site/directions)",
    summary: "Record engagement events for analytics and future ad pricing.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 3,
    tags: ["analytics", "events", "directory"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["dir-004-business-profile-page"],

    context: "Tracking clicks enables ROI reporting and premium upsells.",
    steps: [
      "Define event schema (businessId, eventType, timestamp).",
      "Add API endpoint to record events.",
      "Fire events from profile page CTA buttons.",
      "Add basic rate limiting to reduce spam.",
    ],
    acceptanceCriteria: [
      "Events are recorded reliably for each click type.",
      "No PII leakage in logs.",
    ],
    deliverables: ["PR + simple query examples to validate events in DB."],
  }),

  addTask({
    id: "dir-006-add-business-form",
    title: "“Add Your Business” submission form",
    summary:
      "Capture listing data + owner email, uploads/logo, store as pending.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["directory", "form", "onboarding"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["dir-001-public-search-api"],

    context:
      "This is the acquisition channel for the directory and future paid promotions.",
    steps: [
      "Build the form UI with validation and helpful hints.",
      "Add required fields (name, category, location, contact).",
      "Add optional fields (hours, socials, images).",
      "Connect to submission API and show success state.",
    ],
    acceptanceCriteria: [
      "Form validates required fields.",
      "Submission succeeds and shows confirmation.",
      "No new lint errors and mobile form is usable.",
    ],
    deliverables: ["PR with screenshots + test submission notes."],
  }),

  addTask({
    id: "dir-007-submit-business-api",
    title: "Business submission API with validation + spam controls",
    summary:
      "Validate inputs, prevent dupes, store status=pending, and rate limit.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["directory", "api", "validation"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["dir-006-add-business-form"],

    context:
      "A safe submission pipeline prevents junk data and supports admin approval.",
    steps: [
      "Create endpoint to accept business submissions.",
      "Validate payload, normalize fields, block duplicates.",
      "Store record as pending and attach timestamps.",
      "Add basic rate limiting to reduce spam.",
    ],
    acceptanceCriteria: [
      "Valid submissions are stored as pending.",
      "Duplicate submissions are handled gracefully.",
      "Basic rate limiting or abuse mitigation exists.",
    ],
    deliverables: ["PR + sample request payload in PR description."],
  }),

  addTask({
    id: "dir-008-claim-listing",
    title: "Claim existing business listing",
    summary:
      "Owner verification + claim workflow; connects to account upgrade.",
    category: "Security",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 3,
    tags: ["directory", "claim", "verification"],

    status: "needs_spec",
    scope: "security",
    assignee: "thomas",
    dependsOn: ["auth-004-role-upgrade-flow", "dir-007-submit-business-api"],

    context:
      "Claiming creates trust and unlocks paid business tools without duplicating listings.",
    steps: [
      "Define claim policy (email verification, proof requirements).",
      "Design claim request + admin approval option (if needed).",
      "Implement claim endpoint and UI flow.",
      "Add audit log entry for claim actions.",
    ],
    acceptanceCriteria: [
      "Claim policy documented.",
      "Owner can initiate claim and complete verification.",
      "No unauthorized claims are possible.",
    ],
    deliverables: ["Spec notes + PR implementing claim workflow."],
  }),

  // ============================================================
  // 4) Directory Ads + Sponsored Listings (Big Revenue Area)
  // ============================================================
  addTask({
    id: "dirads-001-packages-pricing",
    title: "Define directory ad packages + placements + pricing",
    summary:
      "Sponsored Listing, Featured Card, Category Sponsor, Top Banner; durations; rules.",
    category: "Content",
    difficulty: "medium",
    estimatedHours: 3,
    priority: 1,
    tags: ["directory", "ads", "pricing"],

    status: "ready",
    scope: "content",
    assignee: "thomas",
    dependsOn: [],

    context:
      "This is the monetization model for the directory—must be defined before checkout/webhook logic.",
    steps: [
      "Define each package’s placement and benefits.",
      "Set pricing + durations (weekly/monthly/quarterly).",
      "Define rules: renewal, expiration, refund/cancel policy baseline.",
      "Write a short internal spec (PR description or doc).",
    ],
    acceptanceCriteria: [
      "Packages list is finalized and documented.",
      "Each package has duration and pricing.",
    ],
    deliverables: [
      "Doc/notes with packages, price, duration, and placement rules.",
    ],
  }),

  addTask({
    id: "dirads-002-promote-business-ui",
    title: "Promote Business flow UI",
    summary:
      "Choose package/duration, preview placement, confirm, proceed to pay.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 1,
    tags: ["directory", "ads", "checkout", "ui"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["dir-004-business-profile-page", "dirads-001-packages-pricing"],

    context: "This is the primary paid conversion UI for directory revenue.",
    steps: [
      "Create promote flow page and route from business profile CTA.",
      "Show package options + durations and a simple preview area.",
      "Collect required info and start checkout (calls backend).",
      "Add success/cancel states after checkout returns.",
    ],
    acceptanceCriteria: [
      "User can select a package and proceed to checkout.",
      "Preview/summary of purchase is clear.",
      "Mobile UI works well.",
    ],
    deliverables: ["PR with screenshots + happy path tested notes."],
  }),

  addTask({
    id: "dirads-003-stripe-checkout",
    title: "Stripe checkout for directory ad packages",
    summary:
      "Checkout session with metadata (businessId, packageType, start/end).",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 1,
    tags: ["stripe", "checkout", "directory-ads"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["dirads-001-packages-pricing", "prod-002-env-parity-audit"],

    context:
      "Checkout metadata is required for webhook activation and expiration handling.",
    steps: [
      "Create API endpoint that creates a Stripe Checkout Session.",
      "Attach metadata: businessId, packageType, duration, start/end (or durationDays).",
      "Return checkout URL to frontend.",
      "Test with Stripe test mode.",
    ],
    acceptanceCriteria: [
      "Checkout session created successfully with correct metadata.",
      "Frontend can redirect to Stripe checkout.",
      "No secrets logged or returned.",
    ],
    deliverables: ["PR + test steps + example metadata used."],
  }),

  addTask({
    id: "dirads-004-webhook-activate",
    title: "Webhook activates sponsor status + expiration",
    summary:
      "Payment success activates package, sets end date, auto-expire and revert.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 1,
    tags: ["stripe", "webhook", "expiration"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["dirads-003-stripe-checkout", "prod-004-api-error-standard"],

    context:
      "This makes the paid package actually take effect automatically—critical revenue automation.",
    steps: [
      "Implement webhook handler to capture successful payment events.",
      "Verify signature with webhook secret.",
      "Activate sponsored fields on the business and create ad record if needed.",
      "Set expiration/end date and ensure expiration logic exists (cron-like job or request-time check).",
    ],
    acceptanceCriteria: [
      "Paid checkout results in business becoming sponsored.",
      "Expiration is stored and can be enforced.",
      "Webhook signature verification works.",
    ],
    deliverables: ["PR + webhook test notes + proof of DB updates."],
  }),

  addTask({
    id: "dirads-005-ranking-rotation",
    title: "Sponsored ranking + fair rotation rules",
    summary:
      "Sponsored > verified > relevance; rotate among sponsors to avoid monopolies.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["ranking", "rotation", "directory"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["dirads-004-webhook-activate", "dir-001-public-search-api"],

    context:
      "Sponsored ranking is the value proposition. Rotation makes sponsorship fair and credible.",
    steps: [
      "Define ranking rules and sponsored weighting.",
      "Implement sorting/rotation in search results.",
      "Ensure expired sponsorships do not rank.",
      "Test with multiple sponsored businesses in same category.",
    ],
    acceptanceCriteria: [
      "Sponsored businesses appear above non-sponsored results.",
      "Expired sponsors do not appear as sponsored.",
      "Rotation is fair and consistent.",
    ],
    deliverables: [
      "PR + test data description and screenshots of result ordering.",
    ],
  }),

  addTask({
    id: "dirads-006-category-sponsor-slot",
    title: "Category sponsor banner slot",
    summary:
      "One sponsor per category per period; show on directory + category pages.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["category", "sponsor", "banner"],

    status: "backlog",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["dirads-004-webhook-activate", "dir-003-directory-ui"],

    context:
      "Category sponsorship is premium real estate and increases ad ARPU.",
    steps: [
      "Add model fields for category sponsor placements.",
      "Render category sponsor banner in UI.",
      "Ensure expiration and replacement logic works.",
    ],
    acceptanceCriteria: [
      "Category sponsor banner displays correctly.",
      "Only one sponsor active per category at a time.",
      "Expiration is enforced.",
    ],
    deliverables: ["PR with UI screenshots + verification notes."],
  }),

  addTask({
    id: "dirads-007-ads-dashboard",
    title: "Business ads performance dashboard",
    summary: "Impressions, clicks, leads, spend, expiration, renew CTA.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["dashboard", "ads", "analytics"],

    status: "backlog",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["dirads-008-impressions-tracking"],

    context:
      "A reporting dashboard improves renewals and makes pricing defensible.",
    steps: [
      "Create dashboard page layout for ad performance.",
      "Display metrics from API (impressions/clicks/leads).",
      "Add expiration and renew CTA.",
    ],
    acceptanceCriteria: [
      "Dashboard renders correctly for a sponsored business.",
      "Metrics display with sane defaults (0) when none exist.",
      "Mobile layout is clean.",
    ],
    deliverables: ["PR with screenshots + test notes."],
  }),

  addTask({
    id: "dirads-008-impressions-tracking",
    title: "Reliable impression + click tracking + bot filtering",
    summary:
      "Count views with safeguards; rate limit; basic anomaly detection.",
    category: "DX",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 3,
    tags: ["analytics", "tracking", "rate-limit"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["dirads-005-ranking-rotation", "sec-001-rate-limit-sensitive"],

    context: "Impression tracking supports ROI reporting and reduces disputes.",
    steps: [
      "Define impression event schema and storage strategy.",
      "Implement event recording with safeguards (dedupe per session/time window).",
      "Add basic bot/abuse mitigation.",
    ],
    acceptanceCriteria: [
      "Impressions are recorded with dedupe safeguards.",
      "Rate limiting reduces obvious abuse.",
    ],
    deliverables: ["PR + sample DB queries or admin checks."],
  }),

  addTask({
    id: "dirads-009-featured-home-spotlight",
    title: "Featured business spotlight module on homepage",
    summary: "Paid rotating spotlight with CTA into directory profile.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 3,
    tags: ["homepage", "spotlight", "sponsored"],

    status: "backlog",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["dirads-004-webhook-activate"],

    context:
      "Homepage spotlight is premium inventory for businesses and boosts directory traffic.",
    steps: [
      "Create spotlight component that pulls featured sponsors.",
      "Add rotation logic on the frontend (or consume backend ordering).",
      "Ensure it matches the black/gold theme and is non-obtrusive.",
    ],
    acceptanceCriteria: [
      "Spotlight renders correctly and links to business profile pages.",
      "Does not break layout on mobile.",
    ],
    deliverables: ["PR with screenshots (desktop + mobile)."],
  }),

  // ============================================================
  // 5) Platform-wide Ads (Non-directory placements)
  // ============================================================
  addTask({
    id: "ads-001-ad-options-ui",
    title: "Advertising options selection page",
    summary: "Placements, specs, pricing, durations, examples, CTAs.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 2,
    tags: ["ads", "ui", "pricing"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context:
      "Clear ad options increase conversion and reduce back-and-forth with advertisers.",
    steps: [
      "Build ad options page listing placements and pricing.",
      "Add specs (sizes/file formats) and examples.",
      "Add CTAs to start campaign flow.",
      "Mobile pass and verify routing.",
    ],
    acceptanceCriteria: [
      "Options are clear and clickable.",
      "Specs are visible and accurate (placeholders ok).",
      "No broken links or console errors.",
    ],
    deliverables: ["PR with screenshots + navigation tested."],
  }),

  addTask({
    id: "ads-002-ad-review-step",
    title: "Review + preview step before payment",
    summary:
      "Upload creative, choose dates, preview placement, confirm details.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 2,
    tags: ["ads", "preview", "checkout"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["ads-001-ad-options-ui"],

    context:
      "A review step prevents mistaken purchases and reduces refunds/disputes.",
    steps: [
      "Create step-based UI: details → review → pay.",
      "Show a placement preview mock (even if basic).",
      "Validate date ranges and required fields.",
    ],
    acceptanceCriteria: [
      "User can review all selections before paying.",
      "Validation prevents empty/malformed submissions.",
      "Mobile layout is clean.",
    ],
    deliverables: ["PR with screenshots + test notes."],
  }),

  addTask({
    id: "ads-003-webhook-activation",
    title: "Stripe webhook activates ads + sets expiration",
    summary:
      "Post-payment activate ad, schedule expiration, handle cancellations/refunds.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 2,
    tags: ["stripe", "webhook", "ads"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["prod-002-env-parity-audit", "prod-004-api-error-standard"],

    context:
      "Automation turns ad purchases into live campaigns without manual admin work.",
    steps: [
      "Implement webhook for ad purchases with signature verification.",
      "Activate ad record and set start/end dates.",
      "Handle cancellations/refunds (at least mark inactive).",
      "Test end-to-end with Stripe test mode.",
    ],
    acceptanceCriteria: [
      "Payment success results in active ad record.",
      "Expiration is stored and enforced.",
      "Webhook signatures are verified.",
    ],
    deliverables: ["PR + webhook test notes + DB proof."],
  }),

  addTask({
    id: "ads-004-ad-renderer",
    title: "Ad renderer system by placement",
    summary:
      "Components for homepage banner, sidebar tiles, directory slots, etc.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["ads", "components", "placements"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["ads-001-ad-options-ui"],

    context:
      "A renderer lets you plug ads into multiple site areas without custom work each time.",
    steps: [
      "Define placement enum/strings used by ads.",
      "Create reusable components for each placement type.",
      "Add a small wrapper that selects the correct component by placement.",
      "Verify responsive behavior and safe fallbacks when no ads exist.",
    ],
    acceptanceCriteria: [
      "Ads render for at least 2 placements with safe fallbacks.",
      "No layout shift issues on mobile.",
      "No new lint errors.",
    ],
    deliverables: ["PR with screenshots and placement examples."],
  }),

  addTask({
    id: "ads-005-ad-reporting",
    title: "Ad metrics and reporting",
    summary: "Impressions/clicks per campaign with basic dashboard.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["analytics", "ads", "dashboard"],

    status: "backlog",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["ads-003-webhook-activation", "ana-001-event-tracking-core"],

    context: "Reporting increases renewals and improves advertiser trust.",
    steps: [
      "Define events for impression/click per placement.",
      "Record events with basic dedupe/rate limiting.",
      "Add a simple dashboard view for campaigns.",
    ],
    acceptanceCriteria: [
      "Events recorded for impressions/clicks.",
      "Dashboard shows metrics by campaign.",
    ],
    deliverables: ["PR + sample metrics screenshots."],
  }),

  // ============================================================
  // 6) Marketplace (Conversion + Commission)
  // ============================================================
  addTask({
    id: "mkt-001-public-products-fix",
    title: "Fix public marketplace showing no products in prod",
    summary: "Debug API/filter/env/data; ensure products show publicly.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 8,
    priority: 1,
    tags: ["marketplace", "prod", "bugfix"],

    status: "ready",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["prod-002-env-parity-audit"],

    context:
      "If products don’t show publicly, marketplace conversion goes to zero.",
    steps: [
      "Confirm product query filters (isPublished/status) match stored data.",
      "Verify uploads/paths and API responses in prod.",
      "Fix env mismatch or routing issues (Preview vs Prod).",
      "Add minimal logs/health checks for product listing endpoint.",
    ],
    acceptanceCriteria: [
      "Marketplace lists published products in production.",
      "Filters behave consistently across envs.",
    ],
    deliverables: ["PR + before/after proof (screenshots or logs)."],
  }),

  addTask({
    id: "mkt-002-seed-products",
    title: "Seed 10–20 real products in prod",
    summary: "Safe seed + remove scripts; include Pamfa + demo partners.",
    category: "Database",
    difficulty: "medium",
    estimatedHours: 4,
    priority: 1,
    tags: ["seed", "products", "pamfa"],

    status: "ready",
    scope: "database",
    assignee: "thomas",
    dependsOn: ["mkt-001-public-products-fix"],

    context:
      "A marketplace with real inventory looks alive and increases trust.",
    steps: [
      "Create a seed script or admin tool to add products safely.",
      "Add at least 10–20 products with images, prices, categories.",
      "Verify products appear publicly and in seller view (if applicable).",
    ],
    acceptanceCriteria: [
      "At least 10 products appear publicly in marketplace.",
      "No broken images or missing fields.",
    ],
    deliverables: [
      "List of seeded products + screenshots of marketplace grid.",
    ],
  }),

  addTask({
    id: "mkt-003-search-filtering",
    title: "Marketplace search + category filters",
    summary: "Query params + UI filters; consistent results and pagination.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 5,
    priority: 2,
    tags: ["marketplace", "filters", "search"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["mkt-001-public-products-fix"],

    context: "Filtering improves product discovery and increases conversions.",
    steps: [
      "Add search input and category filter UI.",
      "Wire filters to API query params and update results.",
      "Add empty-state messaging and clear filters button.",
      "Mobile layout check.",
    ],
    acceptanceCriteria: [
      "Search returns relevant products.",
      "Category filter works and can be cleared.",
      "No console errors.",
    ],
    deliverables: ["PR with screenshots and test notes."],
  }),

  addTask({
    id: "mkt-004-product-card-polish",
    title: "Product cards polish (badges, shipping note, trust signals)",
    summary:
      "Featured badges, availability, seller profile link, clear shipping disclaimers.",
    category: "UI",
    difficulty: "easy",
    estimatedHours: 4,
    priority: 2,
    tags: ["marketplace", "ui", "cards"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["mkt-003-search-filtering"],

    context:
      "Better cards increase click-through and reduce buyer uncertainty.",
    steps: [
      "Add badge support (Featured, New, Limited).",
      "Show seller name/link and basic availability info.",
      "Add short shipping disclaimer text (platform is middleman).",
      "Ensure consistent spacing and responsive design.",
    ],
    acceptanceCriteria: [
      "Cards display badges without layout issues.",
      "Shipping disclaimer is visible (but not noisy).",
      "Mobile grid looks clean.",
    ],
    deliverables: ["PR with screenshots (desktop + mobile)."],
  }),

  addTask({
    id: "mkt-005-product-detail-flow",
    title: "Buying/contact flow",
    summary:
      "Stripe checkout OR secure messaging/contact; must enable real action.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 1,
    tags: ["checkout", "contact", "conversion"],

    status: "needs_spec",
    scope: "fullstack",
    assignee: "thomas",
    dependsOn: ["mkt-001-public-products-fix", "mkt-010-cloud-uploads"],

    context:
      "Product pages must lead to a real action: buy now or contact seller.",
    steps: [
      "Decide primary flow: direct checkout vs contact-first.",
      "Implement the chosen flow end-to-end.",
      "Add success/cancel states and basic logging.",
    ],
    acceptanceCriteria: [
      "Buyer can complete an action from product detail page.",
      "Flow works in Vercel Preview and Production.",
    ],
    deliverables: ["Spec decision + PR implementing the flow."],
  }),

  addTask({
    id: "mkt-006-seller-publish",
    title: "Publish/unpublish + inventory updates",
    summary: "Visibility controls, stock updates, price edits, audit log.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 2,
    tags: ["seller", "publish", "inventory"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["auth-002-role-guards"],

    context:
      "Sellers need control over what’s visible and in stock. This is core marketplace ops.",
    steps: [
      "Add endpoints for publish/unpublish and stock updates.",
      "Update seller dashboard to call these endpoints.",
      "Add minimal audit logging of changes.",
      "Test with multiple products and permissions.",
    ],
    acceptanceCriteria: [
      "Seller can publish/unpublish products.",
      "Stock changes persist and reflect in public views.",
    ],
    deliverables: ["PR + test notes showing before/after."],
  }),

  addTask({
    id: "mkt-007-variants-sku",
    title: "Variants + SKU + per-variant stock",
    summary: "Sizes/colors, variant selection UI, stock tracking.",
    category: "Database",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 3,
    tags: ["variants", "sku", "inventory"],

    status: "backlog",
    scope: "database",
    assignee: "senior_dev",
    dependsOn: ["mkt-006-seller-publish"],

    context:
      "Variants are required for real apparel selling and accurate inventory.",
    steps: [
      "Define variant schema in DB.",
      "Update product create/edit flows.",
      "Update product detail page to select a variant.",
      "Update stock tracking per variant.",
    ],
    acceptanceCriteria: [
      "Variants can be created/edited and selected on product page.",
      "Stock is tracked per variant correctly.",
    ],
    deliverables: ["PR + example product with variants."],
  }),

  addTask({
    id: "mkt-008-order-model",
    title: "Orders + statuses + buyer/seller history",
    summary: "Order records, statuses, receipts, dashboard views.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 2,
    tags: ["orders", "history", "status"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["mkt-005-product-detail-flow"],

    context: "Order tracking is required for seller trust and platform fees.",
    steps: [
      "Define order schema and status lifecycle.",
      "Create order creation flow tied to checkout/contact action.",
      "Add buyer and seller order history pages.",
    ],
    acceptanceCriteria: [
      "Orders are stored with correct metadata and statuses.",
      "Buyer and seller can view order history.",
    ],
    deliverables: ["PR + screenshots of order history pages."],
  }),

  addTask({
    id: "mkt-009-platform-fee-engine",
    title: "Commission/platform fee calculation and reporting",
    summary: "Track platform fees per order and seller payout amounts.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 10,
    priority: 3,
    tags: ["commission", "fees", "reporting"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["mkt-008-order-model"],

    context:
      "Accurate fee reporting is required for payouts and financial clarity.",
    steps: [
      "Define platform fee rules and store them per order.",
      "Compute platform fee and seller net amounts.",
      "Expose fee reporting to seller dashboard (MVP).",
    ],
    acceptanceCriteria: [
      "Fees compute correctly for orders.",
      "Seller net amounts are stored and displayed.",
    ],
    deliverables: ["PR + example order with fee breakdown."],
  }),

  addTask({
    id: "mkt-010-cloud-uploads",
    title: "Move product uploads to cloud storage",
    summary: "Replace Vercel filesystem uploads with S3/R2 signed uploads.",
    category: "Security",
    difficulty: "hard",
    estimatedHours: 14,
    priority: 1,
    tags: ["uploads", "storage", "security"],

    status: "needs_spec",
    scope: "security",
    assignee: "thomas",
    dependsOn: ["prod-002-env-parity-audit"],

    context:
      "Vercel filesystem isn’t reliable for persistent uploads. Cloud storage is required for scale.",
    steps: [
      "Choose provider (S3 / Cloudflare R2) and define bucket rules.",
      "Implement signed upload flow + store URLs in DB.",
      "Update product upload UI and API.",
      "Test uploads in Preview and Production.",
    ],
    acceptanceCriteria: [
      "Uploads persist across deployments.",
      "Only allowed file types/sizes are accepted.",
      "No public write access to bucket.",
    ],
    deliverables: ["Spec decision + PR implementing signed uploads."],
  }),

  // ============================================================
  // 7) Jobs & Careers
  // ============================================================
  addTask({
    id: "jobs-001-public-jobs-page",
    title: "Public job listings with search/filter",
    summary: "Browse jobs, job detail, apply CTA, pagination.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["jobs", "search", "ui"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context: "Jobs are a strong retention loop and support paid boosts later.",
    steps: [
      "Build jobs list page that loads jobs from API/DB.",
      "Add search/filter and pagination.",
      "Create job detail view and apply CTA link.",
      "Mobile pass and empty state.",
    ],
    acceptanceCriteria: [
      "Jobs list renders from DB data.",
      "Search/filter/pagination works.",
      "No console errors and mobile layout is clean.",
    ],
    deliverables: ["PR with screenshots + tested job IDs."],
  }),

  addTask({
    id: "jobs-002-post-job-tiers",
    title: "Employer post job flow (free + paid tiers)",
    summary:
      "Store tier metadata; connect paid tiers to Stripe + activation logic.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 2,
    tags: ["jobs", "employer", "stripe"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["auth-002-role-guards"],

    context: "Paid job tiers add revenue and improve employer experience.",
    steps: [
      "Store employerId and tier metadata on job create.",
      "If paid tier, create checkout session + metadata.",
      "Webhook activates featured/promoted status and expiration.",
    ],
    acceptanceCriteria: [
      "Employer can post free job and it appears publicly.",
      "Paid tier activates after successful checkout.",
    ],
    deliverables: ["PR + test steps for free + paid flows."],
  }),

  addTask({
    id: "jobs-003-applicants-ats-lite",
    title: "ATS-lite pipeline (stages + notes)",
    summary: "Stages New/Reviewed/Interview/Offer/Hired, tags, notes, sorting.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 3,
    tags: ["applicants", "ats", "pipeline"],

    status: "backlog",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["jobs-002-post-job-tiers"],

    context:
      "Employers need simple pipeline controls to manage applicants efficiently.",
    steps: [
      "Define pipeline stage fields on applicants.",
      "Add endpoints to update stage and add notes/tags.",
      "Update employer UI to reflect stages (MVP).",
    ],
    acceptanceCriteria: [
      "Employer can update applicant stage and save notes.",
      "Stages persist and render correctly.",
    ],
    deliverables: ["PR + screenshots of pipeline UI (if applicable)."],
  }),

  addTask({
    id: "jobs-004-resume-upload",
    title: "Resume file upload + employer download",
    summary: "Secure upload, storage, access control, download link.",
    category: "Security",
    difficulty: "hard",
    estimatedHours: 14,
    priority: 3,
    tags: ["resume", "uploads", "security"],

    status: "needs_spec",
    scope: "security",
    assignee: "thomas",
    dependsOn: ["mkt-010-cloud-uploads", "sec-003-upload-protection"],

    context:
      "Resume links are unreliable; uploads improve UX but require strict security.",
    steps: [
      "Implement secure upload for resumes (PDF/docx restrictions).",
      "Store file URL + access rules (employer-only download).",
      "Update application form to accept file upload.",
    ],
    acceptanceCriteria: [
      "Applicants can upload resumes successfully.",
      "Only authorized employers can download resumes.",
      "Uploads are restricted by type/size.",
    ],
    deliverables: ["Spec decision + PR implementing secure resume uploads."],
  }),

  addTask({
    id: "jobs-005-job-boosts",
    title: "Paid job boosts (featured/promoted)",
    summary: "Paid highlighting in results, expiration rules, reporting.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["jobs", "boost", "featured"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["jobs-002-post-job-tiers"],

    context:
      "Boosts are valuable but should follow the core posting loop being stable.",
    steps: [
      "Define boost types and pricing.",
      "Implement ranking adjustments and expiration.",
      "Add basic metrics.",
    ],
    acceptanceCriteria: ["Boosted jobs appear correctly and expire reliably."],
    deliverables: ["PR + screenshots showing boosted job ordering."],
  }),

  addTask({
    id: "jobs-006-job-alerts",
    title: "Saved searches + email alerts",
    summary: "Notify users on new postings matching criteria.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 3,
    tags: ["jobs", "alerts", "email"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["jobs-001-public-jobs-page"],

    context: "Alerts improve retention but can wait until core data is stable.",
    steps: [
      "Allow users to save search criteria.",
      "Send periodic email alerts for new matches.",
      "Add unsubscribe controls.",
    ],
    acceptanceCriteria: [
      "Users receive alerts for matching new jobs and can unsubscribe.",
    ],
    deliverables: ["PR + test notes (email sending method documented)."],
  }),

  // ============================================================
  // 8) Admin Operations
  // ============================================================
  addTask({
    id: "admin-001-admin-allowlist",
    title: "Restrict admin dashboard access",
    summary: "Allow only specified accounts; deny by default.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 4,
    priority: 2,
    tags: ["admin", "security", "allowlist"],

    status: "ready",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["auth-002-role-guards"],

    context:
      "Admin access must be locked down before more admin tooling is added.",
    steps: [
      "Add allowlist check for admin routes/APIs.",
      "Return 403 for non-admins.",
      "Test with multiple accounts.",
    ],
    acceptanceCriteria: [
      "Only allowlisted admins can access admin pages/APIs.",
      "Non-admins are blocked with safe messaging.",
    ],
    deliverables: ["PR + accounts/roles tested notes (no emails in repo)."],
  }),

  addTask({
    id: "admin-002-business-approval-queue",
    title: "Business approval queue + verification badge",
    summary:
      "Review pending submissions, approve/reject, publish toggle, add notes.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 2,
    tags: ["admin", "approvals", "directory"],

    status: "backlog",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["dir-007-submit-business-api", "admin-001-admin-allowlist"],

    context:
      "Approvals keep directory quality high and enable verified badges.",
    steps: [
      "Create admin API endpoints to list pending submissions.",
      "Add approve/reject actions and publish status toggles.",
      "Add a simple admin UI to review and act.",
    ],
    acceptanceCriteria: [
      "Admin can approve and publish a business listing.",
      "Rejected submissions are stored with reason/notes.",
    ],
    deliverables: ["PR with admin UI screenshots + test notes."],
  }),

  addTask({
    id: "admin-003-moderation-reports",
    title: "Reporting/moderation system",
    summary:
      "Report jobs/listings/businesses; admin resolves; repeat offender tracking.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["moderation", "reports", "abuse"],

    status: "deferred",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["admin-001-admin-allowlist"],

    context:
      "Moderation is needed at scale but can follow core monetization loops.",
    steps: [
      "Define report schema and endpoints.",
      "Build minimal UI to submit reports.",
      "Add admin review/resolve workflow.",
    ],
    acceptanceCriteria: [
      "Users can report content and admins can resolve reports.",
    ],
    deliverables: ["PR + screenshots and test notes."],
  }),

  // ============================================================
  // 9) Content Freshness + Credibility
  // ============================================================
  addTask({
    id: "content-001-student-opportunities-refresh",
    title: "Refresh scholarships/internships and remove expired deadlines",
    summary: "Update content, add sources, add last updated stamp.",
    category: "Content",
    difficulty: "easy",
    estimatedHours: 6,
    priority: 2,
    tags: ["content", "students", "scholarships"],

    status: "ready",
    scope: "content",
    assignee: "intern",
    dependsOn: [],

    context:
      "Fresh, credible student content builds trust and keeps users returning.",
    steps: [
      "Review existing student opportunities content.",
      "Remove expired items or mark them expired.",
      "Add sources and last-updated dates.",
      "Do a quick mobile formatting pass.",
    ],
    acceptanceCriteria: [
      "No obviously expired items remain without being marked/removed.",
      "Sources are included where applicable.",
      "Pages read cleanly on mobile.",
    ],
    deliverables: ["PR with list of items updated + screenshots."],
  }),

  addTask({
    id: "content-002-last-updated-component",
    title: "Reusable Last Updated component",
    summary: "Consistent stamp across content pages; optional owner tag.",
    category: "UI",
    difficulty: "easy",
    estimatedHours: 3,
    priority: 3,
    tags: ["component", "content", "freshness"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context:
      "A standard component prevents stale pages and makes maintenance easier.",
    steps: [
      "Create a simple LastUpdated component that accepts date + optional owner.",
      "Add to 2–3 key content pages as examples.",
      "Verify theme consistency and no layout shifts.",
    ],
    acceptanceCriteria: [
      "Component renders correctly and matches site theme.",
      "No console errors and no new lint errors.",
    ],
    deliverables: ["PR with screenshots of component in use."],
  }),

  addTask({
    id: "content-003-content-system-choice",
    title: "Choose content system (MDX vs DB vs CMS)",
    summary:
      "Decide easiest safe workflow for interns without breaking builds.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 4,
    priority: 2,
    tags: ["content", "mdx", "cms"],

    status: "needs_spec",
    scope: "dx",
    assignee: "thomas",
    dependsOn: [],

    context:
      "A consistent content system allows safe scaling of articles/opportunities.",
    steps: [
      "Compare MDX vs DB vs CMS for your needs.",
      "Pick one and document how interns will add/update content safely.",
      "Create a minimal example (one page) following the new approach.",
    ],
    acceptanceCriteria: [
      "Decision documented with pros/cons.",
      "Intern workflow is clear and safe.",
    ],
    deliverables: [
      "Decision notes + optional PR implementing minimal example.",
    ],
  }),

  // ============================================================
  // 10) Security Baseline
  // ============================================================
  addTask({
    id: "sec-001-rate-limit-sensitive",
    title: "Rate limit auth + write endpoints",
    summary:
      "Throttle login/signup/submissions; lockouts for repeated failures.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 2,
    tags: ["security", "rate-limit", "abuse"],

    status: "backlog",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["auth-001-signup-session"],

    context:
      "Rate limiting reduces brute force and spam submissions, protecting the platform.",
    steps: [
      "Add rate limiting middleware for login/signup and submission endpoints.",
      "Add safe error messaging and retry-after guidance (if applicable).",
      "Test normal usage and ensure no legitimate flows break.",
    ],
    acceptanceCriteria: [
      "Sensitive endpoints have rate limiting.",
      "Legitimate usage is not blocked unexpectedly.",
    ],
    deliverables: ["PR + list of endpoints covered."],
  }),

  addTask({
    id: "sec-002-validation-layer",
    title: "Centralized schema validation for all APIs",
    summary: "Zod validation + unified errors for inputs across platform.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 2,
    tags: ["zod", "validation", "api"],

    status: "backlog",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "Validation prevents bad data and reduces security risk from malformed inputs.",
    steps: [
      "Add a consistent Zod validation approach for API handlers.",
      "Update key write endpoints first (signup, submissions, checkout create).",
      "Standardize validation error responses.",
    ],
    acceptanceCriteria: [
      "Key write endpoints validate inputs with Zod.",
      "Validation errors return consistent payloads.",
    ],
    deliverables: ["PR + endpoints migrated list."],
  }),

  addTask({
    id: "sec-003-upload-protection",
    title: "Secure upload rules (type/size/mime)",
    summary:
      "Restrict file types, verify mime, size caps, optional scanning hooks.",
    category: "Security",
    difficulty: "hard",
    estimatedHours: 12,
    priority: 1,
    tags: ["uploads", "mime", "security"],

    status: "needs_spec",
    scope: "security",
    assignee: "thomas",
    dependsOn: ["mkt-010-cloud-uploads"],

    context:
      "Uploads are a major attack surface; strict rules are mandatory once storage is enabled.",
    steps: [
      "Define allowed file types per use case (product images, resumes).",
      "Enforce max size and verify MIME type server-side.",
      "Add safe error messages and logging for blocked files.",
    ],
    acceptanceCriteria: [
      "Disallowed file types are rejected reliably.",
      "Size caps are enforced.",
      "MIME spoofing is mitigated (server-side checks).",
    ],
    deliverables: ["Spec rules + PR implementing protections."],
  }),

  addTask({
    id: "sec-004-audit-logs",
    title: "Audit logs for admin + financial actions",
    summary:
      "Track who changed sponsor status, payouts, listing edits, approvals.",
    category: "Security",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["audit", "admin", "payments"],

    status: "deferred",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["admin-001-admin-allowlist"],

    context:
      "Audit logs help troubleshoot and provide accountability as the platform grows.",
    steps: [
      "Define audit schema (actor, action, target, timestamp, metadata).",
      "Log key admin actions and payment activations.",
      "Add basic admin view/search (optional).",
    ],
    acceptanceCriteria: ["Key admin/payment actions are logged and queryable."],
    deliverables: ["PR + list of actions that are logged."],
  }),

  // ============================================================
  // 11) Analytics + Growth Instrumentation
  // ============================================================
  addTask({
    id: "ana-001-event-tracking-core",
    title: "Track key events across platform",
    summary: "signup/login/search/click/product view/apply/checkout/ad events.",
    category: "DX",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 3,
    tags: ["analytics", "events", "tracking"],

    status: "deferred",
    scope: "dx",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "Event tracking supports reporting, optimization, and future AI features.",
    steps: [
      "Define a minimal event schema and storage approach.",
      "Implement tracking for 5–8 core events.",
      "Add basic admin query endpoint or dashboard hook.",
    ],
    acceptanceCriteria: [
      "Core events are recorded reliably without breaking UX.",
    ],
    deliverables: ["PR + list of events implemented."],
  }),

  addTask({
    id: "ana-002-admin-metrics-panel",
    title: "Admin metrics dashboard (MVP)",
    summary:
      "Users, businesses, jobs, products, applicants, revenue, active sponsors.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 8,
    priority: 3,
    tags: ["admin", "metrics", "dashboard"],

    status: "deferred",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["ana-001-event-tracking-core"],

    context:
      "A metrics panel gives visibility into platform health and revenue drivers.",
    steps: [
      "Create admin dashboard metrics cards layout.",
      "Fetch metrics from API endpoints (or placeholders if not built yet).",
      "Ensure responsive layout and clear labels.",
    ],
    acceptanceCriteria: [
      "Dashboard renders key metrics with stable layout.",
      "No console errors and mobile layout is usable.",
    ],
    deliverables: ["PR with screenshots and tested metrics endpoints."],
  }),

  // ============================================================
  // 12) UX Polish (Trust + Conversion)
  // ============================================================
  addTask({
    id: "ux-001-nav-consistency",
    title: "Consistent header/footer/nav across all pages",
    summary: "Ensure consistent links and account actions across the site.",
    category: "UI",
    difficulty: "easy",
    estimatedHours: 4,
    priority: 3,
    tags: ["nav", "layout", "consistency"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context:
      "Consistency improves trust and reduces confusion across gated sections.",
    steps: [
      "Identify all pages that diverge from standard header/footer.",
      "Refactor to shared layout components where possible.",
      "Verify all key nav links work and role gating doesn’t break navigation.",
    ],
    acceptanceCriteria: [
      "All pages share consistent header/footer behavior.",
      "No broken links introduced.",
      "Mobile nav remains usable.",
    ],
    deliverables: ["PR with list of pages checked + screenshots."],
  }),

  addTask({
    id: "ux-002-empty-states",
    title: "Improve empty states with CTAs and admin hints",
    summary: "Replace “no results” with clear action paths.",
    category: "UI",
    difficulty: "easy",
    estimatedHours: 3,
    priority: 3,
    tags: ["empty-state", "cta", "ux"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context:
      "Empty states drive actions: add business, post job, browse marketplace, promote listings.",
    steps: [
      "Find empty states on directory/jobs/marketplace pages.",
      "Add helpful CTAs and short instructions.",
      "Keep styling consistent with theme and accessible contrast.",
    ],
    acceptanceCriteria: [
      "Empty states include at least one CTA.",
      "No layout regressions on mobile.",
    ],
    deliverables: ["PR with screenshots for 3+ empty states."],
  }),

  addTask({
    id: "ux-003-mobile-pass",
    title: "Mobile UX pass on core flows",
    summary: "Homepage, directory, marketplace, login/signup, job listings.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 6,
    priority: 3,
    tags: ["mobile", "responsive", "ux"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: ["ux-001-nav-consistency"],

    context:
      "Most early users will hit BWE on mobile; mobile polish increases retention and trust.",
    steps: [
      "Do a mobile walkthrough on 5 core flows.",
      "Fix spacing, tap targets, overflow, and image sizing issues.",
      "Confirm no sticky elements cover content.",
    ],
    acceptanceCriteria: [
      "No horizontal scrolling on key pages.",
      "Buttons/CTAs are tappable and readable.",
      "No console errors introduced.",
    ],
    deliverables: [
      "PR with before/after screenshots and list of pages tested.",
    ],
  }),

  // ============================================================
  // Existing intern tasks you already had (kept + updated fields)
  // ============================================================
  addTask({
    id: "ui-footer-consistency",
    title: "Footer consistency across all pages",
    summary:
      "Ensure every page shows the same footer (desktop + mobile) with legal links and matching styling.",
    category: "UI",
    difficulty: "easy",
    estimatedHours: 3,
    priority: 1,
    tags: ["layout", "consistency", "mobile"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context:
      "Some pages are missing the footer or render a mismatched version. The site needs a consistent footer experience everywhere.",
    steps: [
      "Locate the current footer implementation (or create one shared component if needed).",
      "Identify pages missing the footer and apply the shared footer.",
      "Confirm mobile spacing, tap targets, and contrast with the black/gold theme.",
      "Add/confirm legal links (Terms, Privacy) and ensure they route correctly.",
      "Run lint and do a quick responsive pass.",
    ],
    acceptanceCriteria: [
      "Footer appears on every page (including mobile).",
      "Footer styling matches the main site theme (black background, gold accents, white text).",
      "Legal links are present and work.",
      "No layout overlap with bottom content on mobile.",
      "No new lint errors.",
    ],
    deliverables: [
      "PR with shared footer usage and screenshots (desktop + mobile).",
      "Notes in PR describing pages checked.",
    ],
  }),

  addTask({
    id: "intern-hub-polish",
    title: "Polish intern hub UX",
    summary:
      "Improve intern dashboard/task pages with better navigation, filters, and progress tracking.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 5,
    priority: 2,
    tags: ["intern", "ux", "localStorage"],

    status: "ready",
    scope: "frontend",
    assignee: "intern",
    dependsOn: [],

    context:
      "Interns should be able to onboard and pick tasks without help. The intern hub should feel like a mini product: clear, fast, and motivating.",
    steps: [
      "Add filters for category/difficulty and a search box on /intern/tasks.",
      "Add a simple progress indicator: 'completed tasks' stored in localStorage.",
      "Add a clear CTA on /intern/dashboard to 'Pick a task' + 'Continue onboarding'.",
      "Ensure UI matches the black/gold theme and looks good on mobile.",
    ],
    acceptanceCriteria: [
      "Filters + search work on /intern/tasks.",
      "Intern can mark a task complete and it persists on refresh (localStorage).",
      "Dashboard shows progress (e.g., X/Y completed).",
      "No console errors in normal use.",
      "No new lint errors.",
    ],
    deliverables: [
      "PR with screenshots of dashboard + task list + task detail.",
      "Short test plan in PR description.",
    ],
    stretchGoals: [
      "Add 'Copy PR template' button that copies a PR checklist to clipboard.",
    ],
  }),

  addTask({
    id: "security-basic-hardening",
    title: "Basic front-end hardening pass (non-breaking)",
    summary:
      "Add safe, non-invasive security headers and reduce obvious scraping vectors where appropriate.",
    category: "Security",
    difficulty: "hard",
    estimatedHours: 8,
    priority: 3,
    tags: ["headers", "next", "security"],

    status: "backlog",
    scope: "security",
    assignee: "senior_dev",
    dependsOn: ["prod-001-build-green"],

    context:
      "We want reasonable baseline hardening that does not break UX: security headers and common-sense protections.",
    steps: [
      "Review current Next.js config for headers support.",
      "Add baseline headers (CSP if feasible without breaking, else start with safer headers).",
      "Ensure routes still function and no key pages break.",
      "Document what was added and why.",
    ],
    acceptanceCriteria: [
      "Security headers added in a way that does not break core pages.",
      "No console errors caused by new policies (or policies adjusted to avoid breakage).",
      "Clear documentation in PR of headers added and rationale.",
      "No new lint errors.",
    ],
    deliverables: [
      "PR with headers added and before/after verification notes.",
      "Any CSP decisions documented (what was included/excluded).",
    ],
  }),

  // ============================================================
  // FUTURE ENHANCEMENTS (Phase 5+) — kept in the same file but deferred
  // ============================================================
  addTask({
    id: "music-001-creator-onboarding",
    title: "Creator onboarding + dashboard skeleton",
    summary:
      "Creator roles, profile, verification status, and dashboard layout.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 14,
    priority: 3,
    tags: ["music", "creator", "onboarding"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "BWE Music is a major expansion; build after core marketplace/directory loops are stable.",
    steps: [
      "Define creator model and onboarding flow.",
      "Build creator profile + dashboard skeleton.",
      "Add verification status fields.",
    ],
    acceptanceCriteria: [
      "Creator can create a profile and access a dashboard.",
      "Data model supports future tracks/splits/licensing.",
    ],
    deliverables: ["PR with creator onboarding + basic dashboard UI."],
  }),

  addTask({
    id: "music-002-track-registry",
    title: "Track registry + metadata + ownership",
    summary: "Tracks, credits, versions, ownership model, and audit trail.",
    category: "Database",
    difficulty: "hard",
    estimatedHours: 16,
    priority: 3,
    tags: ["music", "tracks", "ownership"],

    status: "deferred",
    scope: "database",
    assignee: "senior_dev",
    dependsOn: ["music-001-creator-onboarding"],

    context:
      "A track registry is the foundation for splits, licensing, and royalties.",
    steps: [
      "Define track schema and required metadata.",
      "Add ownership fields and versioning approach.",
      "Implement create/edit track endpoints (MVP).",
    ],
    acceptanceCriteria: [
      "Tracks can be created with metadata and ownership data.",
      "Audit trail exists for key changes (MVP).",
    ],
    deliverables: ["PR + example track record(s)."],
  }),

  addTask({
    id: "music-003-splits-approvals",
    title: "Split agreements + approval workflow",
    summary: "Propose splits, accept/reject, revision history, and disputes.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 18,
    priority: 3,
    tags: ["music", "splits", "workflow"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["music-002-track-registry"],

    context: "Split approvals create trust and enable accurate payouts.",
    steps: [
      "Define split proposal model and statuses.",
      "Implement accept/reject and revision history.",
      "Add dispute flagging for admin review (MVP).",
    ],
    acceptanceCriteria: [
      "Splits require approvals and track state transitions.",
      "Revision history is preserved.",
    ],
    deliverables: ["PR + demo flow notes."],
  }),

  addTask({
    id: "music-004-licensing-marketplace",
    title: "Licensing marketplace + checkout + certificate",
    summary:
      "License types/pricing, Stripe checkout, and license certificate generation.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 20,
    priority: 3,
    tags: ["music", "licensing", "stripe"],

    status: "deferred",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["music-003-splits-approvals"],

    context: "Licensing is the primary revenue mechanism for BWE Music.",
    steps: [
      "Define license types and pricing model.",
      "Implement checkout flow and metadata.",
      "Generate downloadable license certificate (MVP).",
    ],
    acceptanceCriteria: [
      "License checkout completes and records license purchase.",
      "Certificate can be generated and stored/served safely.",
    ],
    deliverables: ["PR + sample license transaction proof."],
  }),

  addTask({
    id: "music-005-royalty-ledger",
    title: "Royalties ledger + statements + payout workflow",
    summary: "Ledger entries, monthly statements, payout calculations/exports.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 20,
    priority: 3,
    tags: ["music", "royalties", "payouts"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["music-004-licensing-marketplace"],

    context:
      "A ledger makes royalties auditable and enables transparent payouts.",
    steps: [
      "Define ledger schema and posting rules.",
      "Generate monthly statements per creator.",
      "Implement payout calculation/export (MVP).",
    ],
    acceptanceCriteria: [
      "Ledger is created from licensing events.",
      "Statements can be generated for a date range.",
    ],
    deliverables: ["PR + sample statement output (no sensitive info)."],
  }),

  addTask({
    id: "prem-001-membership-tiers",
    title: "Membership tiers + gated content framework",
    summary: "Premium gating for courses/tools/templates and upgrade flow.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 14,
    priority: 3,
    tags: ["premium", "gating", "stripe"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: [],

    context:
      "Premium gating unlocks predictable recurring revenue once core usage exists.",
    steps: [
      "Define tier model and which routes/features are gated.",
      "Implement membership state and checks.",
      "Add upgrade flow (Stripe or placeholder).",
    ],
    acceptanceCriteria: [
      "Gated pages enforce access correctly based on membership tier.",
    ],
    deliverables: ["PR + test matrix for gated pages."],
  }),

  addTask({
    id: "prem-002-courses-progress",
    title: "Course progress tracking + completion certificates",
    summary:
      "Track module completion, show progress UI, certificate generation later.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["courses", "progress", "certificates"],

    status: "deferred",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["prem-001-membership-tiers"],

    context:
      "Progress tracking improves course completion and perceived value.",
    steps: [
      "Define progress schema (userId, moduleId, completedAt).",
      "Create endpoints to update progress.",
      "Update UI to show progress bars/checkmarks.",
    ],
    acceptanceCriteria: [
      "Progress persists and displays correctly after refresh/login.",
    ],
    deliverables: ["PR + screenshots showing progress UI."],
  }),

  addTask({
    id: "comm-001-communities",
    title: "Communities by city/industry/HBCU",
    summary: "Basic groups, join/leave, posting MVP, moderation hooks.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 16,
    priority: 3,
    tags: ["community", "groups", "network"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: [],

    context: "Communities create network effects after you have core traffic.",
    steps: [
      "Define group schema and join/leave rules.",
      "Implement basic posts (MVP).",
      "Add moderation hooks (admin can remove).",
    ],
    acceptanceCriteria: [
      "Users can join groups and create posts with minimal moderation controls.",
    ],
    deliverables: ["PR + demo group and post examples."],
  }),

  addTask({
    id: "comm-002-events",
    title: "Events module",
    summary: "Create events, RSVP, organizer pages, calendar links.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["events", "rsvp", "community"],

    status: "deferred",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["comm-001-communities"],

    context: "Events increase engagement and can be monetized later.",
    steps: [
      "Define event schema and RSVP model.",
      "Implement create/list/detail event endpoints.",
      "Add calendar link generation (MVP).",
    ],
    acceptanceCriteria: [
      "Users can RSVP and events display correctly across devices.",
    ],
    deliverables: ["PR + screenshots of event list/detail."],
  }),

  addTask({
    id: "comm-003-referrals",
    title: "Referral program (credits/perks)",
    summary: "Track referrals, rewards rules, anti-abuse.",
    category: "Backend",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["referrals", "growth", "rewards"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: [],

    context: "Referrals can accelerate growth once core onboarding is stable.",
    steps: [
      "Define referral tracking model and reward rules.",
      "Create referral link generation and attribution.",
      "Add abuse protection (basic).",
    ],
    acceptanceCriteria: [
      "Referrals are tracked and rewards can be computed reliably.",
    ],
    deliverables: ["PR + example referral flow notes."],
  }),

  addTask({
    id: "ai-001-ai-search",
    title: "AI-assisted search across directory/jobs/marketplace",
    summary: "Smarter matching, ranking, suggestions, and query understanding.",
    category: "DX",
    difficulty: "hard",
    estimatedHours: 16,
    priority: 3,
    tags: ["ai", "search", "ranking"],

    status: "deferred",
    scope: "dx",
    assignee: "senior_dev",
    dependsOn: ["ana-001-event-tracking-core"],

    context:
      "AI search can improve conversion, but only after core loops and analytics are stable.",
    steps: [
      "Define what AI search does (query expansion, ranking, suggestions).",
      "Create safe prompt templates and guardrails.",
      "Implement evaluation against baseline search.",
      "Add controls to disable AI features quickly if needed.",
    ],
    acceptanceCriteria: [
      "AI search can be toggled on/off safely.",
      "Search quality is measurably improved in defined test cases.",
      "No sensitive data is sent to the model.",
    ],
    deliverables: [
      "PR with AI search implementation behind a feature flag.",
      "Brief evaluation notes comparing baseline vs AI-assisted.",
    ],
  }),

  addTask({
    id: "ai-002-resume-job-match",
    title: "AI resume builder + job match scoring",
    summary: "Generate/format resumes + match scoring to job posts.",
    category: "Backend",
    difficulty: "hard",
    estimatedHours: 18,
    priority: 3,
    tags: ["ai", "jobs", "resume"],

    status: "deferred",
    scope: "backend",
    assignee: "senior_dev",
    dependsOn: ["jobs-001-public-jobs-page"],

    context: "Only worth building after job data and user profiles are stable.",
    steps: [
      "Define inputs (skills, experience, preferences).",
      "Implement match scoring logic behind a feature flag.",
      "Add a safe resume formatting assistant (MVP).",
    ],
    acceptanceCriteria: [
      "Match scoring returns stable results and can be disabled.",
      "No sensitive data is exposed in logs.",
    ],
    deliverables: ["PR + demo examples (sanitized)."],
  }),

  addTask({
    id: "ai-003-seller-assistant",
    title: "AI product description + SEO helper for sellers",
    summary: "Assist sellers writing listings with safe guardrails.",
    category: "UI",
    difficulty: "medium",
    estimatedHours: 10,
    priority: 3,
    tags: ["ai", "marketplace", "seo"],

    status: "deferred",
    scope: "fullstack",
    assignee: "senior_dev",
    dependsOn: ["mkt-003-search-filtering"],

    context: "Improves listing quality once sellers and products are active.",
    steps: [
      "Add a seller UI button to generate a description draft.",
      "Implement backend endpoint with guardrails and feature flag.",
      "Ensure generated text is editable (never auto-publish).",
    ],
    acceptanceCriteria: [
      "Seller can generate text and edit before saving.",
      "Feature is behind a flag and can be disabled quickly.",
    ],
    deliverables: ["PR + screenshots of seller assistant UI."],
  }),
];

// --------------------
// Queries / helpers
// --------------------

export function getInternTasks(): InternTask[] {
  // stable order: priority asc, then estimatedHours asc, then title asc
  return [...INTERN_TASKS].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.estimatedHours !== b.estimatedHours)
      return a.estimatedHours - b.estimatedHours;
    return a.title.localeCompare(b.title);
  });
}

export function getInternTaskById(taskId: string): InternTask | undefined {
  return INTERN_TASKS.find((t) => t.id === taskId);
}

export function getInternTaskIds(): string[] {
  return INTERN_TASKS.map((t) => t.id);
}

// --------------------
// Compatibility exports (prevents runtime breaks)
// --------------------

// Some pages may import slightly different function names.
// These aliases keep the system stable even if a page uses another naming style.
export const getInternTaskByID = getInternTaskById; // capital "D" variant
export const getTaskById = getInternTaskById; // shorter variant
export const getTaskIds = getInternTaskIds;
export const getTasks = getInternTasks;
