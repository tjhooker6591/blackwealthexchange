import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { resolvePremiumCourseAccess } from "@/lib/entitlements/courseAccess";

type AccessState = {
  loading: boolean;
  allowed: boolean;
  message: string;
};

const CourseDashboard: React.FC = () => {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [access, setAccess] = useState<AccessState>({
    loading: true,
    allowed: false,
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    const savedModules = JSON.parse(
      localStorage.getItem("completedModules") || "[]",
    );
    setCompletedModules(savedModules);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses/access", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!data?.authenticated) {
          router.replace(
            `/login?next=${encodeURIComponent("/course-dashboard")}`,
          );
          return;
        }

        if (!data?.hasAccess) {
          setAccess({
            loading: false,
            allowed: false,
            message:
              "Premium course access is not active yet. Complete enrollment to continue.",
          });
          return;
        }

        setAccess({ loading: false, allowed: true, message: "" });
      } catch {
        setAccess({
          loading: false,
          allowed: false,
          message: "Unable to verify premium course access right now.",
        });
      }
    })();
  }, [router]);

  const handleModuleClick = (moduleId: string) => {
    router.push(`/premium-finance/module-${moduleId}`);
  };

  const progress = (completedModules.length / 8) * 100;

  if (access.loading) return <div className="p-8 text-white">Loading...</div>;

  if (!access.allowed) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
          <h1 className="text-2xl font-bold text-yellow-200">Course Locked</h1>
          <p className="mt-2 text-white/80">{access.message}</p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/financial-literacy"
              className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black"
            >
              Upgrade to Premium
            </Link>
            <Link
              href="/course-enrollment"
              className="rounded-lg border border-white/20 px-4 py-2"
            >
              Enrollment Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">
            Personal Finance 101 Dashboard
          </h1>
          <p className="text-gray-300 mt-2">
            Welcome to your premium course. Start any module below.
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Progress
          </h2>
          <div className="mt-4">
            <div className="bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-gray-300">
              {Math.round(progress)}% Complete
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Modules</h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((moduleId) => (
              <li
                key={moduleId}
                className="flex justify-between items-center mt-4"
              >
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

        <section className="mt-8 text-center">
          <Link
            href="/course-enrollment"
            className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition inline-block"
          >
            Back to Enrollment
          </Link>
        </section>
      </div>
    </div>
  );
};

const getModuleTitle = (moduleId: string) => {
  const titles: Record<string, string> = {
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const access = await resolvePremiumCourseAccess(ctx.req as any);

  if (!access.authenticated) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl || "/course-dashboard")}`,
        permanent: false,
      },
    };
  }

  if (!access.hasAccess) {
    return {
      redirect: {
        destination: "/financial-literacy?locked=course-dashboard",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
