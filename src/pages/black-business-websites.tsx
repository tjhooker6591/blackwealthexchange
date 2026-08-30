import React from "react";
import Link from "next/link";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const blackOwnedBusinessDirectories = [
  {
    name: "Official Black Wall Street",
    url: "https://officialblackwallstreet.com/",
    description:
      "A platform dedicated to promoting Black-owned businesses across the country, offering a directory, reviews, and a map of Black-owned businesses.",
    categories: "General, Retail, Services",
  },
  {
    name: "Buy From A Black Woman",
    url: "https://www.buyfromablackwoman.org/",
    description:
      "A nonprofit organization supporting Black women entrepreneurs by providing resources, a directory, and promoting awareness of their businesses.",
    categories: "Retail, Beauty, Services, Nonprofits",
  },
  {
    name: "Support Black Owned",
    url: "https://supportblackowned.com/",
    description:
      "A comprehensive business directory for Black-owned businesses in the U.S. and internationally. The platform helps consumers find and support Black entrepreneurs.",
    categories: "General, Retail, Food, Tech, Services, Education",
  },
  {
    name: "Black Business Owners (BBO)",
    url: "https://blackbusinessowners.com/",
    description:
      "A directory of Black-owned businesses around the world, providing easy navigation to help consumers support Black entrepreneurs.",
    categories: "General, Retail, Services, Professional",
  },
  {
    name: "The Black-Owned Market",
    url: "https://www.theblackownedmarket.com/",
    description:
      "A marketplace where consumers can discover Black-owned brands and businesses, featuring everything from fashion to home goods.",
    categories: "Retail, Fashion, Beauty, Art, Home Goods",
  },
  {
    name: "Black Owned Brooklyn",
    url: "https://blackownedbrooklyn.com/",
    description:
      "A local directory focused on promoting Black-owned businesses in Brooklyn, New York. The platform includes a list of shops, restaurants, and services in the area.",
    categories: "Local (Brooklyn), Food, Retail, Services",
  },
  {
    name: "Black Owned Everything",
    url: "https://www.blackownedeverything.com/",
    description:
      "A platform that lists and promotes Black-owned businesses across the U.S. They have a marketplace and directory for various business categories.",
    categories: "General, Retail, Fashion, Beauty, Food, Services",
  },
  {
    name: "Black Owned Chicago",
    url: "https://blackownedchicago.com/",
    description:
      "A directory of Black-owned businesses in Chicago. This platform highlights local entrepreneurs, with categories like restaurants, fashion, and beauty.",
    categories: "Local (Chicago), Food, Retail, Services",
  },
  {
    name: "Shoppe Black",
    url: "https://www.shoppeblack.us/",
    description:
      "A marketplace and directory for Black-owned businesses. They offer a wide range of products and services while highlighting the importance of supporting Black economic growth.",
    categories: "Retail, Beauty, Food, Art, Fashion, Lifestyle",
  },
  {
    name: "Black Business Initiative",
    url: "https://www.blackbusinessinitiative.com/",
    description:
      "Focused on Black entrepreneurship in Canada, the Black Business Initiative connects business owners with resources and an online marketplace.",
    categories: "Business Services, Retail, Professional Services",
  },
  {
    name: "The Black List",
    url: "https://www.theblacklist.com/",
    description:
      "An online directory that lists Black-owned businesses across the globe. The platform helps connect consumers with entrepreneurs in various industries.",
    categories: "General, Retail, Fashion, Tech, Education",
  },
  {
    name: "We Buy Black",
    url: "https://webuyblack.com/",
    description:
      "A marketplace dedicated to Black-owned businesses, with an emphasis on supporting entrepreneurs through e-commerce. They sell everything from clothing to health products.",
    categories: "Retail, Health, Fashion, Beauty, Services",
  },
  {
    name: "Black-Owned Businesses Network (BOB Network)",
    url: "https://www.bobnetwork.org/",
    description:
      "A network for Black business owners, offering a directory, networking events, and resources for entrepreneurs.",
    categories: "General, Networking, Professional Services",
  },
  {
    name: "Black Tech Week",
    url: "https://blacktechweek.com/",
    description:
      "Focused on the intersection of technology and Black entrepreneurship, Black Tech Week highlights startups, conferences, and networking opportunities.",
    categories: "Tech, Startups, Networking",
  },
  {
    name: "AfroTech",
    url: "https://www.afrotech.com/",
    description:
      "A platform for Black professionals in technology and entrepreneurship. AfroTech hosts events and conferences for networking, talent acquisition, and business development.",
    categories: "Tech, Networking, Startups",
  },
  {
    name: "Black Business Hub",
    url: "https://www.blackbusinesshub.com/",
    description:
      "A platform dedicated to supporting Black entrepreneurs by offering a directory and resources for business growth, including funding and mentorship.",
    categories: "Business Services, Resources, Networking",
  },
  {
    name: "Black Entrepreneur Blueprint",
    url: "https://www.blackentrepreneurblueprint.com/",
    description:
      "A platform offering business advice, resources, and interviews with successful Black entrepreneurs. It also features a directory for Black business owners.",
    categories: "Business Services, Entrepreneurship, Consulting",
  },
];

export default function BlackOwnedDirectories() {
  const title =
    "External Black-Owned Business Directory Resources | Black Wealth Exchange";
  const description = truncateMeta(
    "Black Wealth Exchange is a Black-Owned Business Discovery and Growth Platform. Review curated external directory resources, marketplaces, and discovery hubs that highlight Black-owned businesses.",
  );
  const canonical = canonicalUrl("/black-business-websites");
  const socialImage = canonicalUrl("/images/hero1.jpg");

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={socialImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={socialImage} />
      </Head>
      <div className="bg-gray-900 text-white min-h-screen">
        <header className="hero bg-gray-800 p-20 text-center shadow-md">
          <h1 className="text-4xl font-bold text-gold">
            Black-Owned Business Directory Resources
          </h1>
          <p className="text-lg mt-2 text-gray-300">
            Black Wealth Exchange is a Black-Owned Business Discovery and Growth
            Platform. This page highlights external directories, marketplaces,
            and resource hubs that can help you discover more Black-owned
            businesses.
          </p>
          <div className="mt-4">
            <Link href="/">
              <button className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition">
                Back to Home
              </button>
            </Link>
          </div>
        </header>

        <div className="container mx-auto p-6">
          <div className="mt-6 space-y-6">
            {blackOwnedBusinessDirectories.map((directory, index) => (
              <div
                key={index}
                className="bg-gray-800 p-4 rounded shadow-md border border-gray-700"
              >
                <h2 className="text-xl font-semibold text-gold">
                  {directory.name}
                </h2>
                <p className="text-gray-300 mt-2">{directory.description}</p>
                <p className="mt-2 text-gray-400">
                  <strong>Categories:</strong> {directory.categories}
                </p>
                <Link href={directory.url}>
                  <button className="mt-4 p-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
                    Visit Website
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
