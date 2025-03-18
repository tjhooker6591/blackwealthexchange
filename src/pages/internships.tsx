import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const InternshipsPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/jobs")}
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Jobs
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">
            Internships & College Opportunities
          </h1>
          <p className="text-gray-300 mt-2">
            Get early career experience with internship and apprenticeship
            programs. Open doors to career opportunities and gain valuable work
            experience.
          </p>
        </header>

        {/* Program Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            Internships and apprenticeship programs provide an invaluable
            opportunity to gain early career experience and develop
            industry-relevant skills. Whether you are looking for your first job
            or exploring your field of interest, internships allow you to learn
            from professionals and build a network that can help propel your
            career forward.
          </p>
        </section>

        {/* Why Internships Matter Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Why Internships Matter
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Real-World Experience:</strong> Get hands-on experience
              that will set you apart in the job market.
            </li>
            <li>
              <strong>Networking Opportunities:</strong> Build connections with
              industry professionals and create a support network.
            </li>
            <li>
              <strong>Skill Development:</strong> Gain critical skills and
              knowledge that will be directly applicable to your career.
            </li>
            <li>
              <strong>Possible Full-Time Employment:</strong> Many internships
              can lead to full-time job offers after graduation.
            </li>
          </ul>
        </section>

        {/* Available Opportunities Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Available Opportunities
          </h2>
          <p className="text-gray-300">
            Explore the latest internships and apprenticeship programs available
            for college students and early career seekers. From tech and finance
            to healthcare and marketing, we have opportunities in various
            fields.
          </p>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Ready to start your career journey? Click the button below to view
            the available internships and apprenticeship programs that align
            with your interests and goals.
          </p>
          <Link href="/view-internships">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              View Internships
            </button>
          </Link>
        </section>

        {/* Testimonials Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            What Others Are Saying
          </h2>
          <blockquote className="text-gray-300 mt-4">
            &quot;My internship gave me the real-world experience I needed to secure
            my full-time job after graduation. I highly recommend it to anyone
            looking to build their career!&quot; – John S., Former Intern
          </blockquote>
        </section>

        {/* Benefits of Internships Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Program Benefits
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Gain valuable real-world experience in your chosen field.</li>
            <li>
              Develop a professional network of contacts that can support your
              career.
            </li>
            <li>
              Build essential skills like problem-solving, teamwork, and
              communication.
            </li>
            <li>
              Receive mentorship and guidance from experienced professionals.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default InternshipsPage;
