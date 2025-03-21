import type { NextApiRequest, NextApiResponse } from "next";

interface ModuleProgress {
  id: string;
  title: string;
  completed: boolean;
  progress: number; // percentage from 0 to 100
}

interface ProgressData {
  overallProgress: number;
  modules: ModuleProgress[];
}

const sampleProgress: ProgressData = {
  overallProgress: 65, // Overall progress percentage
  modules: [
    {
      id: "module1",
      title: "Introduction to Personal Finance",
      completed: true,
      progress: 100,
    },
    {
      id: "module2",
      title: "Setting Financial Goals",
      completed: true,
      progress: 100,
    },
    {
      id: "module3",
      title: "Creating a Budget",
      completed: false,
      progress: 60,
    },
    {
      id: "module4",
      title: "Saving for the Future",
      completed: false,
      progress: 40,
    },
    {
      id: "module5",
      title: "Debt Management Strategies",
      completed: false,
      progress: 20,
    },
    {
      id: "module6",
      title: "Smart Spending",
      completed: false,
      progress: 0,
    },
    {
      id: "module7",
      title: "Building Healthy Financial Habits",
      completed: false,
      progress: 0,
    },
    {
      id: "module8",
      title: "The Power of Compound Interest",
      completed: false,
      progress: 0,
    },
  ],
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgressData>,
) {
  res.status(200).json(sampleProgress);
}
