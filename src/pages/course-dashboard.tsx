import React, { useState, useEffect } from "react";
import { useRouter } from "next/router"; // Import useRouter hook
import Link from "next/link";

const CourseDashboard: React.FC = () => {
  const [completedModules, setCompletedModules] = useState<any>([]);
  const router = useRouter(); // Instantiate useRouter hook

  // Simulating modules' completion (can later be replaced with backend logic or localStorage)
  useEffect(() => {
    const savedModules = JSON.parse(localStorage.getItem("completedModules") || "[]");
    setCompletedModules(savedModules);
  }, []);

  // Function to handle navigating to a module's content page
  const handleModuleClick = (moduleId: string) => {
    router.push(`/module/${moduleId}`); // Dynamically navigate to the correct module page
  };

  // Calculate progress (percentage of completed modules)
  const progress = (completedModules.length / 8) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Course Dashboard Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">Personal Finance 101 Dashboard</h1>
          <p className="text-gray-300 mt-2">Welcome to your course. Let's get started!</p>
        </header>

        {/* Progress Bar */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Progress</h2>
          <div className="mt-4">
            <div className="bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-gray-300">{Math.round(progress)}% Complete</p>
          </div>
        </section>

        {/* Course Content Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Content Overview</h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((moduleId) => (
              <li key={moduleId} className="flex justify-between items-center mt-4">
                <span className="text-lg">{getModuleTitle(moduleId)}</span>

                <button
                  onClick={() => handleModuleClick(moduleId)}
                  className={`py-2 px-4 rounded ${
                    completedModules.includes(moduleId)
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white"
                  } hover:bg-opacity-90 transition`}
                >
                  {completedModules.includes(moduleId) ? "Continue" : "Start"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Additional Resources or Call to Action */}
        <section className="mt-8">
          <p className="text-gray-300">
            Complete all modules to unlock additional resources and achieve financial mastery!
          </p>
          <Link href="/certificates">
            <button className="mt-4 py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">
              View Your Certificate
            </button>
          </Link>
        </section>

        {/* Back Button */}
        <section className="mt-8 text-center">
          <button
            onClick={() => router.push('/course-enrollment')}
            className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Course Introduction
          </button>
        </section>
      </div>
    </div>
  );
};

// Helper function to get the module title based on moduleId
const getModuleTitle = (moduleId: string) => {
  const titles = {
    "1": "Introduction to Personal Finance",
    "2": "Setting Financial Goals",
    "3": "Creating a Budget",
    "4": "Saving for the Future",
    "5": "Debt Management Strategies",
    "6": "Smart Spending and Avoiding Pitfalls",
    "7": "Building Healthy Financial Habits",
    "8": "The Power of Compound Interest",
  };

  return titles[moduleId] || "Unknown Module";
};

export default CourseDashboard;