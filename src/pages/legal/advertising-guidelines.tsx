// pages/legal/advertising-guidelines.tsx
import React from 'react';
import Head from 'next/head';

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
      <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Advertising Guidelines</h1>
        <p className="mb-8 text-base">
          These Advertising Guidelines establish the standards all advertisers must follow to advertise on Black Wealth Exchange. Our platform is rooted in trust, transparency, and empowerment. By submitting an advertisement, you agree to these guidelines. Violations may result in ad removal, account suspension, loss of advertising privileges, and legal action where necessary.
        </p>

        <Section title="1. Mission-Aligned Advertising">
          All advertisements must align with our core mission of uplifting Black communities through entrepreneurship, education, and ownership. We reserve the right to decline, remove, or block any ad that we determine to be inconsistent with our values, brand, or user safety. This includes ads promoting competitors or messaging that contradicts economic justice or equity.
        </Section>

        <Section title="2. Acceptable Content">
          Ads must be:
          <ul className="list-disc ml-6 mt-2">
            <li>Clear, truthful, and not misleading or exaggerated</li>
            <li>Relevant to the products or services advertised</li>
            <li>Accurate in claims and legally compliant</li>
            <li>Visually professional and appropriate for general audiences</li>
          </ul>
        </Section>

        <Section title="3. Prohibited Content">
          The following content types are strictly prohibited in any form:
          <ul className="list-disc ml-6 mt-2">
            <li>Hate speech, discriminatory, offensive, or politically incendiary material</li>
            <li>Adult content, pornography, or sexually suggestive imagery</li>
            <li>Weapons, drugs, illegal substances, or services in violation of local laws</li>
            <li>Multi-level marketing (MLM), pyramid schemes, or get-rich-quick offers</li>
            <li>Counterfeit goods, scam offers, or unverifiable medical/financial claims</li>
            <li>False scarcity, fear-based tactics, or misleading countdowns</li>
          </ul>
          Violators will be permanently banned and may face legal claims for platform abuse or reputational harm.
        </Section>

        <Section title="4. Banner and Ad Design Requirements">
          Submitted ad banners and promotional graphics must:
          <ul className="list-disc ml-6 mt-2">
            <li>Be high-quality, clear, and mobile-responsive</li>
            <li>Match the sizing and format requirements found on the submission form</li>
            <li>Exclude flashing effects, extreme color saturation, or overwhelming text</li>
            <li>Use brand-safe language and proper grammar</li>
          </ul>
          We reserve the right to request edits or rejections based on design quality alone.
        </Section>

        <Section title="5. Review and Approval Process">
          All ad submissions undergo manual review for compliance. Approval may take 1–3 business days. We reserve full discretion to:
          <ul className="list-disc ml-6 mt-2">
            <li>Approve, reject, or request modifications to any submission</li>
            <li>Limit the visibility, duration, or placement of approved ads</li>
            <li>Remove an ad at any time with or without explanation if a violation occurs or user complaints are received</li>
          </ul>
        </Section>

        <Section title="6. Duration, Placement, and Fees">
          Advertising durations and placement tiers (e.g., homepage banners, featured listings, top sponsor placements) are selected during checkout. Availability is limited and secured only after payment. All payments are processed securely via Stripe. Ad placement does not imply endorsement by Black Wealth Exchange.
        </Section>

        <Section title="7. Refunds, Removals, and Violations">
          <ul className="list-disc ml-6 mt-2">
            <li><strong>No refunds</strong> will be issued for ads that are removed due to violations of these guidelines.</li>
            <li>Refunds for canceled ads are available <strong>only before publication</strong> and subject to a 10% processing fee.</li>
            <li>Any attempt to defraud, mislead, or harm the platform through advertising will result in immediate removal, forfeiture of funds, legal reporting, and potential civil action.</li>
          </ul>
        </Section>

        <Section title="8. Enforcement and Legal Rights">
          We reserve the right to:
          <ul className="list-disc ml-6 mt-2">
            <li>Reject or ban advertisers who abuse the system, mislead users, or harm the platform</li>
            <li>Pursue legal damages for defamation, impersonation, fraud, or attempts to deceive users or damage the platform’s reputation</li>
            <li>Report any unlawful ads or advertiser behavior to authorities, regulatory bodies, or partner networks</li>
          </ul>
          Our mission is non-negotiable, and we will aggressively defend it.
        </Section>

        <Section title="9. Contact and Advertising Support">
          For advertising support, partnership inquiries, or campaign customization, please reach out to us directly:
          <br />
          <strong>Email:</strong> <a href="mailto:support@blackwealthexchange.com" className="text-blue-600 underline">support@blackwealthexchange.com</a><br />
          <strong>Address:</strong> 123 Prosperity Lane, Atlanta, GA 30303
        </Section>

        <p className="mt-8 text-sm text-gray-500">Last updated: April 1, 2025</p>
      </div>
    </>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div className="text-base space-y-2">{children}</div>
  </div>
);

export default AdvertisingGuidelines;
