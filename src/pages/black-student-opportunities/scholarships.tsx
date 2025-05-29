import Image from "next/legacy/image";
import Link from "next/link";

const ScholarshipsPage = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50" />

{/* Hero Section */}
<header className="text-center py-10 sm:py-14 md:py-18 relative z-10">
  <Image
    src="/favicon.png"
    alt="Black Wealth Exchange Logo"
    width={100}
    height={100}
    className="mx-auto mb-3 sm:mb-4 animate-fadeIn"
    priority
  />
  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-gold neon-text animate-slideUp leading-tight max-w-2xl mx-auto">
  Scholarships for Black Students
</h2>

  <p className="text-base sm:text-lg md:text-xl mt-3 sm:mt-4 font-light text-gray-300 animate-fadeIn max-w-xl mx-auto">
    &quot;Scholarships provide essential financial support to Black students pursuing higher education.&quot;
  </p>
</header>

{/* Scholarships Content */}
<div className="container mx-auto mt-4 sm:mt-6 md:mt-8 p-6 relative z-10">
  <div className="space-y-8">
    {/* Jackie Robinson Foundation */}
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gold">
        Jackie Robinson Foundation Scholarship
      </h2>
      <p className="text-lg mt-2">
        Provides up to $35,000 over four years to Black high school seniors demonstrating leadership and community service.
      </p>
      <p className="mt-2">
        <strong>Eligibility:</strong> Must be a high school senior, demonstrate leadership potential, and have a minimum SAT score of 1,000 or ACT score of 21.
      </p>
      <p className="mt-2">
        <strong>Deadline:</strong> March 31, 2025.
      </p>
      <Link
        href="https://jackierobinson.org/apply/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
      >
        Apply Now
      </Link>
    </div>
 
          {/* Ron Brown Scholar Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">
              Ron Brown Scholar Program
            </h2>
            <p className="text-lg mt-2">
              Offers up to $40,000 over four years to Black high school seniors
              who demonstrate academic excellence and community service.
            </p>
            <p className="mt-2">
              <strong>Eligibility:</strong> Must be a Black/African American
              high school senior, demonstrate academic excellence, and exhibit
              leadership and community service.
            </p>
            <p className="mt-2">
              <strong>Deadline:</strong> January 9, 2025.
            </p>
            <Link
              href="https://ronbrown.org/apply/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Apply Now
            </Link>
          </div>

          {/* UNCF Scholarship */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">
              UNCF General Scholarship
            </h2>
            <p className="text-lg mt-2">
              Provides financial assistance to students attending UNCF member
              institutions.
            </p>
            <p className="mt-2">
              <strong>Eligibility:</strong> Must be enrolled full-time at a UNCF
              member institution, demonstrate financial need, and have a minimum
              GPA of 2.5.
            </p>
            <p className="mt-2">
              <strong>Deadline:</strong> March 31, 2025.
            </p>
            <Link
              href="https://uncf.org/scholarships"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Application Tips */}
        <section className="mt-12">
          <h2 className="text-3xl font-semibold text-gold mb-4">
            Application Tips
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Start Early:</strong> Begin your scholarship search and
              application process well in advance to meet deadlines.
            </li>
            <li>
              <strong>Personal Statement:</strong> Write a compelling personal
              statement that highlights your achievements, goals, and community
              involvement.
            </li>
            <li>
              <strong>Letters of Recommendation:</strong> Secure strong letters
              from mentors, teachers, or community leaders who can speak to your
              character and accomplishments.
            </li>
            <li>
              <strong>Proofread:</strong> Carefully review your application
              materials for errors and clarity before submission.
            </li>
          </ul>
        </section>

        {/* Additional Resources */}
        <section className="mt-12">
          <h2 className="text-3xl font-semibold text-gold mb-4">
            Additional Resources
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Link
                href="https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory/race/african-american"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                Scholarships.com: African American Scholarships
              </Link>{" "}
              - A comprehensive directory of scholarships for African American
              students.
            </li>
            <li>
              <Link
                href="https://www.bold.org/scholarships/by-demographics/minorities/black-students-scholarships/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                Bold.org: Scholarships for Black Students
              </Link>{" "}
              - A platform offering various scholarships specifically for Black
              students.
            </li>
          </ul>
        </section>

        {/* Back to Home Button */}
        <section className="text-center mt-10 pb-10">
          <Link href="/">
            <span className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer">
              Back to Home
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default ScholarshipsPage;
