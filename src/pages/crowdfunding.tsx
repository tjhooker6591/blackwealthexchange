import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";

// Comment:
// We should build our own funding company to support Black-owned businesses and projects. By creating a Black-owned funding platform, we would directly empower Black entrepreneurs, provide equitable access to capital, and keep wealth circulating within our community.
// The benefits of such a platform are immense: it can bridge the funding gap, promote sustainable businesses, and provide Black-led projects with the resources they need to grow and thrive.

const BlackProjectsPage = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gold to-yellow-500 p-20 text-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Support Black-Led Projects through Crowdfunding
          </h1>
          <p className="text-xl md:text-2xl mt-4 text-gray-300">
            Invest in Black-led projects and help empower the community through
            crowdfunding.
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <Link href="/">
          <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
            <Home className="w-6 h-6 mr-2" /> Back to Home
          </button>
        </Link>
      </div>

      {/* Paragraph Explaining the Impact */}
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-gray-300 mt-6">
          Supporting Black-owned crowdfunding projects is not just about
          contributing money—it&rsquo;s about creating a ripple effect of
          empowerment and opportunity. When we, as a community, come together to
          invest in each other's dreams, we ignite a cycle of support that
          strengthens our businesses, fosters innovation, and uplifts entire
          communities. Every dollar spent on these initiatives helps to **close
          the wealth gap**, create **new jobs**, and build a **sustainable
          economic foundation**. By supporting Black-led projects, we invest in
          a **future where Black entrepreneurship thrives**, and we lay the
          groundwork for generational wealth. It&rsquo;s time to shift the
          narrative, build wealth from within, and **make a lasting
          difference**.
        </p>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-8">
        {/* Kickstarter Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Kickstarter: Fund Black Art, Technology, and Community Projects
          </h2>
          <p className="text-gray-300 mb-4">
            Kickstarter is one of the most popular crowdfunding platforms for
            creative projects. Many Black entrepreneurs use Kickstarter to fund
            their art, technology, and community-based projects. By supporting
            projects on Kickstarter, you are helping bring important initiatives
            to life.
          </p>
          <a
            href="https://www.kickstarter.com"
            target="_blank"
            className="text-gold hover:text-yellow-500 font-bold"
          >
            Visit Kickstarter
          </a>
        </div>

        {/* GoFundMe Section */}
        <div className="bg-blue-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            GoFundMe: Support Community-Focused Initiatives
          </h2>
          <p className="text-gray-300 mb-4">
            GoFundMe is widely known for personal causes, but it also supports
            community-focused initiatives. Many Black-led projects use GoFundMe
            to gain support for their initiatives, such as community-based
            organizations, education programs, and local businesses.
          </p>
          <a
            href="https://www.gofundme.com"
            target="_blank"
            className="text-white hover:text-yellow-500 font-bold"
          >
            Visit GoFundMe
          </a>
        </div>

        {/* Patreon Section */}
        <div className="bg-yellow-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            Patreon: Ongoing Support for Black Creators
          </h2>
          <p className="text-black mb-4">
            Patreon allows supporters to provide ongoing financial support to
            artists, writers, musicians, and other content creators. Black
            creators on Patreon are building communities of support to fund
            their creative projects and artistic endeavors.
          </p>
          <a
            href="https://www.patreon.com"
            target="_blank"
            className="text-black hover:text-yellow-500 font-bold"
          >
            Visit Patreon
          </a>
        </div>

        {/* Fundrise Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Fundrise: Invest in Black-Led Real Estate Projects
          </h2>
          <p className="text-gray-300 mb-4">
            Fundrise offers opportunities to invest in real estate projects,
            some of which are run by Black entrepreneurs. This is an excellent
            platform for those interested in real estate development and growing
            wealth through property investments.
          </p>
          <a
            href="https://www.fundrise.com"
            target="_blank"
            className="text-gold hover:text-yellow-500 font-bold"
          >
            Visit Fundrise
          </a>
        </div>

        {/* Crowd Supply Section */}
        <div className="bg-blue-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            Crowd Supply: Fund Black Tech and Hardware Innovations
          </h2>
          <p className="text-gray-300 mb-4">
            Crowd Supply is a crowdfunding platform focused on funding hardware,
            product design, and other technological innovations. Black tech
            entrepreneurs use this platform to bring their products to market,
            whether it's a new gadget or a groundbreaking piece of technology.
          </p>
          <a
            href="https://www.crowdsupply.com"
            target="_blank"
            className="text-black hover:text-yellow-500 font-bold"
          >
            Visit Crowd Supply
          </a>
        </div>

        {/* iFundWomen Section */}
        <div className="bg-yellow-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            iFundWomen: Supporting Black Female Entrepreneurs
          </h2>
          <p className="text-black mb-4">
            iFundWomen is dedicated to funding women entrepreneurs, with many
            Black female-led businesses seeking backing to build sustainable
            businesses. This platform supports everything from tech startups to
            social enterprises, offering flexible funding for ambitious women of
            color.
          </p>
          <a
            href="https://www.ifundwomen.com"
            target="_blank"
            className="text-black hover:text-yellow-500 font-bold"
          >
            Visit iFundWomen
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlackProjectsPage;
