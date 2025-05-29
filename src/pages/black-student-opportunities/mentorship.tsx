// /pages/black-student-opportunities/mentorship.tsx

import React from "react";
import Image from "next/legacy/image";
import Link from "next/link";

const Mentorship = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* 🔥 Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50 pointer-events-none"></div>

      {/* 🔥 Hero Section */}
      
      {/* Hero/Header Section */}
      <header className="text-center py-8 sm:py-10 md:py-14 relative z-10">
        <Image
          src="/favicon.png"
          alt="Black Wealth Exchange Logo"
          width={100}
          height={100}
          className="mx-auto mb-3 sm:mb-4 animate-fadeIn"
          priority
        />
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-gold neon-text animate-slideUp leading-tight max-w-2xl mx-auto">
          Mentorship for Black Students
        </h1>
        <p className="text-base sm:text-lg md:text-xl mt-3 sm:mt-4 font-light text-gray-300 animate-fadeIn max-w-xl mx-auto">
          &quot;Mentorship is the key to unlocking new opportunities, building
          networks, and preparing for future careers.&quot;
        </p>
      </header>

      {/* Mentorship Programs Section */}
      <div className="container mx-auto p-6 mt-6 relative z-10">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-gold mb-4">
          Mentorship Programs for Black College Students
        </h2>
        <div className="space-y-6">
          {/* Ujima Mentoring Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <a
              href="https://prevention.ucsf.edu/education/ujima-mentoring-program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base sm:text-xl font-semibold text-gold hover:underline cursor-pointer"
            >
              Ujima Mentoring Program
            </a>
            <p className="mt-2">
              The Ujima Mentoring Program helps first-year African American
              students transition to campus life and thrive in their new
              environment.
            </p>
            <p className="mt-2">
              <strong>Benefits:</strong> Provides academic, social, and personal
              support to students as they adapt to the college experience.
            </p>
          </div>

          {/* HBCU Near-Peer Mentoring Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <a
              href="https://example.com/hbcu-near-peer-mentoring-program" // Replace with the correct URL
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-semibold text-gold hover:underline cursor-pointer"
            >
              HBCU Near-Peer Mentoring Program
            </a>
            <p className="mt-2">
              This 10-week internship helps Black youth navigate the transition
              from college to career by pairing them with near-peer mentors.
            </p>
            <p className="mt-2">
              <strong>Benefits:</strong> Provides real-world career exposure and
              mentorship to ease the transition from education to employment.
            </p>
          </div>

          {/* Black Executive and Student Training (B.E.S.T.) Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <a
              href="https://example.com/black-executive-student-training" // Replace with the correct URL
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-semibold text-gold hover:underline cursor-pointer"
            >
              Black Executive and Student Training (B.E.S.T.) Program
            </a>
            <p className="mt-2">
              Pairs HBCU students with successful Black executives to offer
              career mentorship, networking, and leadership development.
            </p>
            <p className="mt-2">
              <strong>Benefits:</strong> Provides students with direct guidance
              from industry leaders, fostering leadership and professional
              growth.
            </p>
          </div>

          {/* Career Readiness and Mentoring Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <a
              href="https://example.com/career-readiness-mentoring-program" // Replace with the correct URL
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-semibold text-gold hover:underline cursor-pointer"
            >
              Career Readiness and Mentoring Program
            </a>
            <p className="mt-2">
              This program helps Black and African-American healthcare
              professionals prepare for careers by connecting them with mentors
              in the field.
            </p>
            <p className="mt-2">
              <strong>Benefits:</strong> Prepares students for healthcare
              careers through mentoring, career coaching, and internship
              opportunities.
            </p>
          </div>

          {/* Heman Sweatt Center for Black Males Mentorship Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <a
              href="https://example.com/heman-sweatt-center-mentorship" // Replace with the correct URL
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-semibold text-gold hover:underline cursor-pointer"
            >
              Heman Sweatt Center for Black Males Mentorship Program
            </a>
            <p className="mt-2">
              This program helps Black male students connect with BIPOC faculty,
              staff, and community members to enhance academic and social
              success.
            </p>
            <p className="mt-2">
              <strong>Benefits:</strong> Supports students personal development,
              fosters academic success, and strengthens campus involvement.
            </p>
          </div>

          {/* Great Expectations Mentorship Program */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <a
              href="https://example.com/great-expectations-mentorship-program" // Replace with the correct URL
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-semibold text-gold hover:underline cursor-pointer"
            >
              Great Expectations Mentorship Program
            </a>
            <p className="mt-2">
              Pairs first-year or first-generation BIPOC students with
              upper-level students who provide academic and social guidance.
            </p>
            <p className="mt-2">
              <strong>Benefits:</strong> Provides essential support for
              first-generation students and helps ease the transition to higher
              education.
            </p>
          </div>
        </div>
      </div>

      {/* Mentorship Benefits Section */}
      <section className="container mx-auto p-6 mt-12 relative z-10">
        <h2 className="text-3xl font-semibold text-gold mb-6">
          Benefits of Mentorship
        </h2>
        <ul className="list-disc pl-6 space-y-4">
          <li>
            <strong>Build Networks:</strong> Mentors introduce students to
            professional networks, enhancing their career prospects.
          </li>
          <li>
            <strong>Develop Social Connections:</strong> Mentorship fosters
            relationships that provide emotional support and a sense of
            belonging.
          </li>
          <li>
            <strong>Get Academic Support:</strong> Mentors offer guidance on
            study techniques, navigating academic challenges, and time
            management.
          </li>
          <li>
            <strong>Feel Heard and Supported:</strong> A mentor is support
            boosts confidence and helps students feel more understood.
          </li>
          <li>
            <strong>Prepare for Careers:</strong> Mentors provide valuable
            insights into career choices, internships, and professional growth.
          </li>
          <li>
            <strong>Succeed Academically and Professionally:</strong> Mentorship
            equips students with the tools and guidance to succeed in both
            academics and their future careers.
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

export default Mentorship;
