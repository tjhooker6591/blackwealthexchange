// pages/terms-of-service.tsx
import React from 'react';
import Head from 'next/head';

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
      <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: April 1, 2025</p>

        <Section title="1. Mission and Purpose">
          Black Wealth Exchange is a private digital platform created to promote, empower, and support Black-owned businesses, entrepreneurs, professionals, and allies. By accessing or using this platform, you agree to be legally bound by these Terms. If you do not agree, do not use the site.
        </Section>

        <Section title="2. User Eligibility">
          You must be at least 18 years old or have verifiable parental/guardian consent to use our services. By using the platform, you represent and warrant that you meet these requirements and that all information you provide is truthful and accurate.
        </Section>

        <Section title="3. Account Registration and Responsibility">
          Users must maintain the confidentiality of their login credentials and are responsible for all activity under their accounts. You agree to notify us immediately of any unauthorized use or suspected breach. We are not liable for losses due to compromised credentials.
        </Section>

        <Section title="4. Business Listings and Marketplace Use">
          All businesses listed must be:
          <ul className="list-disc ml-6 mt-2">
            <li>Legally registered and operating within applicable jurisdictions.</li>
            <li>Accurately represented with truthful descriptions and imagery.</li>
            <li>Providing goods or services that comply with local, state, and federal laws.</li>
          </ul>
          Fraudulent listings, misleading claims, or harmful content will result in immediate removal and potential legal action.
        </Section>

        <Section title="5. Prohibited Activities">
          You are strictly prohibited from using our platform for:
          <ul className="list-disc ml-6 mt-2">
            <li>Harassment, discrimination, hate speech, or abuse.</li>
            <li>Impersonating individuals or businesses.</li>
            <li>Posting false, misleading, or defamatory content.</li>
            <li>Violating intellectual property rights.</li>
            <li>Engaging in fraud, scams, pyramid schemes, or other unlawful activity.</li>
            <li>Attempting to hack, disrupt, or undermine the platform or other users.</li>
          </ul>
          Violators will be removed, banned, and legally pursued to the fullest extent.
        </Section>

        <Section title="6. Advertising and Paid Features">
          Sponsored content, banner ads, and marketplace promotions are available for purchase. All advertising must comply with our community values and ad submission guidelines. We reserve the right to reject, remove, or suspend ads that do not align with our mission or violate our standards.
        </Section>

        <Section title="7. Intellectual Property">
          All content, branding, trademarks, platform design, and custom code associated with Black Wealth Exchange are the exclusive property of the company. Unauthorized use, replication, reverse engineering, or theft of any component of the platform will result in legal consequences. We aggressively protect our intellectual property and reserve the right to pursue damages in court.
        </Section>

        <Section title="8. Community Mission & Inclusion Policy">
          We exist to support economic equity and systemic change through commerce. While our focus is on uplifting the Black community, we welcome respectful participation from all individuals and businesses that align with our mission. Discrimination, exclusionary conduct, or hate speech will not be tolerated.
        </Section>

        <Section title="9. Termination">
          We may suspend or permanently ban your access without notice if:
          <ul className="list-disc ml-6 mt-2">
            <li>You violate these Terms.</li>
            <li>You attempt to harm or undermine the platform or its users.</li>
            <li>You engage in fraud, scams, or malicious behavior.</li>
          </ul>
          We reserve the right to report such activity to relevant authorities and pursue legal action for damages or losses incurred by your misuse.
        </Section>

        <Section title="10. Disclaimer & Limitation of Liability">
          This platform is provided “as is” without warranties of any kind. We are not liable for:
          <ul className="list-disc ml-6 mt-2">
            <li>Any user-generated content, listings, or business transactions.</li>
            <li>Interruptions, errors, or platform downtime.</li>
            <li>Losses resulting from third-party use, misrepresentation, or fraud.</li>
          </ul>
          To the fullest extent permitted by law, our liability is limited to the fees paid (if any) for services directly provided by Black Wealth Exchange in the past 12 months.
        </Section>

        <Section title="11. Enforcement and Legal Action">
          We reserve all legal rights to pursue individuals or entities who infringe on our rights, misuse the platform, or cause reputational or financial harm. This includes but is not limited to:
          <ul className="list-disc ml-6 mt-2">
            <li>Filing legal claims for copyright/trademark violations.</li>
            <li>Pursuing monetary damages for breach of contract or malicious activity.</li>
            <li>Issuing cease-and-desist notices and legal takedowns.</li>
          </ul>
          We take threats against our community and brand seriously and will act swiftly and decisively to protect our users, partners, and company.
        </Section>

        <Section title="12. Governing Law & Jurisdiction">
          These Terms are governed by and construed under the laws of the State of Georgia, United States. Any legal action must be brought in the state or federal courts located in Fulton County, Georgia. You waive any objection to venue or jurisdiction.
        </Section>

        <Section title="13. Changes to Terms">
          We may revise these Terms at any time. Updates will be posted to this page, and continued use of the platform constitutes your acceptance of the updated Terms.
        </Section>

        <Section title="14. Contact Us">
          If you have any questions or concerns regarding these Terms, please contact us:
          <br />
          <strong>Black Wealth Exchange</strong><br />
          Email: support@blackwealthexchange.com<br />
          Address: 123 Prosperity Lane, Atlanta, GA 30303
        </Section>
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

export default TermsOfService;

