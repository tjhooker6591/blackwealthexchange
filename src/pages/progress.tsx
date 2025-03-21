import React, { useEffect, useState } from "react";

interface ModuleProgress {
  id: string;
  title: string;
  completed: boolean;
  progress: number; // a value between 0 and 100
}

interface ProgressData {
  overallProgress: number; // overall percentage progress
  modules: ModuleProgress[];
}

const ProgressPage: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/progress");
        if (!res.ok) {
          throw new Error("Failed to fetch progress data");
        }
        const data: ProgressData = await res.json();
        setProgressData(data);
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading progress...
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        No progress data found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Your Progress</h1>
        <div className="mb-6">
          <p className="mb-2">
            Overall Progress: {progressData.overallProgress}%
          </p>
          <div className="w-full bg-gray-600 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${progressData.overallProgress}%` }}
            ></div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Modules</h2>
          {progressData.modules.map((module) => (
            <div key={module.id} className="mb-4">
              <h3 className="text-xl">{module.title}</h3>
              <p>{module.completed ? "Completed" : "In Progress"}</p>
              <div className="w-full bg-gray-600 rounded-full h-3 mt-1">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${module.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
