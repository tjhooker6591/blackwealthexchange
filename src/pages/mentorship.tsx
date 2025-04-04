import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const MentorshipProgram: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
        {/* 🔙 Back to Jobs */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/jobs")}
            className="px-4 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition"
          >
            ← Back to Jobs
          </button>
        </div>

        {/* 🚀 Header */}
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gold mb-2">Mentorship Program</h1>
          <p className="text-gray-300">
            Join our mentorship program where experienced leaders help guide you toward your career goals.
          </p>
        </header>

        {/* 📘 Overview */}
        <Section title="Overview">
          The Mentorship Program connects you with professionals who offer support, career advice, and industry insight. Whether you are starting out or advancing your path, you will gain clarity, confidence, and community.
        </Section>

        {/* 💡 Why Join */}
        <Section title="Why Join the Mentorship Program?">
          <ul className="list-disc ml-6 space-y-2 text-gray-300">
            <li><strong>Guidance:</strong> Personalized advice from professionals in your field.</li>
            <li><strong>Networking:</strong> Expand your circle through intentional connections.</li>
            <li><strong>Career Growth:</strong> Get strategies to move forward and level up.</li>
            <li><strong>Support:</strong> Work with mentors who understand your goals and barriers.</li>
          </ul>
        </Section>

        {/* 💬 Testimonials */}
        <Section title="What Mentees Are Saying">
          <blockquote className="text-gray-300 italic border-l-4 border-gold pl-4 mt-2">
            The mentorship program has been a game-changer for my career. I have gained insights and built connections that helped me grow personally and professionally.
          </blockquote>
          <p className="text-gray-400 mt-2">– Sarah M., Mentee</p>
        </Section>

        {/* 🚀 Take Action */}
        <Section title="Next Steps">
          <p className="text-gray-300">
            Ready to take your career to the next level? Become a mentee today and unlock the support you deserve.
          </p>
          <Link href="/become-a-mentee">
            <button className="mt-4 px-5 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition">
              Become a Mentee
            </button>
          </Link>
        </Section>

        {/* 🎁 Program Benefits */}
        <Section title="Program Benefits">
          <ul className="list-disc ml-6 space-y-2 text-gray-300">
            <li>Access to mentors across tech, business, finance, and more.</li>
            <li>Tailored one-on-one sessions for real development.</li>
            <li>Exclusive invites to virtual workshops and networking events.</li>
            <li>Ongoing career feedback and professional guidance.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-2xl font-bold text-blue-400 mb-3">{title}</h2>
    <div className="text-gray-300">{children}</div>
  </section>
);

export default MentorshipProgram;
