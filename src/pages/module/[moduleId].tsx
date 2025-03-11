import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

const ModulePage: React.FC = () => {
  const router = useRouter();
  const { moduleId } = router.query; // Get the dynamic module ID from the URL
  const [moduleContent, setModuleContent] = useState<any>(null);

  useEffect(() => {
    if (moduleId) {
      // Get the content based on the moduleId
      const content = getModuleContent(moduleId as string);
      setModuleContent(content);
    }
  }, [moduleId]);

  // Function to get module content
  const getModuleContent = (moduleId: string) => {
    const contentMap = {
      '1': {
        title: 'Introduction to Personal Finance',
        content: `
          <h3>What is Personal Finance and Why is it Important?</h3>
          <p>Personal finance is the process of managing your money, budgeting, saving, investing, and planning for future financial goals.</p>
          <h3>Why is Personal Finance Important?</h3>
          <ul>
            <li>Financial Security: Helps you avoid unnecessary debt and build savings.</li>
            <li>Control Over Your Life: Gives you the ability to make decisions based on your values.</li>
            <li>Wealth Building: Helps you save and plan long-term for building wealth.</li>
          </ul>`,
        quiz: [
          {
            question: 'Why is personal finance important?',
            options: ['A) To avoid debt and ensure financial security', 'B) To manage income and spend on luxury items', 'C) To plan vacations'],
            answer: 'A',
          },
          {
            question: 'What is one way personal finance helps with long-term goals?',
            options: ['A) Helps you build debt', 'B) Allows you to plan for retirement and major life events', 'C) Increases spending on non-essentials'],
            answer: 'B',
          },
        ],
        downloadable: 'Personal Finance Overview PDF', // Reference to downloadable resource
      },
      '2': {
        title: 'Setting Financial Goals',
        content: `
          <h3>The Importance of Setting Both Short-Term and Long-Term Goals</h3>
          <p>Short-term goals (0-2 years) are achievable in a shorter period, while long-term goals (3+ years) require more time and effort.</p>
          <h3>Creating SMART Financial Goals</h3>
          <ul>
            <li><strong>Specific:</strong> Clearly defined goals</li>
            <li><strong>Measurable:</strong> Track your progress</li>
            <li><strong>Achievable:</strong> Realistic based on your financial situation</li>
            <li><strong>Relevant:</strong> Aligns with your financial and life objectives</li>
            <li><strong>Time-bound:</strong> Set a deadline for achieving the goal</li>
          </ul>`,
        quiz: [
          {
            question: 'What does SMART stand for?',
            options: ['A) Specific, Manageable, Actionable, Relevant, Time-bound', 'B) Specific, Measurable, Achievable, Relevant, Time-bound', 'C) Simple, Measurable, Achievable, Reasonable, Time-bound'],
            answer: 'B',
          },
        ],
        downloadable: 'Goal-Setting Template', // Reference to downloadable resource
      },
      // Define the other 6 modules in a similar way...
      '3': {
        title: 'Creating a Budget',
        content: `
          <h3>Step-by-Step Guide to Creating a Monthly Budget</h3>
          <p>Track your income, identify your fixed and variable expenses, and allocate funds to each category.</p>
          <h3>Budgeting Methods</h3>
          <ul>
            <li><strong>50/30/20 Rule:</strong> 50% needs, 30% wants, 20% savings/debt</li>
            <li><strong>Zero-Based Budgeting:</strong> Every dollar has a purpose</li>
            <li><strong>Envelope System:</strong> Cash divided into envelopes for specific categories</li>
          </ul>`,
        quiz: [
          {
            question: 'What is the main principle of the 50/30/20 Rule?',
            options: ['A) Allocate 50% to savings, 30% to needs, 20% to wants', 'B) Allocate 50% to needs, 30% to wants, 20% to savings and debt repayment', 'C) Allocate 50% to debt, 30% to savings, 20% to rent'],
            answer: 'B',
          },
        ],
        downloadable: 'Monthly Budget Template', // Reference to downloadable resource
      },
      '4': {
        title: 'Saving for the Future',
        content: `
          <h3>The Importance of Building an Emergency Fund</h3>
          <p>Save 3-6 months' worth of living expenses in a high-yield savings account to cover emergencies.</p>
          <h3>Different Types of Savings Accounts</h3>
          <ul>
            <li><strong>Traditional Savings:</strong> Low interest, easily accessible</li>
            <li><strong>High-Yield Savings:</strong> Higher interest rates, grows savings faster</li>
            <li><strong>Certificates of Deposit (CDs):</strong> Fixed-term accounts with higher interest rates</li>
          </ul>`,
        quiz: [
          {
            question: 'What is the primary purpose of an emergency fund?',
            options: ['A) To pay for luxury items', 'B) To cover unexpected expenses without going into debt', 'C) To invest in stocks'],
            answer: 'B',
          },
        ],
        downloadable: 'Emergency Fund Savings Plan', // Reference to downloadable resource
      },
      // Modules 5-8 will follow a similar structure
    };
    return contentMap[moduleId] || null;
  };

  if (!moduleContent) {
    return <p>Loading...</p>; // Show loading state until content is fetched
  }

  const handleNextModule = () => {
    const nextModuleId = parseInt(moduleId as string) + 1;
    if (nextModuleId <= 8) {
      router.push(`/module/${nextModuleId}`);
    } else {
      router.push('/conclusion'); // Redirect to the conclusion page if it's the last module
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold text-gold">{moduleContent.title}</h1>
      <div className="mt-4" dangerouslySetInnerHTML={{ __html: moduleContent.content }}></div>

      {/* Quiz Section */}
      <div className="mt-8">
        <h3 className="text-xl text-gold">Quiz</h3>
        <form>
          {moduleContent.quiz.map((q, index) => (
            <div key={index} className="mb-4">
              <label className="block text-gray-300">{q.question}</label>
              <div>
                {q.options.map((option, i) => (
                  <label key={i} className="inline-block mr-4">
                    <input type="radio" name={`question-${index}`} value={option} /> {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition mt-8">
            Submit Quiz
          </button>
        </form>
      </div>

      {/* Downloadable Resource */}
      {moduleContent.downloadable && (
        <div className="mt-8">
          <a href={`/downloads/${moduleContent.downloadable}.pdf`} className="text-blue-500 hover:underline">
            Download Resource: {moduleContent.downloadable}
          </a>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-8">
        <h3 className="text-xl text-gold">Course Progress</h3>
        <div className="bg-gray-700 rounded-full h-4">
          <div className="bg-green-500 h-4" style={{ width: `${(parseInt(moduleId as string) / 8) * 100}%` }}></div>
        </div>
        <p className="text-gray-300 mt-2">{(parseInt(moduleId as string) / 8) * 100}% completed</p>
      </div>

      {/* Next Module Button */}
      <button
        onClick={handleNextModule}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition mt-8"
      >
        {parseInt(moduleId as string) === 8 ? 'Go to Conclusion' : 'Next Module'}
      </button>
    </div>
  );
};

export default ModulePage;