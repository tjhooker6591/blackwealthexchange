// pages/legal/advertising-guidelines.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";

const AdvertisingGuidelines = () => {
  return (
    <>
      <Head>
        <title>Advertising Guidelines | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Review the advertising requirements for Black Wealth Exchange. All ads must align with our mission and community standards."
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
                Advertising Guidelines
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                Last updated: April 1, 2025
              </p>
            </div>

            <div className="flex gap-2">
              <Link href="/">
                <button className="px-4 py-2 rounded border border-gray-700 text-gray-200 hover:bg-gray-900 transition">
                  ← Home
                </button>
              </Link>
              <Link href="/terms-of-service">
                <button className="px-4 py-2 rounded bg-gold text-black font-semibold hover:bg-yellow-500 transition">
                  Terms
                </button>
              </Link>
            </div>
          </div>

          {/* Intro */}
          <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg">
            <p className="text-gray-200 leading-relaxed">
              These Advertising Guidelines establish the standards all
              advertisers must follow to advertise on Black Wealth Exchange
              (“BWE”). Our platform is rooted in trust, transparency, and
              empowerment. By submitting or running an advertisement, you agree
              to these Guidelines.
            </p>
            <p className="text-gray-300 mt-3">
              Violations may result in ad rejection/removal, account suspension,
              loss of advertising privileges, forfeiture of fees, and legal
              action where appropriate.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Ads include (but are not limited to): banner ads, featured sponsor
              placements, sponsored listings, promoted products, promoted jobs,
              and any paid placements labeled “Sponsored,” “Featured,” or
              “Promoted.”
            </p>
          </div>

          {/* Sections */}
          <div className="mt-10 space-y-10">
            <Section title="1. Mission-Aligned Advertising">
              <p className="text-gray-300">
                All advertisements must align with our mission of uplifting
                Black communities through entrepreneurship, education, and
                ownership. We reserve the right to decline, remove, limit, or
                block any ad that we determine is inconsistent with our values,
                brand, trust standards, or user safety.
              </p>
              <p className="text-gray-300 mt-3">
                Ad placement does not imply endorsement by Black Wealth
                Exchange.
              </p>
            </Section>

            <Section title="2. Accuracy, Transparency, and Substantiation">
              <p className="text-gray-300">
                Ads must be clear, truthful, and not misleading. Any objective
                claim (pricing, discounts, “best,” “guaranteed,” performance,
                results, earnings, health outcomes) must be accurate and
                substantiated upon request.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>No false scarcity (“only 2 left” when untrue)</li>
                <li>No misleading countdown timers or urgency tactics</li>
                <li>No edited screenshots or fake testimonials</li>
                <li>
                  Disclose material terms (fees, eligibility, limitations)
                </li>
              </ul>
            </Section>

            <Section title="3. Prohibited Content and Restricted Categories">
              <p className="text-gray-300">
                The following are strictly prohibited on BWE:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>Hate speech, discriminatory, or harassment content</li>
                <li>
                  Adult content, pornography, or sexually explicit imagery
                </li>
                <li>Illegal drugs/substances or unlawful services</li>
                <li>Weapons and regulated weapon accessories</li>
                <li>Counterfeit goods, stolen goods, or trademark abuse</li>
                <li>Phishing, malware, spyware, or deceptive downloads</li>
                <li>MLM/pyramid schemes and “get-rich-quick” offers</li>
                <li>Unverifiable medical claims or “miracle cures”</li>
                <li>Predatory financial products or deceptive lending</li>
                <li>
                  Political persuasion/propaganda or inflammatory political
                  content
                </li>
                <li>Gambling, lottery, and similar high-risk promotions</li>
                <li>
                  Alcohol and nicotine/vape promotions (unless explicitly
                  approved in writing)
                </li>
              </ul>

              <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-5">
                <p className="text-sm text-gray-300">
                  If you are unsure whether your category is allowed, contact{" "}
                  <a
                    href="mailto:support@blackwealthexchange.com"
                    className="text-gold underline"
                  >
                    support@blackwealthexchange.com
                  </a>{" "}
                  before submitting.
                </p>
              </div>
            </Section>

            <Section title="4. Landing Page and Destination Requirements">
              <p className="text-gray-300">
                Ads must link to destinations that are safe, functional, and
                relevant to the ad.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>Destination must match the ad offer and messaging</li>
                <li>
                  Must not contain malware, forced downloads, or deceptive
                  redirects
                </li>
                <li>No pop-under spam, auto-redirect chains, or cloaking</li>
                <li>
                  Must be accessible on mobile and not intentionally broken
                </li>
                <li>
                  HTTPS is strongly preferred; we may reject non-HTTPS links
                </li>
              </ul>
            </Section>

            <Section title="5. Data Privacy, Tracking, and User Protection">
              <p className="text-gray-300">
                Advertising must respect user privacy and safety. You may not
                attempt to harvest personal data through ads or landing pages in
                deceptive ways.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  No collecting sensitive personal data without clear consent
                </li>
                <li>No deceptive “survey” funnels to capture emails/phones</li>
                <li>
                  No targeting or messaging based on sensitive characteristics
                </li>
                <li>No hidden trackers that violate applicable laws</li>
              </ul>
              <p className="text-gray-300 mt-3">
                You are responsible for complying with applicable privacy laws
                and disclosures (including cookie notices where required).
              </p>
            </Section>

            <Section title="6. Creative Standards (Design + Quality)">
              <p className="text-gray-300">
                Ads should look professional and be readable across devices. We
                may request edits or reject low-quality creatives.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>Use high-resolution images and clean typography</li>
                <li>
                  No flashing effects, strobe patterns, or aggressive animation
                </li>
                <li>
                  No excessive ALL CAPS, misleading buttons, or fake UI elements
                </li>
                <li>
                  Clear brand identity: business name + offer should be obvious
                </li>
                <li>Follow size/format rules in the submission form</li>
              </ul>
            </Section>

            <Section title="7. Review, Approval, and “Sponsored” Labeling">
              <p className="text-gray-300">
                Ads may be reviewed manually and/or automatically for
                compliance. We may approve, reject, request edits, limit
                placement, or remove ads at our discretion. Approved ads may be
                labeled “Sponsored,” “Featured,” or “Promoted.”
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>Review timelines may vary depending on volume and risk</li>
                <li>We may require verification for certain advertisers</li>
                <li>We may pause ads that generate high complaint rates</li>
              </ul>
            </Section>

            <Section title="8. Placement, Duration, Delivery, and Changes">
              <p className="text-gray-300">
                Placement tiers and durations are selected during checkout.
                Availability is limited and secured only after payment and
                confirmation.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  Requested placement is not guaranteed if inventory fills
                </li>
                <li>We may rotate ads to maintain a clean user experience</li>
                <li>Minor creative edits may require re-approval</li>
                <li>Replacing creatives mid-campaign may reset review time</li>
              </ul>
            </Section>

            <Section title="9. Click Fraud, Manipulation, and Abuse">
              <p className="text-gray-300">
                You may not manipulate performance metrics or user behavior.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>No incentivized clicking (“click to get money/prize”)</li>
                <li>No bots, click farms, or automated traffic</li>
                <li>No misleading “download” buttons that aren’t real</li>
                <li>No forced redirects or “trick” navigation</li>
              </ul>
            </Section>

            <Section title="10. Refunds, Cancellations, Removals, and Violations">
              <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-300">
                <li>
                  <strong className="text-white">No refunds</strong> for ads
                  removed due to guideline violations, fraud, or abuse.
                </li>
                <li>
                  If you cancel{" "}
                  <strong className="text-white">before publication</strong>, a
                  refund may be issued at our discretion and may include a
                  processing fee (e.g., 10%) to cover transaction costs.
                </li>
                <li>
                  If an ad is paused or removed due to repeated complaints or
                  safety concerns, you may lose remaining delivery time.
                </li>
                <li>
                  If we are unable to deliver a purchased placement due to
                  technical or inventory constraints, we may offer comparable
                  placement or a prorated remedy at our discretion.
                </li>
              </ul>
              <p className="text-gray-400 text-sm mt-3">
                Note: Payment providers may apply separate rules for disputes
                and chargebacks. Chargeback abuse may result in account
                suspension.
              </p>
            </Section>

            <Section title="11. Advertiser Responsibility and Indemnity">
              <p className="text-gray-300">
                Advertisers are solely responsible for:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>All claims, offers, and statements in their ads</li>
                <li>
                  Product/service delivery, customer support, and legal
                  compliance
                </li>
                <li>Destination content, privacy practices, and disclosures</li>
              </ul>
              <p className="text-gray-300 mt-3">
                You agree to indemnify and hold harmless Black Wealth Exchange
                from claims arising out of your advertisements, products,
                services, or violations of these Guidelines.
              </p>
            </Section>

            <Section title="12. Enforcement and Legal Rights">
              <p className="text-gray-300">
                We may reject or ban advertisers who abuse the system, mislead
                users, or harm platform trust. We may pursue legal remedies for
                defamation, impersonation, fraud, data theft, or attempts to
                damage BWE’s reputation.
              </p>
            </Section>

            <Section title="13. Contact and Advertising Support">
              <p className="text-gray-300">
                For advertising support, partnership inquiries, or campaign
                customization, contact:
              </p>
              <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-5">
                <p className="text-gray-300">
                  <strong className="text-white">Email:</strong>{" "}
                  <a
                    href="mailto:support@blackwealthexchange.com"
                    className="text-gold underline"
                  >
                    support@blackwealthexchange.com
                  </a>
                </p>
                <p className="text-gray-300 mt-2">
                  <strong className="text-white">Address:</strong> 123
                  Prosperity Lane, Atlanta, GA 30303
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  (Address is a placeholder — update as needed.)
                </p>
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
    <div className="text-base leading-relaxed space-y-2">{children}</div>
  </section>
);

export default AdvertisingGuidelines;
