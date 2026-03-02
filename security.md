# 🔐 Security Policy – Black Wealth Exchange

This document outlines the core security practices and controls in place (or planned) for Black Wealth Exchange. Our goal is to protect users, businesses, and financial data through proactive and responsive security strategies.

---

## ✅ Core Security Principles

- **Least Privilege Access**: All user roles are granted only the permissions required to perform their actions.
- **Role-Based Access Control (RBAC)**: Defined roles include `user`, `seller`, `employer`, `business`, and `admin`.
- **Secure-by-Default**: All features and components are developed with security in mind from day one.
- **Continuous Improvement**: Security controls are reviewed and improved regularly.

---

## 🔐 Authentication & Authorization

- JWT-based session management using `token` stored in cookies.
- All API routes require authenticated sessions and appropriate roles.
- Sensitive routes (e.g., job posting, product management) are protected via middleware.
- Admin-only functionality is isolated and role-checked.

---

## 🧼 Input Validation & Sanitization

- All user-submitted data is validated for presence and format.
- Basic HTML/script tag sanitization is applied to prevent XSS.
- File uploads are restricted by type and size (planned).

---

## ⚠️ API Security

- All sensitive API routes are protected with:
  - Method checks (e.g., `POST` only)
  - Role checks
  - Input sanitization
- Future enhancement: Rate limiting per IP/user.

---

## 💳 Payment Security (Stripe)

- Stripe webhooks will be validated using Stripe's signature headers.
- No sensitive card data is stored or handled directly by our servers.
- All paid features (e.g., featured ads, job boosts) are routed through secure Stripe Checkout sessions.

---

## 🧠 Security in Development

- Dependency scanning via `npm audit` and `Dependabot`.
- Reusable `withSecurity` middleware to apply auth/role checks and sanitization to all routes.
- Secure file structure — admin routes and private logic separated.

---

## 🧾 Vulnerability Notes & Exceptions (Audit Triage)

### Next.js advisory: GHSA-5f7q-jpqc-wp7h (PPR Resume Endpoint) — `npm audit` (moderate)

**Status:** Documented exception — not applicable to current configuration

**What `npm audit` reports**

- `npm audit` flags GHSA-5f7q-jpqc-wp7h and recommends `npm audit fix --force`,
  which would upgrade Next.js to `16.1.6` (breaking change).

**Why we are not applying `--force` right now**

- The advisory applies only when **PPR is enabled** (e.g., `experimental.ppr` / `cacheComponents`) **and**
  the app is running in **minimal mode** (`NEXT_PRIVATE_MINIMAL_MODE=1`).
- Current repo/config checks:
  - `next.config.ts` does **not** enable `experimental.ppr` or `cacheComponents`.
  - No `NEXT_PRIVATE_MINIMAL_MODE=1` environment variable is set.
- Therefore, the vulnerable configuration described by the advisory is **not in use**.

**Guardrails**

- Do not enable PPR or minimal mode in this codebase unless Next.js is upgraded to a version that includes the fix.

**Planned remediation**

- Perform a controlled upgrade to Next.js 16+ during a planned maintenance window **after** migrating off
  `serverRuntimeConfig` / `publicRuntimeConfig` (removed in Next.js 16), then re-run `npm audit` to confirm clean status.

---

## 📦 Data & Database Security

- MongoDB Atlas with IP whitelisting and encrypted storage at rest.
- Sensitive fields (e.g., passwords if stored, payment metadata) encrypted or tokenized.
- Access keys stored securely via environment variables.

---

## 🚨 Incident Response Plan

1. Log the incident in system logs.
2. Contain and isolate affected components.
3. Notify project stakeholders.
4. Audit logs and user activity.
5. Patch vulnerability and test fix.
6. Document the incident and resolution.

---

## 📆 Security Maintenance Schedule

| Task                           | Frequency  |
| ------------------------------ | ---------- |
| Dependency Audit (`npm audit`) | Weekly     |
| Access Role Review             | Monthly    |
| Codebase Security Scan         | Bi-monthly |
| Incident Response Drill        | Quarterly  |
| Policy & Plan Review           | Quarterly  |

---

## 🔍 Future Plans

- Implement global rate limiting.
- Enable 2FA for admin accounts.
- Add CAPTCHA on sign-up/login forms.
- Create a moderation dashboard for job and product postings.
- Add automatic account lockout for repeated failed login attempts.

---

## 📫 Contact

For responsible disclosure of vulnerabilities or suspicious activity:
**Email:** security@blackwealthexchange.com (placeholder)
