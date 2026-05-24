import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const COURSE_DATA = {
  slug: "personal-finance-101",
  name: "Personal Finance 101: Mastering Budgeting, Saving, and Money Management",
  price: 29,
  modules: [
    "Breaking Financial Myths",
    "Budgeting for Real Life",
    "Credit Repair & Power",
    "Building Wealth with Investments",
    "Side Hustles & Business Basics",
    "Debt Management & Elimination",
    "Retirement Planning",
    "Building Legacy & Asset Protection",
  ],
};

type AccessState = {
  loading: boolean;
  isLoggedIn: boolean;
  hasAccess: boolean;
  reason: string;
  statusMessage: string;
  nextAction: string;
};

const CourseEnrollmentPage: React.FC = () => {
  const [state, setState] = useState<AccessState>({
    loading: true,
    isLoggedIn: false,
    hasAccess: false,
    reason: "",
    statusMessage: "",
    nextAction: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const router = useRouter();

  async function loadAccessState() {
    try {
      const meRes = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      if (!meRes.ok) {
        setState({
          loading: false,
          isLoggedIn: false,
          hasAccess: false,
          reason: "login_required",
          statusMessage: "Access is locked because you are not logged in.",
          nextAction: "Log in or create an account to continue enrollment.",
        });
        return;
      }

      const accessRes = await fetch("/api/courses/access", {
        cache: "no-store",
        credentials: "include",
      });
      const accessData = await accessRes.json().catch(() => ({}));
      const hasAccess = Boolean(accessData?.hasAccess);
      const reason = String(accessData?.reason || "");

      const reasonMessageMap: Record<string, string> = {
        premium_active: "Access active through your premium plan.",
        user_purchased_courses:
          "Access active from your purchased course entitlement.",
        enrollment_granted: "Access active from your enrollment grant.",
        no_entitlement:
          "Access is locked because your premium entitlement is not active yet.",
        user_not_found:
          "Access is locked because your account record could not be found.",
      };

      setState({
        loading: false,
        isLoggedIn: true,
        hasAccess,
        reason,
        statusMessage: hasAccess
          ? reasonMessageMap[reason] ||
            "Access active. Enter your premium course modules."
          : reasonMessageMap[reason] ||
            "Access is locked until premium enrollment is completed.",
        nextAction: hasAccess
          ? "Enter course modules and begin your next lesson."
          : "Complete checkout to activate entitlement and unlock modules.",
      });
    } catch {
      setState({
        loading: false,
        isLoggedIn: false,
        hasAccess: false,
        reason: "access_check_failed",
        statusMessage: "We could not verify course access right now.",
        nextAction: "Retry, then log in and continue enrollment.",
      });
    }
  }

  useEffect(() => {
    (async () => {
      const sessionId =
        typeof router.query.session_id === "string"
          ? router.query.session_id
          : "";

      if (sessionId) {
        await fetch(
          `/api/courses/verify-session?session_id=${encodeURIComponent(sessionId)}`,
          {
            credentials: "include",
          },
        ).catch(() => null);

        router.replace("/course-enrollment", undefined, { shallow: true });
      }

      await loadAccessState();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.session_id]);

  const handlePurchase = async () => {
    setCheckoutError("");
    setIsProcessing(true);
    try {
      const response = await fetch("/api/courses/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseSlug: COURSE_DATA.slug }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Unable to start checkout session.");
      }
    } catch {
      setCheckoutError("Something went wrong with checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (state.loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">{COURSE_DATA.name}</h1>
          <p className="mt-2 text-gray-300">
            One-time fee: ${COURSE_DATA.price}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Reason: {state.statusMessage}
          </p>
          <p className="mt-1 text-sm text-gray-300">
            Next action: {state.nextAction}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Locked state explains why access is blocked. Unlocked state sends
            you directly to course modules.
          </p>
        </header>

        <section className="mt-6 rounded-lg border border-gray-700 p-4 bg-gray-900/60">
          {!state.isLoggedIn ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition text-center"
              >
                Sign Up to Enroll
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent("/course-enrollment")}`}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition text-center"
              >
                Log In to Continue
              </Link>
            </div>
          ) : state.hasAccess ? (
            <div className="space-y-3">
              <p className="text-green-300">Premium access verified.</p>
              <Link
                href="/premium-finance"
                className="inline-block bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
              >
                Enter Course Modules
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="bg-gold text-black py-2 px-6 rounded font-bold hover:bg-yellow-500 transition disabled:opacity-60"
              >
                {isProcessing
                  ? "Redirecting to Payment..."
                  : `Buy & Enroll for $${COURSE_DATA.price}`}
              </button>
              <p className="text-xs text-gray-400">
                You will be granted access after successful checkout
                verification.
              </p>
            </div>
          )}

          {checkoutError ? (
            <p className="mt-3 text-sm text-red-300">{checkoutError}</p>
          ) : null}
        </section>

        <section className="mt-6 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <h2 className="text-lg font-semibold text-gold">What you unlock</h2>
          <p className="mt-1 text-sm text-gray-300">
            8-module premium path with practical action steps and progression.
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-gray-300 sm:grid-cols-2">
            {COURSE_DATA.modules.map((moduleTitle, index) => (
              <li key={moduleTitle} className="rounded bg-black/30 px-2 py-1">
                {index + 1}. {moduleTitle}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-400">
            State reason code: {state.reason || "n/a"}. Next action:{" "}
            {state.hasAccess
              ? "enter modules and begin Module 1"
              : state.isLoggedIn
                ? "complete enrollment to unlock modules"
                : "log in or sign up to start enrollment"}
            .
          </p>
        </section>

        <footer className="mt-8 text-sm text-gray-300">
          <Link
            href="/financial-literacy"
            className="text-gold hover:underline"
          >
            Back to Financial Literacy Overview
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default CourseEnrollmentPage;
