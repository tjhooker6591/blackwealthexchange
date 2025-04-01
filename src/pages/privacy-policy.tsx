// pages/privacy-policy.tsx
import React from 'react';
import Head from 'next/head';

const PrivacyPolicy = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Read our Privacy Policy to understand how Black Wealth Exchange collects, uses, and protects your information in alignment with our mission of economic empowerment."
        />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: April 1, 2025</p>

        <Section title="1. Who We Are">
          Black Wealth Exchange is a digital platform that connects users with Black-owned businesses, marketplace products, investment opportunities, and educational resources. Our mission is rooted in economic empowerment, financial literacy, and community upliftment. We value transparency and privacy as foundational to building trust with our users.
        </Section>

        <Section title="2. Information We Collect">
          We collect the following types of information:
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number, billing details.</li>
            <li><strong>Business Information:</strong> Business name, industry, product listings, tax ID, and contact info.</li>
            <li><strong>Account Activity:</strong> Login history, pages viewed, product interactions, saved listings.</li>
            <li><strong>Payment Data:</strong> Only the necessary information to process transactions via trusted third parties (e.g., Stripe).</li>
            <li><strong>Demographics (Optional):</strong> Racial identity or cultural background, strictly for the purpose of supporting and highlighting underrepresented businesses.</li>
            <li><strong>Technical Data:</strong> IP address, device type, browser information, referring URLs, cookies, and analytics tags.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          The information we collect helps us:
          <ul className="list-disc ml-6 mt-2">
            <li>Provide and maintain core services including business listings, marketplace operations, and educational content.</li>
            <li>Process transactions securely via encrypted payment gateways.</li>
            <li>Personalize user experiences based on preferences and interactions.</li>
            <li>Feature businesses, products, and content relevant to user interests.</li>
            <li>Conduct analytics to improve usability, performance, and content relevance.</li>
            <li>Prevent fraud and maintain platform integrity.</li>
            <li>Comply with legal and regulatory obligations.</li>
          </ul>
        </Section>

        <Section title="4. Consent and User Control">
          By using our platform, you consent to our privacy practices. You have full control over your data. You may:
          <ul className="list-disc ml-6 mt-2">
            <li>Update your personal and business details via your account dashboard.</li>
            <li>Opt-out of marketing communications at any time.</li>
            <li>Request access, correction, or deletion of your data by contacting us directly.</li>
            <li>Adjust cookie preferences via your browser settings.</li>
          </ul>
        </Section>

        <Section title="5. Community Mission & Non-Discrimination">
          We proudly center our work around uplifting the Black community while remaining open and inclusive to all. We never use personal data, including race or identity, to exclude or discriminate. Our goal is equitable access to opportunity, not division.
        </Section>

        <Section title="6. Information Sharing & Third Parties">
          We do not sell your personal data. Information may be shared only in the following cases:
          <ul className="list-disc ml-6 mt-2">
            <li>With third-party service providers (e.g., analytics tools, email services, payment processors).</li>
            <li>When legally required (e.g., in response to a subpoena, court order, or legal request).</li>
            <li>With your explicit consent (e.g., when submitting a public business profile).</li>
            <li>In the event of a business acquisition or merger, with notice provided to you.</li>
          </ul>
        </Section>

        <Section title="7. Cookies & Tracking Technologies">
          We use cookies and similar technologies to:
          <ul className="list-disc ml-6 mt-2">
            <li>Enable core platform functionality and user authentication.</li>
            <li>Analyze user behavior to improve performance and content relevance.</li>
            <li>Store user preferences and settings for convenience.</li>
          </ul>
          You can manage or disable cookies through your browser settings.
        </Section>

        <Section title="8. Data Retention">
          We retain user data only as long as necessary:
          <ul className="list-disc ml-6 mt-2">
            <li>To provide services and maintain records of business transactions.</li>
            <li>To comply with legal obligations and tax laws.</li>
            <li>Or until you delete your account or request removal of your data.</li>
          </ul>
        </Section>

        <Section title="9. Security Measures">
          We implement security measures including HTTPS, encrypted databases, role-based access control, and secure authentication. While we work to protect your data, no online service can guarantee 100% security. Please use strong passwords and contact us if you detect suspicious activity.
        </Section>

        <Section title="10. International Users">
          Our platform is based in the United States. If you are accessing the site from outside the U.S., you consent to the processing of your information in accordance with U.S. laws, which may differ from your local data protection regulations.
        </Section>

        <Section title="11. Children’s Privacy">
          This platform is not intended for children under the age of 13. We do not knowingly collect personal data from children. If we learn we have inadvertently gathered information from a child under 13, we will delete it promptly.
        </Section>

        <Section title="12. Updates to This Policy">
          We may update this Privacy Policy to reflect changes in technology, law, or our practices. When we do, we’ll revise the “Effective Date” at the top of this page and notify users via email or a website banner if changes are significant.
        </Section>

        <Section title="13. Contact Us">
          If you have any questions about this Privacy Policy or how your data is handled, please contact us:
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

export default PrivacyPolicy;

