"use client";

import React from "react";
import Link from "next/link";

// Define the type for each library item.
interface LibraryItem {
  id: number;
  title: string;
  summary: string;
  link: string;
  category: string;
}

// Sample library data. Replace or extend these entries as needed.
const libraryItems: LibraryItem[] = [
  {
    id: 1,
    title: "The Harlem Renaissance",
    summary:
      "Discover the intellectual, social, and artistic explosion that transformed African-American culture in the 1920s.",
    link: "https://en.wikipedia.org/wiki/Harlem_Renaissance",
    category: "History",
  },
  {
    id: 2,
    title: "Civil Rights Movement",
    summary:
      "Explore the pivotal struggles and triumphs of African Americans in the fight for justice and equality.",
    link: "https://en.wikipedia.org/wiki/Civil_rights_movement",
    category: "History",
  },
  {
    id: 3,
    title: "Black Inventors and Innovators",
    summary:
      "A treasure trove of stories detailing the groundbreaking contributions of Black inventors and innovators.",
    link: "https://en.wikipedia.org/wiki/Lists_of_African-American_inventors_and_discoverers",
    category: "Innovation",
  },
  {
    id: 4,
    title: "African Diaspora",
    summary:
      "Learn about the global influence and cultural heritage of the African diaspora.",
    link: "https://en.wikipedia.org/wiki/African_diaspora",
    category: "Culture",
  },
  {
    id: 5,
    title: "Black Music History",
    summary:
      "From blues to hip-hop, dive into the revolutionary impact of Black music on the world.",
    link: "https://en.wikipedia.org/wiki/History_of_black_music",
    category: "Art & Culture",
  },
  {
    id: 6,
    title: "Political Movements & Leaders",
    summary:
      "Examine the legacy of Black political movements and the leaders who shaped history.",
    link: "https://en.wikipedia.org/wiki/Political_history_of_African_Americans",
    category: "Politics",
  },
  {
    id: 7,
    title: "Black Literature & Thought",
    summary:
      "A collection of works and thinkers that have enriched global literature and philosophy.",
    link: "https://en.wikipedia.org/wiki/African-American_literature",
    category: "Literature",
  },
  {
    id: 8,
    title: "Modern Black Culture",
    summary:
      "Insights into contemporary trends, technology, and cultural expressions in Black communities.",
    link: "https://en.wikipedia.org/wiki/Black_culture",
    category: "Culture",
  },
  // Add more items as desired.
];

const LibraryOfBlackHistory: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide mb-4">
            Library of Black History
          </h1>
          <p className="text-xl md:text-2xl text-gray-300">
            Facts. No Fiction. An archive of knowledge and information.
          </p>
        </header>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {libraryItems.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
              <p className="mb-4 text-gray-300">{item.summary}</p>
              <p className="mb-2 text-sm text-gray-500">
                Category: {item.category}
              </p>
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
              >
                Learn More
              </Link>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default LibraryOfBlackHistory;
