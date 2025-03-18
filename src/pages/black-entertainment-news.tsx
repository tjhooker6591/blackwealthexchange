import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";

// Define a type for a news article
interface NewsArticle {
  id: number;
  imageSrc: string;
  title: string;
  description: string;
  category: string;
  location: string;
  impact: string;
}

// Sample news data with impactful stories
const newsData: NewsArticle[] = [
  {
    id: 1,
    imageSrc: "/images/story1.jpg",
    title: "Celebrating Black Innovators: Revolutionizing the Tech World",
    description:
      "Highlighting the Black leaders who are shaping the future of technology and paving the way for future generations.",
    category: "Tech",
    location: "USA",
    impact: "Major",
  },
  {
    id: 2,
    imageSrc: "/images/story2.jpg",
    title: "Black-Owned Businesses Changing the Face of Coffee Culture",
    description:
      "From seed to cup: The Black entrepreneurs making an impact in the coffee industry with community-based businesses.",
    category: "Food",
    location: "USA",
    impact: "Major",
  },
  {
    id: 3,
    imageSrc: "/images/story3.jpg",
    title: "The Power of Fashion: Black Creators Pushing Boundaries",
    description:
      "How Black designers are blending culture, innovation, and sustainability to leave a lasting impact on the fashion industry.",
    category: "Fashion",
    location: "Global",
    impact: "Small",
  },
];

// Tribute Section Data (in memory of Black figures we've lost)
const tributesData = [
  {
    id: 1,
    imageSrc: "/images/tribute1.jpg",
    name: "Chadwick Boseman",
    description:
      "Honoring the legacy of the late Chadwick Boseman, an icon who brought pride and dignity to Black characters in Hollywood.",
    legacy:
      "Pioneered roles for Black superheroes and redefined cultural pride.",
  },
  {
    id: 2,
    imageSrc: "/images/tribute2.jpg",
    name: "Maya Angelou",
    description:
      "Remembering Maya Angelou, whose words and wisdom continue to inspire generations across the world.",
    legacy:
      "Her poetry and activism still resonate deeply in the fight for justice and equality.",
  },
  {
    id: 3,
    imageSrc: "/images/tribute3.jpg",
    name: "Angie Stone",
    description:
      "Remembering Angie Stone, an unforgettable voice in the world of R&B and soul music who deeply influenced the sound of Black music.",
    legacy:
      "Her soulful voice and timeless hits brought love, joy, and empowerment to the Black community.",
  },
];

// Modal for reading news (if needed)
function NewsModal({
  articleTitle,
  onClose,
}: {
  articleTitle: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-white" onClick={onClose}>
          X
        </button>
        <h2 className="text-2xl font-bold text-gold mb-4">{articleTitle}</h2>
        <p className="text-gray-300 mb-4">Full article content goes here...</p>
        <div className="mt-4 flex justify-center space-x-4">
          <FaFacebook className="text-gold hover:text-yellow-500 transition" />
          <FaTwitter className="text-gold hover:text-yellow-500 transition" />
          <FaLinkedin className="text-gold hover:text-yellow-500 transition" />
        </div>
      </div>
    </div>
  );
}

export default function BlackImpactNews() {
  // Retain filtering state as before; no setters are needed since they remain unchanged
  const [selectedCategory] = useState("");
  const [selectedLocation] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  // Replace any with the NewsArticle type
  const [currentArticle, setCurrentArticle] = useState<NewsArticle | null>(
    null
  );

  const openModal = (article: NewsArticle): void => {
    setCurrentArticle(article);
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setCurrentArticle(null);
  };

  // Filtering articles based on selected criteria
  const filteredArticles = newsData.filter((article) => {
    return (
      (selectedCategory ? article.category === selectedCategory : true) &&
      (selectedLocation ? article.location === selectedLocation : true)
    );
  });

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section with Banner Image and Headline */}
      <section
        className="relative bg-gray-800 bg-cover bg-center p-20 text-center"
        style={{ backgroundImage: "url(/images/banner-image.jpg)" }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gold leading-tight">
            Empowering Black Voices, Celebrating Global Impact
          </h1>
          <p className="text-lg md:text-xl mt-4 text-gray-300">
            Stay informed, inspired, and connected to the impactful stories and
            contributions of Black communities around the world.
          </p>
        </div>
      </section>

      {/* Featured Stories Section */}
      <div className="container mx-auto p-6">
        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">
            Featured Stories: Celebrating Our Impact
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="story-card bg-gray-700 p-4 rounded-lg shadow-md border border-gray-700 transform transition hover:scale-105"
              >
                <div className="w-full h-40 relative mb-4">
                  <Image
                    src={article.imageSrc}
                    alt={article.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gold">
                  {article.title}
                </h3>
                <p className="mt-2 text-gray-300">{article.description}</p>
                <div className="mt-4">
                  <button
                    onClick={() => openModal(article)}
                    className="p-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
                  >
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tributes Section: Honoring the Legacy */}
        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">
            In Memory: Honoring Our Legends
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {tributesData.map((tribute) => (
              <div
                key={tribute.id}
                className="tribute-card bg-gray-700 p-4 rounded-lg shadow-md border border-gray-700"
              >
                <div className="w-full h-40 relative mb-4">
                  <Image
                    src={tribute.imageSrc}
                    alt={tribute.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gold">
                  {tribute.name}
                </h3>
                <p className="mt-2 text-gray-300">{tribute.description}</p>
                <p className="mt-4 text-sm text-gray-500">
                  Legacy: {tribute.legacy}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Other Black News Outlets Section */}
        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">
            Other Black News Outlets
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="news-outlet-card bg-gray-700 p-4 rounded-lg shadow-md">
              <Image
                src="/images/good-black-news-logo.jpg"
                alt="Good Black News"
                width={100}
                height={100}
                className="rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold text-gold">
                Good Black News
              </h3>
              <p className="text-gray-300">
                Stay updated with uplifting and empowering news stories that
                celebrate the achievements of Black communities globally.
              </p>
              <Link href="https://goodblacknews.org" passHref>
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
                  Visit Good Black News
                </button>
              </Link>
            </div>
            {/* Add more outlets here as needed */}
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="text-center mt-10">
          <Link href="/">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>

      {/* News Modal */}
      {modalOpen && currentArticle && (
        <NewsModal
          articleTitle={currentArticle.title}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
