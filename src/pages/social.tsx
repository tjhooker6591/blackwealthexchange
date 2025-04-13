import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HomeIcon, UserIcon, BellIcon } from "@heroicons/react/24/solid";
import Image from "next/legacy/image"; // Make sure to import Image

interface Post {
  id: number;
  user: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
}

const trendingTopics: string[] = [
  "#BuyBlack",
  "#InnovationHub",
  "#BlackExcellence",
  "#CryptoTalk",
  "#TechStartups",
  "#CommunityGrowth",
];

const posts: Post[] = [
  {
    id: 1,
    user: "Angela Davis",
    avatar: "/avatars/angela-davis.jpg",
    content:
      "Excited to join the BWES community! Let's build wealth together. 💪🏾",
    likes: 256,
    comments: 87,
    shares: 43,
  },
  {
    id: 2,
    user: "Marcus Garvey",
    avatar: "/avatars/marcus-garvey.jpg",
    content:
      "Just launched my new tech startup! Looking for beta testers. Who's in? 🚀",
    likes: 189,
    comments: 56,
    shares: 28,
  },
  {
    id: 3,
    user: "Maya Angelou",
    avatar: "/avatars/maya-angelou.jpg",
    content:
      "New poetry book dropping next month. All proceeds go to Black education initiatives. 📚",
    likes: 312,
    comments: 94,
    shares: 67,
  },
  {
    id: 4,
    user: "Malcolm X",
    avatar: "/avatars/malcolm-x.jpg",
    content:
      "Hosting a webinar on financial literacy this weekend. Don't miss out! 💰",
    likes: 278,
    comments: 103,
    shares: 89,
  },
  {
    id: 5,
    user: "Ida B. Wells",
    avatar: "/avatars/ida-b-wells.jpg",
    content:
      "Just published an investigative report on Black-owned businesses in tech. Check it out! 🖥️",
    likes: 201,
    comments: 72,
    shares: 55,
  },
];

const Social: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"feed" | "trending">("feed");
  const [postContent, setPostContent] = useState<string>("");

  const handlePost = () => {
    // Logic to handle new post
    console.log("New post:", postContent);
    setPostContent("");
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Navigation */}
      <nav className="bg-gray-800 p-4 fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <span className="text-2xl font-bold text-yellow-400">BWES</span>
          </Link>
          <div className="flex space-x-4">
            <Link href="/">
              <HomeIcon className="h-6 w-6 text-yellow-400" />
            </Link>
            <BellIcon className="h-6 w-6 text-yellow-400 cursor-pointer" />
            <UserIcon className="h-6 w-6 text-yellow-400 cursor-pointer" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto pt-20 px-4">
        <h1 className="text-4xl font-bold text-center text-yellow-400 mb-8">
          BWES Social
        </h1>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-700">
            <button
              className={`py-2 px-4 ${activeTab === "feed" ? "border-b-2 border-yellow-400 text-yellow-400" : "text-gray-400"}`}
              onClick={() => setActiveTab("feed")}
            >
              Feed
            </button>
            <button
              className={`py-2 px-4 ${activeTab === "trending" ? "border-b-2 border-yellow-400 text-yellow-400" : "text-gray-400"}`}
              onClick={() => setActiveTab("trending")}
            >
              Trending
            </button>
          </div>

          {activeTab === "feed" && (
            <div>
              {/* New Post Input */}
              <div className="bg-gray-800 p-4 rounded-lg mb-6 mt-4">
                <textarea
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setPostContent(e.target.value)
                  }
                  className="w-full bg-gray-700 text-white rounded-lg p-2 mb-2"
                  rows={3}
                />
                <button
                  onClick={handlePost}
                  className="w-full bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-500 transition duration-200"
                >
                  Post
                </button>
              </div>

              {/* Posts */}
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="bg-gray-800 p-4 rounded-lg mb-4 shadow-lg"
                  >
                    <div className="flex items-center mb-2">
                      <Image
                        src={post.avatar || "/placeholder.svg"}
                        alt={post.user}
                        className="w-10 h-10 rounded-full mr-2"
                        width={40} // Define width
                        height={40} // Define height
                      />

                      <span className="font-semibold">{post.user}</span>
                    </div>
                    <p className="text-gray-300 mb-4">{post.content}</p>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.comments}</span>
                      <span>🔁 {post.shares}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "trending" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {trendingTopics.map((topic) => (
                <motion.div
                  key={topic}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800 p-4 rounded-lg text-center cursor-pointer"
                >
                  <span className="text-yellow-400 font-semibold">{topic}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 p-4 text-center mt-8">
        <p className="text-gray-400">
          &copy; 2025 Black Wealth Exchange Social. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Social;
