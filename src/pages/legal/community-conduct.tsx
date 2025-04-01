// pages/legal/community-conduct.tsx
import React from 'react';
import Head from 'next/head';

const CommunityConduct = () => {
  return (
    <>
      <Head>
        <title>Community Code of Conduct | Black Wealth Exchange</title>
        <meta
          name="description"
          content="The Community Code of Conduct for Black Wealth Exchange outlines respectful and inclusive behavior standards to maintain a safe space for all users."
        />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Community Code of Conduct</h1>
        <p className="mb-8 text-base">
          Black Wealth Exchange is a mission-driven platform committed to economic justice, empowerment, and unity. Our Community Code of Conduct ensures that every member upholds the integrity of this space. By using our platform, you agree to adhere to the expectations outlined below. Violations will be met with strict enforcement, including legal action when appropriate.
        </p>

        <Section title="1. Respect and Inclusion">
          All users—regardless of race, ethnicity, gender identity, sexual orientation, religion, age, ability, or background—must be treated with dignity and respect. While our platform proudly centers Black experiences and businesses, we welcome all individuals who share our vision of equity and empowerment.
        </Section>

        <Section title="2. Zero Tolerance for Hate, Harassment, or Abuse">
          Any form of hate speech, harassment, bullying, defamation, intimidation, or discrimination—whether public or private—is strictly prohibited. This includes (but is not limited to):
          <ul className="list-disc ml-6 mt-2">
            <li>Racist, sexist, homophobic, transphobic, ableist, or xenophobic language or conduct</li>
            <li>Threats, doxxing, or attempts to silence others</li>
            <li>Targeted abuse, stalking, or repeated unwanted contact</li>
          </ul>
          Offenders will be immediately removed from the platform and may be reported to legal authorities.
        </Section>

        <Section title="3. Promote Uplifting & Constructive Engagement">
          Community participation should reflect our values of empowerment, education, and opportunity. Whether you are posting in social feeds, reviewing businesses, or communicating with other users:
          <ul className="list-disc ml-6 mt-2">
            <li>Be thoughtful, respectful, and encouraging</li>
            <li>Disagree respectfully—no personal attacks or inflammatory language</li>
            <li>Focus on collaboration, mutual growth, and solution-oriented dialogue</li>
          </ul>
        </Section>

        <Section title="4. Authenticity and Truthfulness">
          Misrepresentation is not tolerated. You must:
          <ul className="list-disc ml-6 mt-2">
            <li>Provide accurate and truthful information about yourself and your business</li>
            <li>Avoid plagiarizing, impersonating, or posting fake products, profiles, or content</li>
          </ul>
          Any discovered deception will result in immediate removal from the platform and, where necessary, legal recourse.
        </Section>

        <Section title="5. Content Standards and Posting Guidelines">
          Content must not include:
          <ul className="list-disc ml-6 mt-2">
            <li>Explicit, pornographic, or violent material</li>
            <li>Spam, misleading ads, or phishing attempts</li>
            <li>Unlicensed or copyrighted material without proper permission</li>
          </ul>
          You retain ownership of your content but grant us a limited license to display and promote it in connection with the platform. We reserve the right to remove or restrict content that violates this policy or undermines our mission.
        </Section>

        <Section title="6. Reporting Violations">
          If you witness or experience any behavior that violates this Code, you are encouraged to report it immediately to our team at <a href="mailto:support@blackwealthexchange.com" className="text-blue-600 underline">support@blackwealthexchange.com</a>. All reports are confidential and will be investigated thoroughly. Actions may include warnings, suspensions, bans, or referral to law enforcement.
        </Section>

        <Section title="7. Enforcement and Legal Protection">
          Black Wealth Exchange reserves the full right to moderate, restrict, suspend, or permanently remove users or content at our sole discretion. Any individual or entity attempting to harass, undermine, defame, or otherwise harm the platform or its users may be pursued legally for damages, defamation, disruption, or impersonation.
          <br /><br />
          We take our mission seriously. We will not hesitate to protect our brand, our users, and our community values through all available legal channels.
        </Section>

        <Section title="8. Continuous Growth and Feedback">
          We are committed to improving our standards and evolving alongside the needs of our community. We welcome respectful feedback and ideas. If you have suggestions for how we can better uphold equity, safety, and empowerment, contact us at <a href="mailto:support@blackwealthexchange.com" className="text-blue-600 underline">support@blackwealthexchange.com</a>.
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

export default CommunityConduct;
