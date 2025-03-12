import { useState } from "react";
import Link from "next/link";

const BlackStudentOpportunities = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="text-center py-32 relative z-10">
        <h1 className="text-6xl font-extrabold text-gold neon-text">
          Black Student Opportunities
        </h1>
        <p className="text-xl mt-4 font-light text-gray-300">
          Explore scholarships, grants, and mentorship programs for Black
          students.
        </p>

        {/* Search Bar */}
        <div className="mt-8 flex flex-col items-center space-y-6 w-full max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search for Scholarships or Grants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
          />
          <button className="px-8 py-3 bg-gradient-to-r from-gold to-yellow-500 text-black font-semibold text-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition">
            Search
          </button>
        </div>
      </header>

      {/* Scholarships & Grants Section */}
      <section className="container mx-auto p-6">
        <h2 className="text-3xl font-bold text-gold mb-4">
          Scholarships & Grants
        </h2>
        <p className="text-gray-300 mb-6">
          Find scholarships and grants available specifically for Black
          students. Explore various categories based on your field of study,
          eligibility, and deadlines.
        </p>

        {/* List of Scholarships/Grants */}
        <div className="space-y-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gold">
              <Link href="/scholarships/black-excellence-scholarship">
                Black Excellence Scholarship
              </Link>
            </h3>
            <p className="text-gray-300">Award: $5,000 | Field: Business</p>
            <p className="text-gray-400">
              Eligibility: African American students, Minimum GPA: 3.0
            </p>
            <p className="text-gray-500">Deadline: March 15, 2024</p>
            <Link href="/scholarships/black-excellence-scholarship">
              <button className="mt-4 px-6 py-2 bg-gold text-black rounded-lg">
                Apply Now
              </button>
            </Link>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gold">
              <Link href="/scholarships/tech-innovators-scholarship">
                Tech Innovators Scholarship
              </Link>
            </h3>
            <p className="text-gray-300">Award: $4,000 | Field: Technology</p>
            <p className="text-gray-400">
              Eligibility: African American students in Computer Science
            </p>
            <p className="text-gray-500">Deadline: April 30, 2024</p>
            <Link href="/scholarships/tech-innovators-scholarship">
              <button className="mt-4 px-6 py-2 bg-gold text-black rounded-lg">
                Apply Now
              </button>
            </Link>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gold">
              <Link href="/scholarships/stem-leaders-grant">
                STEM Leaders Grant
              </Link>
            </h3>
            <p className="text-gray-300">
              Award: $6,000 | Field: Science, Technology, Engineering,
              Mathematics
            </p>
            <p className="text-gray-400">
              Eligibility: Black students pursuing STEM degrees
            </p>
            <p className="text-gray-500">Deadline: May 31, 2024</p>
            <Link href="/scholarships/stem-leaders-grant">
              <button className="mt-4 px-6 py-2 bg-gold text-black rounded-lg">
                Apply Now
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mentorship & Career Development Section */}
      <section className="container mx-auto p-6 bg-gray-800 mt-12 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gold mb-4">
          Mentorship & Career Development
        </h2>
        <p className="text-gray-300 mb-6">
          Join mentorship programs and discover career development resources
          that will help guide your professional journey.
        </p>

        <div className="space-y-4">
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gold">
              <Link href="/mentorship">Professional Mentorship Program</Link>
            </h3>
            <p className="text-gray-300">
              Connect with Black professionals in your field of study.
            </p>
            <Link href="/mentorship">
              <button className="mt-4 px-6 py-2 bg-gold text-black rounded-lg">
                Join Mentorship Program
              </button>
            </Link>
          </div>

          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gold">
              <Link href="/internships">
                Black Business Internship Opportunities
              </Link>
            </h3>
            <p className="text-gray-300">
              Gain real-world experience with internships from Black-owned
              businesses.
            </p>
            <Link href="/internships">
              <button className="mt-4 px-6 py-2 bg-gold text-black rounded-lg">
                Explore Internships
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="text-center py-12 mt-16">
        <h2 className="text-2xl font-bold text-gold">Empower Your Future</h2>
        <p className="text-gray-300 mt-2">
          Take the next step in your educational journey and unlock financial
          support, mentorship, and career opportunities. Your future starts
          today!
        </p>
        <button className="mt-4 px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500">
          Explore More Opportunities
        </button>
      </section>

      {/* Back to Home Button */}
      <div className="text-center mt-10">
        <Link href="/">
          <button className="p-4 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gold hover:text-black transition duration-300">
            Back to Homepage
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BlackStudentOpportunities;
