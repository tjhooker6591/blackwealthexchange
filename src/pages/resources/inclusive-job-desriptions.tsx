// pages/resources/inclusive-job-descriptions.tsx
import Link from "next/link";
import React from "react";

export default function InclusiveJobDescriptions() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/resources"
          className="text-blue-500 hover:underline text-sm block mb-6"
        >
          ← Back to Resources
        </Link>

        <h1 className="text-3xl font-bold text-gold mb-4">
          Writing Inclusive Job Descriptions
        </h1>

        <p className="text-gray-300 mb-4">
          Job descriptions are often the first interaction a candidate has with
          your brand. Inclusive language helps attract a broader and more
          diverse talent pool.
        </p>

        <h2 className="text-xl text-blue-400 font-semibold mt-6 mb-2">
          Tips for Inclusive Language
        </h2>
        <ul className="list-disc ml-6 text-gray-400 space-y-2">
          <li>
            Use gender-neutral titles (e.g., &quot;Sales Representative&quot;
            instead of &quot;Salesman&quot;).
          </li>
          <li>
            Avoid jargon or overly corporate terms that may alienate newer
            professionals.
          </li>
          <li>Highlight your company&apos;s DEI commitment explicitly.</li>
          <li>
            Use accessible formatting: short paragraphs, bullet points, and
            plain language.
          </li>
        </ul>

        <h2 className="text-xl text-blue-400 font-semibold mt-6 mb-2">
          Sample Inclusive Phrase Replacements
        </h2>
        <ul className="list-disc ml-6 text-gray-400 space-y-2">
          <li>
            ❌ &quot;Aggressive self-starter&quot; → ✅ &quot;Proactive team
            contributor&quot;
          </li>
          <li>
            ❌ &quot;Rockstar/Ninja&quot; → ✅ &quot;Experienced professional
            with relevant skills&quot;
          </li>
        </ul>

        <p className="text-gray-400 mt-8">
          Small changes in your job post language can result in a significant
          difference in the candidates you attract.
        </p>
      </div>
    </div>
  );
}
