// pages/terms-of-service.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";

const TermsOfService = () => {
  return (
    <>
      <Head>
        <title>Terms of Service | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Review the Terms of Service for Black Wealth Exchange. Use of this platform implies agreement to these legally binding terms."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* subtle glow */}
        <div className="pointer-events-none fixed inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
          <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 py-12">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gold">
                Terms of Service
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                Effective Date: April 1, 2025
              </p>
            </div>

            <Link href="/">
              <button className="px-4 py-2 rounded bg-gold text-black font-semibold hover:bg-yellow-500 transition">
                Home
              </button>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
            <p className="text-sm text-gray-300">
              By accessing or using Black Wealth Exchange (“BWE”), you agree to
              these legally binding Terms. If you do not agree, do not use the
              platform.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              These Terms work together with our{" "}
              <Link
                href="/privacy-policy"
                className="text-gold hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and any posted policies for Ads, Marketplace, Jobs, and Community
              standards.
            </p>
          </div>

          {/* Sections */}
          <div className="mt-10 space-y-10">
            <Section title="1. Mission and Purpose">
              Black Wealth Exchange is a private digital platform created to
              promote, empower, and support Black-owned businesses,
              entrepreneurs, professionals, and allies. Our mission is economic
              equity through commerce, access, and opportunity. Your use of this
              platform must align with that mission.
            </Section>

            <Section title="2. Definitions">
              <div className="space-y-2 text-gray-300">
                <p>
                  <strong className="text-white">“Platform”</strong> means the
                  BWE website, services, tools, features, and related content.
                </p>
                <p>
                  <strong className="text-white">“User”</strong> means any
                  person accessing the Platform.
                </p>
                <p>
                  <strong className="text-white">“Business Listing”</strong>{" "}
                  means a directory profile or listing submitted or displayed on
                  BWE.
                </p>
                <p>
                  <strong className="text-white">“Seller”</strong> means a user
                  who lists products/services in the Marketplace.
                </p>
                <p>
                  <strong className="text-white">“Employer”</strong> means a
                  user who posts jobs or recruitment content.
                </p>
                <p>
                  <strong className="text-white">“Content”</strong> means any
                  text, images, listings, reviews, files, messages, or other
                  materials posted, uploaded, or displayed.
                </p>
              </div>
            </Section>

            <Section title="3. Eligibility">
              You must be at least 18 years old or have verifiable
              parental/guardian consent to use our services. By using the
              Platform, you represent that all information you provide is
              truthful and accurate.
            </Section>

            <Section title="4. Accounts and Security">
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activity under your account. You
              agree to notify us immediately of suspected unauthorized use. We
              may suspend accounts for security reasons, suspected fraud, or
              policy violations.
            </Section>

            <Section title="5. Directory Listings and Submissions">
              All businesses and organizations listed must be accurately
              represented and comply with local, state, and federal laws. You
              agree not to submit:
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>False, misleading, or defamatory information</li>
                <li>Impersonations of individuals or businesses</li>
                <li>
                  Stolen content, logos, or images you do not have rights to
                </li>
                <li>Harmful, hateful, or illegal content</li>
              </ul>
              <p className="text-gray-300 mt-3">
                We may review, approve, reject, modify, or remove listings to
                protect data quality, trust, and user safety.
              </p>
            </Section>

            <Section title="6. Marketplace: Platform Role and Responsibilities">
              <p className="text-gray-300">
                BWE acts as a technology platform that connects buyers and
                sellers. Unless explicitly stated, BWE does not manufacture,
                store, ship, or inspect products and is not a party to the
                transaction between buyer and seller.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  Sellers are responsible for product accuracy, fulfillment,
                  shipping, returns (if offered), and customer support.
                </li>
                <li>
                  Buyers are responsible for reading listing details, shipping
                  terms, and seller policies before purchasing.
                </li>
                <li>
                  BWE may collect platform fees/commissions and payment charges
                  as disclosed during checkout or onboarding.
                </li>
              </ul>
              <p className="text-gray-300 mt-3">
                Disputes should be resolved directly between buyer and seller.
                We may assist with reporting tools and basic mediation, but we
                do not guarantee outcomes.
              </p>
            </Section>

            <Section title="7. Jobs & Recruiting Disclaimer">
              <p className="text-gray-300">
                Job listings and recruiting features are provided as a
                marketplace of opportunities. BWE is not the employer unless
                explicitly stated. We do not guarantee employment outcomes, job
                accuracy, candidate outcomes, or screening results.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  Employers are responsible for the truthfulness and legality of
                  job postings and hiring practices.
                </li>
                <li>
                  Applicants are responsible for verifying legitimacy and
                  protecting personal information.
                </li>
                <li>
                  We reserve the right to remove scam or suspicious job
                  postings.
                </li>
              </ul>
            </Section>

            <Section title="8. Advertising, Sponsored Content, and Paid Features">
              <p className="text-gray-300">
                Sponsored content, banner ads, featured listings, promoted jobs,
                and premium content may be available for purchase. All ads must
                comply with our community standards and ad submission
                guidelines. We may reject, remove, or suspend ads that violate
                policy or harm trust.
              </p>
              <p className="text-gray-300 mt-3">
                Unless required by law, fees for advertising or featured
                placement are generally non-refundable once the campaign has
                started or placement has been delivered.
              </p>
            </Section>

            <Section title="9. Payments, Refunds, and Chargebacks">
              <p className="text-gray-300">
                Payment processing may be handled by third-party providers (for
                example, Stripe). You agree to provide accurate payment
                information and authorize charges associated with your purchase.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  Digital content and premium access products may be
                  non-refundable once access is granted.
                </li>
                <li>
                  Advertising and featured placements may be non-refundable once
                  delivered.
                </li>
                <li>
                  Chargebacks or payment disputes may result in suspension of
                  your account and access to paid features.
                </li>
              </ul>
            </Section>

            <Section title="10. Prohibited Activities">
              You are strictly prohibited from:
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>Harassment, discrimination, hate speech, or abuse</li>
                <li>Impersonation or misrepresentation</li>
                <li>Fraud, scams, pyramid schemes, or unlawful activity</li>
                <li>Posting false or deceptive content</li>
                <li>Violating intellectual property rights</li>
                <li>
                  Attempting to hack, disrupt, scrape, reverse engineer, or
                  undermine the Platform
                </li>
                <li>
                  Automated scraping, harvesting, or copying of listings,
                  datasets, or platform content without written permission
                </li>
              </ul>
              <p className="text-gray-300 mt-3">
                Violations may result in content removal, account termination,
                and legal action.
              </p>
            </Section>

            <Section title="11. User Content License">
              <p className="text-gray-300">
                You retain ownership of the Content you submit. However, by
                posting Content on BWE, you grant BWE a worldwide,
                non-exclusive, royalty-free license to host, store, reproduce,
                display, distribute, and modify (for formatting/technical
                purposes) such Content for operating and promoting the Platform.
              </p>
              <p className="text-gray-300 mt-3">
                You represent that you have all rights necessary to grant this
                license and that your Content does not violate any third-party
                rights.
              </p>
            </Section>

            <Section title="12. Intellectual Property and DMCA">
              <p className="text-gray-300">
                The Platform’s branding, trademarks, designs, software, and
                proprietary datasets are owned by Black Wealth Exchange and are
                protected by law. Unauthorized use, replication, reverse
                engineering, or theft may result in legal consequences.
              </p>
              <p className="text-gray-300 mt-3">
                If you believe your copyrighted work is being infringed, you may
                submit a takedown notice to:{" "}
                <strong className="text-white">
                  support@blackwealthexchange.com
                </strong>
                . Include sufficient detail to identify the work, the allegedly
                infringing material, and your contact information.
              </p>
            </Section>

            <Section title="13. Community Mission & Inclusion Policy">
              We exist to support economic equity and systemic change through
              commerce. While our focus is on uplifting the Black community, we
              welcome respectful participation from all individuals and
              businesses aligned with our mission. Discrimination, hate speech,
              or exclusionary conduct will not be tolerated.
            </Section>

            <Section title="14. Termination and Enforcement">
              We may suspend or permanently ban your access without notice if
              you violate these Terms, harm the platform or users, engage in
              fraud/scams, or create security risk.
              <p className="text-gray-300 mt-3">
                We may report suspected unlawful conduct to authorities and
                pursue legal action for damages or losses caused by misuse.
              </p>
            </Section>

            <Section title="15. Disclaimer & Limitation of Liability">
              <p className="text-gray-300">
                The Platform is provided “as is” without warranties of any kind.
                To the fullest extent permitted by law, BWE is not liable for:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>User-generated content, listings, or transactions</li>
                <li>Interruptions, errors, downtime, or data loss</li>
                <li>Third-party misrepresentation or fraud</li>
              </ul>
              <p className="text-gray-300 mt-3">
                Our total liability is limited to the fees paid (if any) for
                services directly provided by BWE in the prior 12 months.
              </p>
            </Section>

            <Section title="16. Governing Law & Jurisdiction">
              These Terms are governed by the laws of the State of Georgia,
              United States. Any legal action must be brought in the state or
              federal courts located in Fulton County, Georgia. You waive any
              objection to venue or jurisdiction.
            </Section>

            <Section title="17. Changes to These Terms">
              We may revise these Terms at any time. Updates will be posted on
              this page, and continued use of the Platform constitutes
              acceptance of updated Terms.
            </Section>

            <Section title="18. Contact Us">
              If you have questions or concerns regarding these Terms, contact:
              <div className="mt-3 text-gray-300">
                <strong className="text-white">Black Wealth Exchange</strong>
                <br />
                Email: support@blackwealthexchange.com
                <br />
                Address: 123 Prosperity Lane, Atlanta, GA 30303
              </div>
            </Section>
          </div>

          <div className="mt-10 text-center">
            <Link href="/">
              <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-lg">
    <h2 className="text-xl font-semibold text-gold mb-3">{title}</h2>
    <div className="text-base leading-relaxed space-y-2 text-gray-200">
      {children}
    </div>
  </section>
);

export default TermsOfService;
