import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";

// Type for articles
interface NewsArticle {
  id: number;
  imageSrc: string;
  title: string;
  description: string;
  category: string;
  location: string;
  impact: string;
  quote?: string;
  videoUrl?: string;
}

// Sample news data
const newsData: NewsArticle[] = [
  { id: 1, imageSrc: "/images/story1.jpg", title: "Celebrating Black Innovators: Revolutionizing the Tech World", description: "Highlighting the Black leaders shaping the future of tech.", category: "Tech", location: "USA", impact: "Major", quote: "“Innovation is the lifeblood of our communities.”", videoUrl: "https://www.youtube.com/embed/_XDI0nIZA68?si=Np40jOm3201-0lI4" },
  { id: 2, imageSrc: "/images/story2.jpg", title: "Black-Owned Businesses Changing the Face of Coffee Culture", description: "From seed to cup: community-based coffee entrepreneurs.", category: "Food", location: "USA", impact: "Major" },
  { id: 3, imageSrc: "/images/story3.jpg", title: "The Power of Fashion: Black Creators Pushing Boundaries", description: "Designers blending culture, innovation, and sustainability.", category: "Fashion", location: "Global", impact: "Small" },
];

// Type for tributes
interface Tribute {
  id: number;
  imageSrc: string;
  name: string;
  description: string;
  legacy: string;
}

// Sample tributes data
const tributesData: Tribute[] = [
  { id: 1, imageSrc: "/images/tribute1.jpg", name: "Chadwick Boseman", description: "Honoring the legacy of the late Chadwick Boseman, an icon who brought pride and dignity to Black characters in Hollywood.", legacy: "Pioneered roles for Black superheroes and redefined cultural pride." },
  { id: 2, imageSrc: "/images/tribute2.jpg", name: "Maya Angelou", description: "Remembering Maya Angelou, whose words and wisdom continue to inspire generations across the world.", legacy: "Her poetry and activism still resonate deeply in the fight for justice and equality." },
  { id: 3, imageSrc: "/images/tribute3.jpg", name: "Angie Stone", description: "Remembering Angie Stone, an unforgettable voice in the world of R&B and soul music who deeply influenced the sound of Black music.", legacy: "Her soulful voice and timeless hits brought love, joy, and empowerment to the Black community." },
];

export default function BlackImpactNews() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<NewsArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Auto-rotate hero slides every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(si => (si + 1) % newsData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = ["All", "Tech", "Food", "Fashion"];
  const filteredArticles = newsData.filter(a => selectedCategory === "All" || a.category === selectedCategory);
  const top3 = [...newsData].sort((a, b) => b.impact.localeCompare(a.impact)).slice(0, 3);

  const openModal = (article: NewsArticle) => { setCurrentArticle(article); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setCurrentArticle(null); };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 w-full overflow-hidden">
        {newsData.map((slide, idx) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: idx === currentSlide ? 1 : 0 }}
            animate={{ opacity: idx === currentSlide ? 1 : 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* Use Next/Image for proper sizing */}
            <Image
              src={slide.imageSrc}
              alt={slide.title}
              layout="fill"
              objectFit="cover"
            />
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="absolute bottom-8 left-8 max-w-lg">
              <h2 className="text-3xl font-bold text-gold">{slide.title}</h2>
              <p className="mt-2 text-gray-200">{slide.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto p-6">
        {/* Trending */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="my-8">
          <h3 className="text-xl font-semibold text-gold mb-2">🔥 Trending Now</h3>
          <ul className="space-y-2">
            {top3.map((a, i) => (
              <li key={a.id} className="flex items-center">
                <span className="font-bold mr-2">{i + 1}.</span>
                <button onClick={() => openModal(a)} className="hover:underline text-gray-200">{a.title}</button>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Categories & Featured */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex space-x-4 mb-6">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full ${selectedCategory === cat ? 'bg-gold text-black' : 'bg-gray-700 text-gray-200'}`}>{cat}</button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <motion.div key={article.id} whileHover={{ scale: 1.05 }} className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="relative w-full h-40 mb-4">
                  <Image src={article.imageSrc} alt={article.title} layout="fill" objectFit="cover" className="rounded-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gold">{article.title}</h3>
                <p className="mt-2 text-gray-300">{article.description}</p>
                {article.quote && <blockquote className="mt-4 italic text-gray-400">{article.quote}</blockquote>}
                {article.videoUrl && <div className="mt-4"><iframe src={article.videoUrl} title="video" className="w-full h-48 rounded" allowFullScreen /></div>}
                <button onClick={() => openModal(article)} className="mt-4 p-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">Read More</button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tributes */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="mt-16">
          <div className="border-t-2 border-gold mb-6 w-24" />
          <h2 className="text-2xl font-bold text-gold mb-6">In Memory: Honoring Our Legends</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tributesData.map(t => (
              <motion.div key={t.id} whileHover={{ scale: 1.03 }} className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="relative w-full h-40 mb-4">
                  <Image src={t.imageSrc} alt={t.name} layout="fill" objectFit="cover" className="rounded-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gold">{t.name}</h3>
                <p className="mt-2 text-gray-300">{t.description}</p>
                <p className="mt-4 text-sm text-gray-500">Legacy: {t.legacy}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Back */}
        <div className="text-center mt-16">
          <Link href="/"> <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">Back to Home</button> </Link>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && currentArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} className="bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-white" onClick={closeModal}>X</button>
            <h2 className="text-2xl font-bold text-gold mb-4">{currentArticle.title}</h2>
            <p className="text-gray-300 mb-4">Full article content goes here...</p>
            <div className="mt-4 flex justify-center space-x-4">
              <FaFacebook className="text-gold hover:text-yellow-500 transition" />
              <FaTwitter className="text-gold hover:text-yellow-500 transition" />
              <FaLinkedin className="text-gold hover:text-yellow-500 transition" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

