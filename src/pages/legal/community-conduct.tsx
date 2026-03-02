// pages/legal/community-conduct.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";

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
                Community Code of Conduct
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
              Black Wealth Exchange is a mission-driven platform committed to
              economic justice, empowerment, and unity. This Code of Conduct
              exists to protect our community and uphold the integrity of this
              space across the Directory, Marketplace, Jobs & Careers, Ads, and
              any community features.
            </p>
            <p className="text-gray-300 mt-3">
              By using Black Wealth Exchange (“BWE”), you agree to follow these
              standards. Violations may result in warnings, restrictions,
              account suspension, permanent bans, and — when appropriate — legal
              action or referral to authorities.
            </p>
          </div>

          {/* Sections */}
          <div className="mt-10 space-y-10">
            <Section title="1. Our Standard: Respect, Safety, and Mission Alignment">
              <p className="text-gray-300">
                Treat others with dignity. Protect people’s safety and privacy.
                Participate in ways that uplift the mission. We welcome all
                individuals who share our vision of equity and empowerment while
                proudly centering Black businesses and experiences.
              </p>
            </Section>

            <Section title="2. Zero Tolerance: Hate, Harassment, Threats, or Abuse">
              <p className="text-gray-300">
                Any hate speech, harassment, intimidation, bullying, or
                discriminatory conduct — whether public or private — is strictly
                prohibited.
              </p>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <PolicyCard title="Examples of prohibited behavior">
                  <ul className="list-disc ml-6 space-y-1 text-gray-300">
                    <li>
                      Racist, sexist, homophobic, transphobic, ableist, or
                      xenophobic language
                    </li>
                    <li>Slurs, dehumanizing content, or “coded” hate</li>
                    <li>Targeted harassment or dogpiling</li>
                    <li>Threats, extortion, intimidation, or coercion</li>
                    <li>Stalking or repeated unwanted contact</li>
                  </ul>
                </PolicyCard>

                <PolicyCard title="Immediate enforcement">
                  <p className="text-gray-300">
                    Severe violations may result in immediate removal from the
                    platform with no warning, including permanent bans and
                    reporting to legal authorities when necessary.
                  </p>
                </PolicyCard>
              </div>
            </Section>

            <Section title="3. Privacy and Safety: No Doxxing or Personal Harm">
              <p className="text-gray-300">
                You may not share, threaten to share, or solicit private
                personal information about anyone — including addresses, phone
                numbers, private emails, government IDs, or workplace details —
                without explicit permission.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>No doxxing or “exposing” posts</li>
                <li>No incitement of harassment or brigading</li>
                <li>
                  No sharing private messages without consent where prohibited
                  by law
                </li>
              </ul>
            </Section>

            <Section title="4. Authenticity: No Impersonation, Fraud, or Misrepresentation">
              <p className="text-gray-300">
                Trust is everything. You must provide accurate information about
                yourself, your business, and your offerings.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  No impersonation of individuals, brands, or organizations
                </li>
                <li>No fake listings, fake reviews, or deceptive claims</li>
                <li>
                  No scams, pyramid schemes, phishing, or “too good to be true”
                  offers
                </li>
              </ul>
              <p className="text-gray-300 mt-3">
                We may require verification for certain features and may remove
                suspicious content or accounts to protect the community.
              </p>
            </Section>

            <Section title="5. Content Standards: What You Can and Cannot Post">
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <PolicyCard title="Allowed and encouraged">
                  <ul className="list-disc ml-6 space-y-1 text-gray-300">
                    <li>Constructive reviews and honest experiences</li>
                    <li>Educational content and helpful resources</li>
                    <li>Opportunities, events, and community collaboration</li>
                    <li>Business updates and product highlights</li>
                  </ul>
                </PolicyCard>

                <PolicyCard title="Not allowed">
                  <ul className="list-disc ml-6 space-y-1 text-gray-300">
                    <li>Pornographic or explicitly sexual content</li>
                    <li>Graphic violence or gore</li>
                    <li>Spam, misleading ads, or link farming</li>
                    <li>Phishing, malware, or attempts to steal data</li>
                    <li>Copyrighted material without permission</li>
                  </ul>
                </PolicyCard>
              </div>

              <p className="text-gray-300 mt-4">
                You retain ownership of your content but grant BWE a limited
                license to display and promote it in connection with operating
                the platform (as described in our Terms).
              </p>
            </Section>

            <Section title="6. Marketplace Standards: Sellers and Buyers">
              <p className="text-gray-300">
                Marketplace interactions must remain respectful and honest.
                Sellers must accurately describe products/services and honor
                commitments. Buyers must communicate respectfully and follow
                posted terms.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>No counterfeit goods, stolen goods, or illegal products</li>
                <li>No harassment of buyers/sellers over disputes</li>
                <li>No coercion, threats, or “review extortion”</li>
              </ul>
            </Section>

            <Section title="7. Jobs & Recruiting Standards">
              <p className="text-gray-300">
                Employers must post truthful opportunities and never use job
                listings to scam or harvest personal data. Applicants must act
                professionally and avoid abusive behavior.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  No fake jobs, MLM recruiting disguised as hiring, or
                  “pay-to-apply” scams
                </li>
                <li>No discrimination or illegal hiring practices</li>
                <li>
                  No requests for sensitive personal data outside a legitimate
                  hiring process
                </li>
              </ul>
            </Section>

            <Section title="8. Ads and Promotions Standards">
              <p className="text-gray-300">
                Sponsored content must be truthful, respectful, and aligned with
                community values. We may reject, remove, or suspend ads that are
                misleading, exploitative, or damaging to trust.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>No deceptive claims or bait-and-switch offers</li>
                <li>No hateful content or targeting protected groups</li>
                <li>
                  No “get rich quick” schemes or predatory financial traps
                </li>
              </ul>
            </Section>

            <Section title="9. Platform Integrity: No Hacking, Scraping, or Abuse of Systems">
              <p className="text-gray-300">
                You may not attempt to disrupt the platform, steal data, scrape
                our listings, reverse engineer features, or bypass access
                controls.
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-1 text-gray-300">
                <li>
                  No automated scraping/harvesting of listings or datasets
                </li>
                <li>
                  No probing, brute-force, or credential-stuffing attempts
                </li>
                <li>
                  No attempts to bypass paywalls, gating, or account controls
                </li>
                <li>No malicious automation or spamming APIs/forms</li>
              </ul>
            </Section>

            <Section title="10. Reporting Violations">
              <p className="text-gray-300">
                If you witness or experience a violation, report it immediately.
                Reports are handled confidentially where possible.
              </p>

              <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-5">
                <p className="text-gray-300">
                  Email:{" "}
                  <a
                    href="mailto:support@blackwealthexchange.com"
                    className="text-gold underline"
                  >
                    support@blackwealthexchange.com
                  </a>
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Include: (1) what happened, (2) usernames/listing links, (3)
                  dates/times, (4) screenshots/URLs if available.
                </p>
              </div>
            </Section>

            <Section title="11. Enforcement: What We May Do">
              <p className="text-gray-300">
                We reserve the right to moderate, restrict, suspend, or remove
                users and content at our sole discretion to protect the mission,
                platform trust, and user safety.
              </p>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <PolicyCard title="Typical enforcement ladder">
                  <ul className="list-disc ml-6 space-y-1 text-gray-300">
                    <li>Content removal</li>
                    <li>Warning or required correction</li>
                    <li>Feature limits (posting, messaging, ads)</li>
                    <li>Temporary suspension</li>
                    <li>Permanent ban</li>
                  </ul>
                </PolicyCard>

                <PolicyCard title="Immediate removal cases">
                  <ul className="list-disc ml-6 space-y-1 text-gray-300">
                    <li>Hate speech, threats, or violence</li>
                    <li>Doxxing and privacy attacks</li>
                    <li>Fraud/scams and malicious activity</li>
                    <li>Platform hacking/scraping attempts</li>
                  </ul>
                </PolicyCard>
              </div>

              <p className="text-gray-300 mt-4">
                We may also take legal action for defamation, impersonation,
                disruption, data theft, or other malicious conduct, and may
                refer matters to law enforcement when appropriate.
              </p>
            </Section>

            <Section title="12. Continuous Growth and Feedback">
              <p className="text-gray-300">
                We are committed to improving alongside the needs of our
                community. We welcome respectful feedback and ideas — especially
                ways to strengthen safety, trust, and economic empowerment.
              </p>
              <p className="text-gray-300 mt-2">
                Contact:{" "}
                <a
                  href="mailto:support@blackwealthexchange.com"
                  className="text-gold underline"
                >
                  support@blackwealthexchange.com
                </a>
              </p>
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

function PolicyCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-black/30 p-5">
      <h3 className="text-gold font-semibold mb-2">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default CommunityConduct;
