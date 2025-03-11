import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";

// Sample campaign data
const campaignsData = [
  {
    id: 1,
    imageSrc: "/images/campaign1.jpg",
    title: "Black Tech Startup",
    description:
      "Revolutionizing the digital space with cutting-edge AI solutions.",
    progress: 65,
    category: "Tech",
    location: "USA",
    fundingGoal: 100000,
  },
  {
    id: 2,
    imageSrc: "/images/campaign2.jpg",
    title: "Community-Owned Coffee Brand",
    description:
      "Bringing ethically sourced coffee to the Black community.",
    progress: 40,
    category: "Food",
    location: "USA",
    fundingGoal: 50000,
  },
  {
    id: 3,
    imageSrc: "/images/campaign3.jpg",
    title: "Black-Owned Fashion Label",
    description:
      "Elevating Black culture through sustainable streetwear.",
    progress: 80,
    category: "Fashion",
    location: "USA",
    fundingGoal: 75000,
  },
];

// Donation Modal Component
function DonationModal({ campaignTitle, onClose, onDonate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-white"
          onClick={onClose}
        >
          X
        </button>
        <h2 className="text-2xl font-bold text-gold mb-4">{campaignTitle}</h2>
        <p className="text-gray-300 mb-4">Enter donation amount:</p>
        <input
          type="number"
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
          placeholder="$ Amount"
        />
        <button
          onClick={onDonate}
          className="w-full p-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
        >
          Donate
        </button>
        {/* Social Sharing Icons */}
        <div className="mt-4 flex justify-center space-x-4">
          <FaFacebook className="text-gold hover:text-yellow-500 transition" />
          <FaTwitter className="text-gold hover:text-yellow-500 transition" />
          <FaLinkedin className="text-gold hover:text-yellow-500 transition" />
        </div>
        {/* Comments Section */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gold">Comments</h3>
          <textarea
            className="w-full p-2 rounded mt-2 bg-gray-700 text-white"
            placeholder="Add a comment..."
          ></textarea>
          <button className="mt-2 px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
            Submit Comment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Crowdfunding() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minFundingGoal, setMinFundingGoal] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);

  const openModal = (campaign) => {
    setCurrentCampaign(campaign);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCampaign(null);
  };

  const handleDonate = () => {
    // Simulate donation submission
    alert("Donation submitted!");
    closeModal();
  };

  // Filtering campaigns based on selected criteria
  const filteredCampaigns = campaignsData.filter((campaign) => {
    return (
      (selectedCategory ? campaign.category === selectedCategory : true) &&
      (selectedLocation ? campaign.location === selectedLocation : true) &&
      (minFundingGoal ? campaign.fundingGoal >= parseInt(minFundingGoal) : true)
    );
  });

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <header
        className="relative bg-gray-800 bg-cover bg-center p-20 text-center"
        style={{ backgroundImage: "url('/images/crowdfunding-bg.jpg')" }}
      >
        {/* Home Button in Hero */}
        <div className="absolute top-4 left-4">
          <Link href="/">
            <button className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
              Home
            </button>
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gold">Crowdfunding</h1>
        <p className="text-lg md:text-xl mt-2 text-gray-300">
          Support Black entrepreneurs. Invest in the future. Fund innovation.
        </p>
      </header>

      <div className="container mx-auto p-6">
        {/* Filtering Section */}
        <div className="bg-gray-800 p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold text-gold mb-4">Filter Campaigns</h2>
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white"
            >
              <option value="">All Categories</option>
              <option value="Tech">Tech</option>
              <option value="Food">Food</option>
              <option value="Fashion">Fashion</option>
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white"
            >
              <option value="">All Locations</option>
              <option value="USA">USA</option>
              <option value="Global">Global</option>
            </select>
            <input
              type="number"
              value={minFundingGoal}
              onChange={(e) => setMinFundingGoal(e.target.value)}
              placeholder="Min Funding Goal"
              className="p-2 rounded bg-gray-700 text-white"
            />
          </div>
        </div>

        {/* Featured Campaigns Section */}
        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Featured Campaigns</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="campaign-card bg-gray-700 p-4 rounded-lg shadow-md border border-gray-700 transform transition hover:scale-105"
              >
                <div className="w-full h-40 relative mb-4">
                  <Image
                    src={campaign.imageSrc}
                    alt={campaign.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gold">{campaign.title}</h3>
                <p className="mt-2 text-gray-300">{campaign.description}</p>
                {/* Donation Progress Bar */}
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-600 rounded-full">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${campaign.progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">{campaign.progress}% Funded</p>
                </div>
                <button
                  onClick={() => openModal(campaign)}
                  className="mt-4 p-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
                >
                  Invest Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Call-to-Action for Creating a Campaign */}
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Start Your Campaign</h2>
          <p className="mt-2 text-gray-300">
            Have a vision? Launch your crowdfunding campaign today and connect with supporters worldwide.
          </p>
          <Link href="/create-campaign">
            <button className="mt-4 p-4 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
              Create Campaign
            </button>
          </Link>
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

      {/* Donation Modal */}
      {modalOpen && currentCampaign && (
        <DonationModal
          campaignTitle={currentCampaign.title}
          onClose={closeModal}
          onDonate={handleDonate}
        />
      )}
    </div>
  );
}