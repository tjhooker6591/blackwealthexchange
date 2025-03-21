import React from "react";
import Link from "next/link";

// Define an interface for each resource
interface Resource {
  id: number;
  title: string;
  description: string;
  url: string;
  category: string;
}

// Sample resource data
const resources: Resource[] = [
  {
    id: 1,
    title: "Article on Investing",
    description: "Learn the basics of investing in stocks and bonds.",
    url: "https://example.com/investing",
    category: "Article",
  },
  {
    id: 2,
    title: "Budgeting Tool",
    description: "A free tool to help you manage your monthly budget.",
    url: "https://example.com/budget-tool",
    category: "Tool",
  },
  {
    id: 3,
    title: "Financial Literacy Guide",
    description: "An extensive guide to understanding personal finance.",
    url: "https://example.com/financial-literacy",
    category: "Guide",
  },
  // Add additional resources as needed.
];

const ResourcesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Resources</h1>
        <p className="mb-6 text-lg">
          Explore our curated collection of articles, links, tools, and guides to enhance your financial knowledge.
        </p>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.id} className="p-4 bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold">{resource.title}</h2>
              <p className="mt-2">{resource.description}</p>
              <p className="mt-1 text-sm text-gray-400">Category: {resource.category}</p>
              <Link href={resource.url} passHref>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-gold hover:underline"
                >
                  Visit Resource
                </a>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
