import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const MentorshipProgram: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/jobs')}
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Jobs
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">Mentorship Program</h1>
          <p className="text-gray-300 mt-2">
            Join our mentorship program where experienced industry leaders and entrepreneurs help guide you on your career path.
          </p>
        </header>

        {/* Program Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            The Mentorship Program connects you with seasoned professionals and entrepreneurs who provide guidance, support, and networking opportunities. Whether you are just starting your career or looking to take the next step, this program offers invaluable insights and advice to help you achieve your professional goals.
          </p>
        </section>

        {/* Why Join Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Why Join the Mentorship Program?</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Guidance:</strong> Receive personalized advice from experienced professionals in your field.</li>
            <li><strong>Networking:</strong> Expand your network by connecting with industry leaders and other mentees.</li>
            <li><strong>Career Growth:</strong> Learn strategies to accelerate your career and gain confidence in your decisions.</li>
            <li><strong>Support:</strong> Find a mentor who understands your goals and challenges and can provide ongoing support.</li>
          </ul>
        </section>

        {/* Testimonials Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">What Mentees Are Saying</h2>
          <blockquote className="text-gray-300 mt-4">
            "The mentorship program has been a game-changer for my career. I’ve gained valuable insights and built connections that have helped me grow both personally and professionally."
          </blockquote>
          <p className="text-gray-300 mt-4">- Sarah M., Mentee</p>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Ready to take your career to the next level? Become a mentee today and start benefiting from the expertise of our mentors.
          </p>
          <Link href="/become-a-mentee">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Become a Mentee
            </button>
          </Link>
        </section>

        {/* Program Benefits Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Program Benefits</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Access to a diverse range of mentors with expertise in various fields.</li>
            <li>Opportunity for both personal and professional development through tailored mentorship sessions.</li>
            <li>Exclusive access to workshops, webinars, and networking events.</li>
            <li>Receive actionable feedback on your career goals and growth opportunities.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default MentorshipProgram;