import Image from "next/image";
import Link from "next/link";

const Grants = () => {
  // Helper function to handle external links
  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50"></div>

      {/* Navbar with Logo */}
      <nav className="absolute top-4 left-6 flex items-center space-x-3 z-20">
        <Image src="/bwe-logo.png" alt="BWE Logo" width={50} height={50} />
        <h1 className="text-xl font-bold text-gold">Black Wealth Exchange</h1>
      </nav>

      {/* Hero Section */}
      <header className="text-center py-32 relative z-10">
        <Image src="/bwe-logo.png" alt="BWE Logo" width={120} height={120} className="mx-auto mb-4 animate-fadeIn" />
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-wide text-gold neon-text animate-slideUp">
          Grants for Black College Students
        </h1>
        <p className="text-xl md:text-2xl mt-4 font-light text-gray-300 animate-fadeIn">
          &quot;Grants provide essential financial support, reducing the financial burden on Black college students and
          empowering them to succeed.&quot;
        </p>
      </header>

      {/* Grants Content */}
      <div className="container mx-auto p-6 relative z-10">
        <div className="space-y-8">
          {/* Federal Pell Grant */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">Federal Pell Grant</h2>
            <p className="text-lg mt-2">
              The Federal Pell Grant is a need-based grant for undergraduate students who display exceptional financial
              need.
            </p>
            <button
              onClick={() => handleExternalLink("https://studentaid.gov/understand-aid/types/grants/pell")}
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer"
            >
              Apply Now
            </button>
          </div>

          {/* FSEOG Grant */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">
              Federal Supplemental Educational Opportunity Grant (FSEOG)
            </h2>
            <p className="text-lg mt-2">
              The FSEOG program provides need-based grants to low-income undergraduate students to promote access to
              postsecondary education.
            </p>
            <button
              onClick={() => handleExternalLink("https://studentaid.gov/understand-aid/types/grants/fseog")}
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer"
            >
              Apply Now
            </button>
          </div>

          {/* TEACH Grant */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">
              Teacher Education Assistance for College and Higher Education (TEACH) Grant
            </h2>
            <p className="text-lg mt-2">
              The TEACH Grant provides grants to students who plan to teach in high-need fields in low-income areas.
            </p>
            <button
              onClick={() => handleExternalLink("https://studentaid.gov/understand-aid/types/grants/teach")}
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer"
            >
              Apply Now
            </button>
          </div>

          {/* UNCF Emergency Grant */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gold">UNCF Emergency Student Aid</h2>
            <p className="text-lg mt-2">
              UNCF provides emergency grant funding to help students at UNCF-member institutions continue their
              education despite financial hardships.
            </p>
            <button
              onClick={() => handleExternalLink("https://uncf.org/programs/uncf-emergency-student-aid")}
              className="mt-4 inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Grants Benefits Section */}
      <section className="container mx-auto p-6 mt-12">
        <h2 className="text-3xl font-semibold text-gold mb-6">Benefits of Grants for Black College Students</h2>
        <ul className="list-disc pl-6 space-y-4">
          <li>
            <strong>No Repayment Required:</strong> Unlike loans, grants are gift aid that doesn&rsquo;t need to be repaid.
          </li>
          <li>
            <strong>Immediate Financial Relief:</strong> Grants can help cover immediate educational expenses like
            tuition, books, and supplies.
          </li>
          <li>
            <strong>Reduced Financial Burden:</strong> By lowering out-of-pocket costs, grants help make college more
            affordable and accessible.
          </li>
          <li>
            <strong>Focus on Education:</strong> With grant support, students can focus more on their studies and less
            on financial concerns.
          </li>
          <li>
            <strong>Career Flexibility:</strong> Since grants don&rsquo;t need to be repaid, students have more freedom in
            their career choices after graduation.
          </li>
        </ul>
      </section>

      {/* Additional Resources */}
      <section className="container mx-auto p-6 mt-12">
        <h2 className="text-3xl font-semibold text-gold mb-6">Additional Resources</h2>
        <div className="space-y-4">
          <p>
            <strong>FAFSA Application:</strong> Most grants require completion of the Free Application for Federal
            Student Aid (FAFSA).
            <button
              onClick={() => handleExternalLink("https://studentaid.gov/h/apply-for-aid/fafsa")}
              className="ml-4 inline-block px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer text-sm"
            >
              Complete FAFSA
            </button>
          </p>
          <p>
            <strong>State Grants:</strong> Check your state&rsquo;s higher education agency website for additional grant
            opportunities.
            <button
              onClick={() => handleExternalLink("https://www2.ed.gov/about/contacts/state/index.html")}
              className="ml-4 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer text-sm"
            >
              Find State Grants
            </button>
          </p>
        </div>
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
  );
};

export default Grants;