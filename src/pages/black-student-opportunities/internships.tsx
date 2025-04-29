// /pages/black-student-opportunities/internships.tsx

import React from "react";
import Image from "next/legacy/image";
import Link from "next/link";

const Internships = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50 pointer-events-none"></div>

      {/* Hero Section */}
      <header className="text-center py-32 relative z-10">
        <Image
          src="/favicon.png"
          alt="Black Wealth Exchnage Logo"
          width={120}
          height={120}
          className="mx-auto mb-4 animate-fadeIn"
        />
        <h1 className="text-4xl sm:text-5xl md:text-4xl font-extrabold tracking-wide text-gold neon-text animate-slideUp">
          Internships for Black Students
        </h1>
        <p className="text-xl md:text-2xl mt-4 font-light text-gray-300 animate-fadeIn">
          &quot;Internships are stepping stones to career opportunities,
          providing valuable work experience and exposure.&quot;
        </p>
      </header>

      {/* Internship Programs Section */}
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        <h2 className="text-3xl font-semibold text-gold mb-6">
          Internship Programs for Black College Students
        </h2>

        <div className="space-y-6">
          {/* Internship 1: Black Interns Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gold">
              Black Interns Program
            </h3>
            <p className="mt-2">
              The Black Interns Program offers paid internship opportunities at
              top companies for Black students seeking career experience.
            </p>
            <p className="mt-2">
              <strong>Eligibility:</strong> Must be enrolled in an accredited
              university or college, with a strong academic record and
              leadership potential.
            </p>
            <p className="mt-2">
              <strong>Deadline:</strong> June 1, 2025.
            </p>
            {/* Apply Now Button */}
            <a
              href="https://www.blackcareernetwork.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition"
            >
              Apply Now
            </a>
          </div>

          {/* Internship 2: Google Internship for Black Students */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gold">
              Google Internship for Black Students
            </h3>
            <p className="mt-2">
              The Google Internship program offers Black students opportunities
              in tech, engineering, and other related fields.
            </p>
            <p className="mt-2">
              <strong>Eligibility:</strong> Must be pursuing a degree in
              computer science, engineering, or a related field, with a passion
              for technology.
            </p>
            <p className="mt-2">
              <strong>Deadline:</strong> May 15, 2025.
            </p>
            {/* Apply Now Button */}
            <a
              href="https://buildyourfuture.withgoogle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition"
            >
              Apply Now
            </a>
          </div>

          {/* Internship 3: HBCU Internship Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gold">
              HBCU Internship Program
            </h3>
            <p className="mt-2">
              This program provides paid internship opportunities for Black
              students attending Historically Black Colleges and Universities
              (HBCUs).
            </p>
            <p className="mt-2">
              <strong>Eligibility:</strong> Must be enrolled at an accredited
              HBCU and demonstrate leadership skills and academic excellence.
            </p>
            <p className="mt-2">
              <strong>Deadline:</strong> March 31, 2025.
            </p>
            {/* Apply Now Button */}
            <a
              href="https://www.hbcuconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition"
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>

      {/* Internship Benefits Section */}
      <section className="container mx-auto p-6 mt-12 relative z-10">
        <h2 className="text-3xl font-semibold text-gold mb-6">
          Benefits of Internships
        </h2>
        <ul className="list-disc pl-6 space-y-4">
          <li>
            <strong>Real-World Experience:</strong> Internships provide hands-on
            experience in professional settings, enhancing students&apos;
            resumes.
          </li>
          <li>
            <strong>Networking Opportunities:</strong> Internships help students
            build relationships with professionals, peers, and future employers.
          </li>
          <li>
            <strong>Skill Development:</strong> Interns develop practical skills
            such as teamwork, communication, problem-solving, and technical
            abilities.
          </li>
          <li>
            <strong>Career Exposure:</strong> Internships allow students to
            explore various career fields and industries before making long-term
            decisions.
          </li>
          <li>
            <strong>Increased Job Prospects:</strong> Many internships lead to
            full-time job offers, providing a direct path from education to
            employment.
          </li>
          <li>
            <strong>Confidence Boost:</strong> Gaining work experience increases
            students&apos; confidence in their abilities and their career
            potential.
          </li>
        </ul>
      </section>

      {/* Back to Home Button */}
      <section className="text-center mt-10 relative z-20">
        <Link href="/">
          <button className="px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition">
            Back to Home
          </button>
        </Link>
      </section>
    </div>
  );
};

export default Internships;
