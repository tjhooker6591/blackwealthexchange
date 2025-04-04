'use client';

import React from 'react';

export default function EmployerArticles() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gold mb-6">Inclusive Hiring & Retention Strategies</h1>

        <ArticleSection
          title="1. Write Job Posts That Invite, Not Exclude"
          content="Avoid buzzwords like 'rockstar' or 'ninja' which can alienate applicants. Instead, focus on clear responsibilities and the real impact of the role. Use gender-neutral and accessible language."
        />

        <ArticleSection
          title="2. Expand Where You Post"
          content="Beyond LinkedIn or mainstream job boards, share your listing in Black professional groups, HBCU networks, and community platforms like Black Wealth Exchange."
        />

        <ArticleSection
          title="3. Interview With Intention"
          content="Use structured interviews where each candidate is asked the same questions. Involve diverse team members in the interview process to reduce unconscious bias."
        />

        <ArticleSection
          title="4. Support After the Offer"
          content="Onboarding is key to retention. Introduce mentors, offer community, and invest in growth paths. Inclusion doesn't stop at hiring—it’s an ongoing culture."
        />

        <ArticleSection
          title="5. Measure and Improve"
          content="Track where your applicants come from, who moves forward, and who stays. Use data to improve and ensure your processes support diverse success."
        />
      </div>
    </div>
  );
}

function ArticleSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gold mb-2">{title}</h2>
      <p className="text-gray-300">{content}</p>
    </div>
  );
}
