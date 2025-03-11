import Link from "next/link";

export default function Jobs() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gold">
            Black Wealth Exchange Job Hub
          </h1>
          <Link href="/">
            <button className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
              Home
            </button>
          </Link>
        </div>

        <p className="text-gray-300">
          Connect with top Black talent, discover job opportunities, and hire skilled professionals.
        </p>

        {/* 📌 Job Search & Hiring Sections */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find a Job */}
          <div className="p-6 bg-gold text-black font-semibold rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Find a Job</h3>
            <p className="mt-2 text-sm">
              Browse open positions from Black-owned businesses and companies committed to diversity hiring.
            </p>
            <Link href="/job-listings">
              <button className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition">
                Explore Jobs
              </button>
            </Link>
          </div>

          {/* Hire Black Talent */}
          <div className="p-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Hire Black Talent</h3>
            <p className="mt-2 text-sm">
              Post job openings—fee based—and connect with highly skilled Black professionals.
            </p>
            <Link href="/post-job">
              <button className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition">
                Post a Job
              </button>
            </Link>
          </div>

          {/* Internships & College Opportunities */}
          <div className="p-6 bg-green-500 text-white font-semibold rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Internships &amp; College Opportunities</h3>
            <p className="mt-2 text-sm">
              Get early career experience with internship and apprenticeship programs.
            </p>
            <Link href="/internships">
              <button className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition">
                View Internships
              </button>
            </Link>
          </div>

          {/* Freelance & Gig Work */}
          <div className="p-6 bg-red-500 text-white font-semibold rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Freelance &amp; Gig Work</h3>
            <p className="mt-2 text-sm">
              Work on short-term projects or hire Black freelancers for specialized skills.
            </p>
            <Link href="/freelance">
              <button className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition">
                Explore Gigs
              </button>
            </Link>
          </div>
        </div>

        {/* 🔥 Mentorship Program */}
        <div className="mt-10 p-6 bg-purple-600 text-white font-semibold rounded-lg shadow-md">
          <h3 className="text-xl font-bold">Mentorship Program</h3>
          <p className="mt-2 text-sm">
            Join our mentorship program where experienced industry leaders and entrepreneurs help guide you on your career path.
          </p>
          <Link href="/mentorship">
            <button className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition">
              Become a Mentee
            </button>
          </Link>
        </div>

        {/* 🔥 Professional Networking */}
        <div className="mt-10 p-6 bg-teal-500 text-white font-semibold rounded-lg shadow-md">
          <h3 className="text-xl font-bold">Professional Networking</h3>
          <p className="mt-2 text-sm">
            Create your professional network with fellow Black professionals. Share knowledge, exchange opportunities, and grow together.
          </p>
          <Link href="/networking">
            <button className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition">
              Join Networking Community
            </button>
          </Link>
        </div>

        {/* 🚀 Create Your Profile Section */}
        <div className="mt-10 text-center">
          <h2 className="text-xl font-bold text-gold">Join Our Professional Network</h2>
          <p className="text-gray-300">
            Create your profile, connect with peers, and unlock exclusive career opportunities—just like LinkedIn, and more.
          </p>
          <div className="flex justify-center mt-4 gap-4">
            <Link href="/signup">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Create Profile
              </button>
            </Link>
            <Link href="/login">
              <button className="px-6 py-3 bg-gold text-black rounded-lg hover:bg-yellow-500 transition">
                Login
              </button>
            </Link>
          </div>
        </div>

        {/* 💡 Premium Career Growth Content */}
        <div className="mt-10 text-center">
          <h2 className="text-xl font-bold text-gold">Level Up Your Career</h2>
          <p className="text-gray-300">
            Get exclusive access to resume reviews, job interview training, and mentorship.
          </p>
          <Link href="/pricing">
            <button className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Upgrade to Premium
            </button>
          </Link>
        </div>

        {/* Back to Home Button at the Bottom */}
        <div className="text-center mt-10">
          <Link href="/">
            <button className="px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}