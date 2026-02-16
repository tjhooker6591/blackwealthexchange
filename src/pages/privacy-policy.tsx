// pages/privacy-policy.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Lock,
  ShieldCheck,
  Cookie,
  Database,
  Globe,
  Mail,
  UserCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Pill({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "muted";
}) {
  const tones: Record<string, string> = {
    gold: "bg-yellow-500/10 text-yellow-200 border-yellow-500/20",
    muted: "bg-white/5 text-gray-200 border-white/10",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs sm:text-sm",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function Card({
  id,
  title,
  subtitle,
  icon,
  children,
  right,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="relative bg-white/5 border border-white/10 rounded-2xl shadow-lg p-5 sm:p-6 md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="h-11 w-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-200">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-sm sm:text-base text-gray-300 mt-1">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function AnchorLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-yellow-200 hover:text-yellow-100 underline underline-offset-4 decoration-yellow-500/30"
    >
      {children}
    </a>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc ml-6 mt-2 space-y-2 text-gray-200">{children}</ul>;
}

function FinePrint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400">{children}</p>;
}

const PrivacyPolicy = () => {
  const lastUpdated = "February 15, 2026"; // Update as needed

  return (
    <>
      <Head>
        <title>Privacy Policy | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Read the Black Wealth Exchange Privacy Policy to learn how we collect, use, and protect information while building trusted, community-centered economic tools."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Background glow like your index */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-[28rem] w-[28rem] rounded-full bg-yellow-500/8 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-[30rem] w-[30rem] rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-black/70 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <ArrowRight className="h-4 w-4 rotate-180 text-yellow-200" />
              <span className="text-sm font-semibold">Back to Home</span>
            </Link>

            <div className="flex items-center gap-2">
              <Pill tone="muted">
                <ShieldCheck className="h-4 w-4" />
                Trust & Transparency
              </Pill>
              <Pill>
                <Lock className="h-4 w-4" />
                Privacy Policy
              </Pill>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent" />
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-200 leading-tight drop-shadow">
                Privacy Policy
              </h1>
              <p className="text-base sm:text-lg text-gray-200 mt-4">
                Black Wealth Exchange (“BWE”) is built on trust. This Privacy Policy explains what we collect,
                how we use it, when we share it, and the choices you have.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Pill tone="muted">
                  <BadgeCheck className="h-4 w-4" />
                  Last updated: {lastUpdated}
                </Pill>
                <Pill tone="muted">
                  <Database className="h-4 w-4" />
                  Data minimization approach
                </Pill>
                <Pill>
                  <UserCheck className="h-4 w-4" />
                  User control options
                </Pill>
              </div>

              <FinePrint>
                This policy is provided for transparency and general guidance. If you need legal advice, consult an attorney.
              </FinePrint>
            </div>
          </div>
        </section>

        <main className="relative max-w-6xl mx-auto px-4 pb-14 space-y-8">
          {/* Quick summary + TOC */}
          <Card
            id="top"
            title="Quick Summary"
            subtitle="The plain-English version (the full details are below)."
            icon={<FileText className="h-5 w-5" />}
            right={
              <a
                href="#contact"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold"
              >
                Contact <ArrowRight className="h-4 w-4" />
              </a>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">We don’t sell your data</div>
                <p className="text-sm text-gray-300 mt-2">
                  We do not sell personal information. If we ever change how we use data in a way that affects your rights,
                  we’ll update this policy and provide notice when appropriate.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">We collect what we need</div>
                <p className="text-sm text-gray-300 mt-2">
                  We collect account details, listing info, and technical data needed to operate and secure the platform,
                  improve experience, and process payments.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">You have controls</div>
                <p className="text-sm text-gray-300 mt-2">
                  You can update info, opt out of marketing, and request access/correction/deletion of data by contacting us.
                </p>
              </div>
            </div>

            <div className="mt-6 bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">Table of Contents</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-200">
                <AnchorLink href="#who-we-are">1. Who We Are</AnchorLink>
                <AnchorLink href="#definitions">2. Definitions</AnchorLink>
                <AnchorLink href="#info-we-collect">3. Information We Collect</AnchorLink>
                <AnchorLink href="#sources">4. Sources of Information</AnchorLink>
                <AnchorLink href="#how-we-use">5. How We Use Information</AnchorLink>
                <AnchorLink href="#sharing">6. Sharing & Third Parties</AnchorLink>
                <AnchorLink href="#cookies">7. Cookies & Tracking</AnchorLink>
                <AnchorLink href="#retention">8. Data Retention</AnchorLink>
                <AnchorLink href="#security">9. Security</AnchorLink>
                <AnchorLink href="#rights">10. Your Privacy Rights</AnchorLink>
                <AnchorLink href="#international">11. International Users</AnchorLink>
                <AnchorLink href="#children">12. Children’s Privacy</AnchorLink>
                <AnchorLink href="#changes">13. Changes to This Policy</AnchorLink>
                <AnchorLink href="#contact">14. Contact Us</AnchorLink>
              </div>
            </div>
          </Card>

          <Card
            id="who-we-are"
            title="1. Who We Are"
            subtitle="Our platform and mission context."
            icon={<BadgeCheck className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              Black Wealth Exchange (“Black Wealth Exchange,” “BWE,” “we,” “us,” or “our”) is a digital platform designed to
              connect users with Black-owned businesses, marketplace products, investment opportunities, and educational resources.
              Our mission is rooted in economic empowerment, financial literacy, and community upliftment.
            </p>
            <p className="text-gray-300 mt-3">
              This Privacy Policy applies to our website, apps, pages, and services that link to it (collectively, the “Services”).
            </p>
          </Card>

          <Card
            id="definitions"
            title="2. Definitions"
            subtitle="Key terms used throughout this policy."
            icon={<FileText className="h-5 w-5" />}
          >
            <BulletList>
              <li>
                <strong>Personal Information</strong> means information that identifies, relates to, describes, or can reasonably be
                linked to an individual (e.g., name, email, phone).
              </li>
              <li>
                <strong>Business Listing Information</strong> means data submitted for a public business profile (e.g., business name,
                category, website, address, description).
              </li>
              <li>
                <strong>Account</strong> means a registered profile that allows you to access features like saved listings, submissions,
                posting, checkout, and premium features.
              </li>
              <li>
                <strong>Service Providers</strong> are vendors that help us operate (e.g., hosting, payments, analytics, email).
              </li>
            </BulletList>
          </Card>

          <Card
            id="info-we-collect"
            title="3. Information We Collect"
            subtitle="What we collect depends on how you use the platform."
            icon={<Database className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              We collect the following categories of information (some only when you choose to provide it):
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">A) Account & Profile</div>
                <BulletList>
                  <li>
                    <strong>Identifiers:</strong> name, email, phone number (if provided).
                  </li>
                  <li>
                    <strong>Account details:</strong> login method, account type, preferences, saved items.
                  </li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">B) Business & Seller Data</div>
                <BulletList>
                  <li>
                    <strong>Business listing info:</strong> business name, categories, address/service area, description, website,
                    contact details, images you upload.
                  </li>
                  <li>
                    <strong>Seller/merchant info:</strong> product listings, fulfillment details (as applicable).
                  </li>
                  <li>
                    <strong>Verification fields:</strong> information used to validate listings (as applicable).
                  </li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">C) Usage & Device Data</div>
                <BulletList>
                  <li>
                    <strong>Activity:</strong> pages viewed, searches, clicks, feature usage, session data.
                  </li>
                  <li>
                    <strong>Technical:</strong> IP address, device type, browser, referrer URL, approximate location (derived from IP).
                  </li>
                  <li>
                    <strong>Logs:</strong> error logs, security logs, performance data.
                  </li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">D) Payments</div>
                <BulletList>
                  <li>
                    <strong>Payment processing:</strong> handled by third parties (e.g., Stripe). We receive confirmations and limited
                    transaction metadata (e.g., status, amount, timestamps), not full card numbers.
                  </li>
                  <li>
                    <strong>Billing support:</strong> invoices/receipts and customer support history.
                  </li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 md:col-span-2">
                <div className="text-yellow-200 font-extrabold">E) Optional Demographics (If You Choose)</div>
                <p className="text-gray-300 mt-2">
                  If you choose to provide demographic details (for example, identifying as Black-owned), we use this information to
                  support discovery and highlight underrepresented businesses. Providing this information is optional.
                </p>
                <BulletList>
                  <li>We do not require demographic fields to use core features.</li>
                  <li>We do not use demographic fields to exclude or discriminate.</li>
                  <li>You can request removal of optional demographic details at any time.</li>
                </BulletList>
              </div>
            </div>
          </Card>

          <Card
            id="sources"
            title="4. Sources of Information"
            subtitle="How information reaches us."
            icon={<UserCheck className="h-5 w-5" />}
          >
            <BulletList>
              <li>
                <strong>Directly from you:</strong> when you create an account, submit a listing, post content, make purchases, or contact support.
              </li>
              <li>
                <strong>Automatically:</strong> through logs, cookies, and analytics tools when you browse and interact with the Services.
              </li>
              <li>
                <strong>From service providers:</strong> transaction status from payment processors, or delivery confirmations from vendors (if used).
              </li>
              <li>
                <strong>Public sources (for listings):</strong> if we seed directory data from public sources or user submissions, we may store business-public details.
              </li>
            </BulletList>
          </Card>

          <Card
            id="how-we-use"
            title="5. How We Use Your Information"
            subtitle="We use information to operate the platform, improve it, and keep it safe."
            icon={<BadgeCheck className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Core operations</div>
                <BulletList>
                  <li>Provide and maintain directory and marketplace features.</li>
                  <li>Create and manage accounts, authentication, and sessions.</li>
                  <li>Process transactions and deliver receipts/confirmations.</li>
                  <li>Enable submissions, moderation, and verification workflows.</li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Improve experience</div>
                <BulletList>
                  <li>Analyze usage to improve usability, speed, and reliability.</li>
                  <li>Personalize results (e.g., saved searches, preferences).</li>
                  <li>Develop new tools, educational content, and community features.</li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Safety & integrity</div>
                <BulletList>
                  <li>Detect and prevent fraud, abuse, and unauthorized access.</li>
                  <li>Enforce policies and protect platform integrity.</li>
                  <li>Debug issues and maintain secure operations.</li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Communications</div>
                <BulletList>
                  <li>Send service-related messages (password resets, receipts, important updates).</li>
                  <li>Send marketing messages only where allowed; you can opt out anytime.</li>
                  <li>Respond to support inquiries and account requests.</li>
                </BulletList>
              </div>
            </div>

            <div className="mt-5 bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <AlertTriangle className="h-4 w-4" />
                Public listing note
              </div>
              <p className="text-sm text-gray-300 mt-2">
                If you submit or claim a business listing, some information may appear publicly (such as business name, category,
                website, address/service area, and description). Do not submit sensitive personal details in public fields.
              </p>
            </div>
          </Card>

          <Card
            id="sharing"
            title="6. Information Sharing & Third Parties"
            subtitle="We do not sell your personal data. We share only as needed to operate the platform."
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              We do not sell your personal information. We may share information in limited circumstances:
            </p>
            <BulletList>
              <li>
                <strong>Service providers:</strong> hosting, analytics, email delivery, customer support tooling, payment processing (e.g., Stripe).
              </li>
              <li>
                <strong>Legal obligations:</strong> to comply with law, subpoenas, court orders, or lawful government requests.
              </li>
              <li>
                <strong>Safety and security:</strong> to investigate fraud, abuse, or threats and protect users and the platform.
              </li>
              <li>
                <strong>Business transfers:</strong> if we merge, acquire, reorganize, or sell assets, information may be transferred with notice as required.
              </li>
              <li>
                <strong>With your direction:</strong> when you choose to publish or share content (e.g., public business profile).
              </li>
            </BulletList>

            <FinePrint>
              If you use third-party links (e.g., a business’s website), their privacy practices apply. We are not responsible for third-party sites.
            </FinePrint>
          </Card>

          <Card
            id="cookies"
            title="7. Cookies & Tracking Technologies"
            subtitle="Cookies help the platform function, measure performance, and remember preferences."
            icon={<Cookie className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              We use cookies and similar technologies. You can manage cookies in your browser settings. Disabling some cookies may
              affect functionality (e.g., staying logged in).
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Essential cookies</div>
                <p className="text-gray-300 mt-2">
                  Required for authentication, security, and core site behavior (e.g., session cookies).
                </p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Analytics cookies</div>
                <p className="text-gray-300 mt-2">
                  Help us understand usage patterns (pages visited, performance) so we can improve the experience.
                </p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Preference cookies</div>
                <p className="text-gray-300 mt-2">
                  Remember your settings such as filters, tabs, or interface preferences.
                </p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Do Not Track</div>
                <p className="text-gray-300 mt-2">
                  Some browsers offer “Do Not Track” signals. There is no universal standard; we respond as required by applicable law.
                </p>
              </div>
            </div>
          </Card>

          <Card
            id="retention"
            title="8. Data Retention"
            subtitle="We keep information only as long as needed for operations, legal obligations, and safety."
            icon={<Database className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              We retain data for as long as necessary to provide Services, meet legal obligations, resolve disputes, and enforce agreements.
              Retention periods vary by data type and use:
            </p>
            <BulletList>
              <li>
                <strong>Account data:</strong> retained while your account is active; some records may remain for a period after deletion for compliance and security.
              </li>
              <li>
                <strong>Transaction records:</strong> retained as required for accounting, tax, and audit obligations.
              </li>
              <li>
                <strong>Security logs:</strong> retained for a limited period to detect and prevent fraud/abuse.
              </li>
              <li>
                <strong>Public listing data:</strong> may remain visible if it is a business-public profile; you can request updates or removal where applicable.
              </li>
            </BulletList>
            <FinePrint>
              If you request deletion, we may retain certain information when legally required or necessary for security and fraud prevention.
            </FinePrint>
          </Card>

          <Card
            id="security"
            title="9. Security Measures"
            subtitle="We implement safeguards, but no online service can guarantee 100% security."
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              We use administrative, technical, and physical safeguards designed to protect information, including:
            </p>
            <BulletList>
              <li>HTTPS encryption in transit.</li>
              <li>Role-based access control for internal tools.</li>
              <li>Secure authentication and session controls.</li>
              <li>Monitoring and logging for fraud and abuse detection.</li>
              <li>Vendor security reviews where appropriate.</li>
            </BulletList>
            <div className="mt-4 bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <AlertTriangle className="h-4 w-4" />
                Your role matters
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Use a strong password, don’t reuse passwords across sites, and report suspicious activity immediately.
              </p>
            </div>
          </Card>

          <Card
            id="rights"
            title="10. Your Privacy Rights"
            subtitle="Options available to you. Some rights depend on your location."
            icon={<UserCheck className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              You may have the right to request access, correction, deletion, or portability of your personal information,
              and to opt out of certain uses. We will respond as required by applicable law.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Account controls</div>
                <BulletList>
                  <li>Update account details via your dashboard (where available).</li>
                  <li>Opt out of marketing emails using the unsubscribe link.</li>
                  <li>Adjust cookie settings in your browser.</li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">Request-based rights</div>
                <BulletList>
                  <li>Request access to data we hold about you.</li>
                  <li>Request correction of inaccurate information.</li>
                  <li>Request deletion (subject to exceptions such as legal compliance).</li>
                </BulletList>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 md:col-span-2">
                <div className="text-yellow-200 font-extrabold">How to exercise rights</div>
                <p className="text-gray-300 mt-2">
                  Email us at <strong>support@blackwealthexchange.com</strong> with the subject line{" "}
                  <strong>“Privacy Request”</strong> and include:
                </p>
                <BulletList>
                  <li>Your name and the email associated with your account.</li>
                  <li>The type of request (access, correction, deletion, etc.).</li>
                  <li>Any details that help us locate the information.</li>
                </BulletList>
                <FinePrint>
                  We may need to verify your identity before processing certain requests.
                </FinePrint>
              </div>
            </div>
          </Card>

          <Card
            id="international"
            title="11. International Users"
            subtitle="Where processing happens."
            icon={<Globe className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              Our Services are operated from the United States. If you access the Services from outside the U.S.,
              you understand that information may be processed and stored in the U.S. and other jurisdictions where our vendors operate.
            </p>
          </Card>

          <Card
            id="children"
            title="12. Children’s Privacy"
            subtitle="We do not knowingly collect information from children under 13."
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              BWE is not intended for children under 13. We do not knowingly collect personal information from children.
              If we learn that a child under 13 has provided personal information, we will delete it promptly.
            </p>
          </Card>

          <Card
            id="changes"
            title="13. Changes to This Policy"
            subtitle="We may update this policy as our platform grows."
            icon={<FileText className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              We may update this Privacy Policy to reflect changes in technology, law, or our practices. When we do, we’ll update
              the “Last updated” date at the top. If changes are significant, we may notify you through email or a website banner.
            </p>
          </Card>

          <Card
            id="contact"
            title="14. Contact Us"
            subtitle="Questions or privacy requests? Reach out."
            icon={<Mail className="h-5 w-5" />}
          >
            <p className="text-gray-200">
              If you have any questions about this Privacy Policy or how your information is handled, contact us:
            </p>

            <div className="mt-4 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-gray-200">
              <div className="font-extrabold text-yellow-200">Black Wealth Exchange</div>
              <div className="mt-2">
                <strong>Email:</strong> support@blackwealthexchange.com
              </div>
              <div className="mt-1">
                <strong>Address:</strong> 123 Prosperity Lane, Atlanta, GA 30303
              </div>

              <FinePrint>
                Replace the address above with your real business mailing address if this is a placeholder.
              </FinePrint>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-white/5 text-yellow-200 border border-yellow-500/25 hover:bg-yellow-500/10 transition"
              >
                Back to Home <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#top"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-yellow-500 text-black hover:bg-yellow-400 transition"
              >
                Back to Top <ArrowRight className="h-4 w-4 rotate-180" />
              </a>
            </div>
          </Card>
        </main>

        <div className="h-10" />
      </div>
    </>
  );
};

export default PrivacyPolicy;
