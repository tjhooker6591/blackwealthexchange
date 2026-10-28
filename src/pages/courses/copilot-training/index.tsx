import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle2, Lock } from "lucide-react";
import CourseVideo from "@/components/courses/CourseVideo";
import { aiProductivityCourse as course } from "@/lib/courses/aiProductivity";
import { videosFor } from "@/lib/courses/aiProductivity/videos";
import {
  getDb,
  getProgress,
  resolveAiCourseAccess,
  type AccessReason,
  type CourseProgress,
} from "@/lib/courses/aiProductivity/server";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const PATH = "/courses/copilot-training";

type Props = {
  authenticated: boolean;
  hasAccess: boolean;
  reason: AccessReason;
  progress: CourseProgress | null;
};

const ACCESS_NOTE: Partial<Record<AccessReason, string>> = {
  founding_member: "Free for you: your business is claimed on BWE.",
  purchased: "You own this course.",
  admin: "Admin access.",
};

export default function AiProductivityCoursePage({
  authenticated,
  hasAccess,
  reason,
  progress,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Back from Stripe: confirm the payment, then reload so access shows.
  useEffect(() => {
    const sessionId =
      typeof router.query.session_id === "string"
        ? router.query.session_id
        : "";
    if (router.query.cancelled)
      setNotice("Checkout was cancelled. You were not charged.");
    if (!sessionId || hasAccess) return;
    setNotice("Confirming your payment…");
    fetch(
      `/api/courses/verify-session?session_id=${encodeURIComponent(sessionId)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d?.paid) window.location.replace(PATH);
        else
          setNotice(
            "We could not confirm the payment yet. Refresh in a minute, or contact us.",
          );
      })
      .catch(() =>
        setNotice("We could not confirm the payment yet. Refresh in a minute."),
      );
  }, [router.query.session_id, router.query.cancelled, hasAccess]);

  const buy = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/courses/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseSlug: course.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else
        setError(data.message || "Checkout could not start. Please try again.");
    } catch {
      setError("Checkout could not start. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const loginHref = `/login?redirect=${encodeURIComponent(PATH)}`;
  const nextLesson = progress
    ? course.lessons.find((l) => l.number === progress.nextLessonNumber) ||
      course.lessons[0]
    : course.lessons[0];
  const started = Boolean(
    progress && progress.lessons.some((l) => l.attempts > 0),
  );
  const firstTrailer = videosFor(1).trailer;

  return (
    <>
      <Head>
        <title>
          Microsoft Copilot Training for Business | Black Wealth Exchange
        </title>
        <meta name="description" content={truncateMeta(course.subtitle)} />
        <link rel="canonical" href={canonicalUrl(PATH)} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel rounded-[30px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
              <div>
                <div className="bwe-eyebrow">
                  Online training course · For business owners and teams
                </div>
                <h1 className="bwe-display-title mt-3">{course.title}</h1>
                <p className="bwe-lead mt-4 max-w-xl">
                  A step-by-step course that teaches you how to use{" "}
                  <strong className="text-white">Microsoft Copilot</strong>,
                  Microsoft&apos;s AI assistant, to get everyday business work
                  done faster: customer emails, support, meetings, proposals,
                  spreadsheets and marketing.
                </p>

                <div className="mt-5 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/[0.07] px-4 py-3">
                  <p className="text-base font-bold text-white sm:text-lg">
                    FREE for businesses that claim their listing on BWE.
                  </p>
                  <p className="mt-1 text-base font-bold text-[#E8CF7A]">
                    Everyone else: $49 one-time for the whole course, all 12
                    lessons.
                  </p>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-white/80">
                  <li>
                    <strong className="text-white">
                      12 short video lessons
                    </strong>{" "}
                    taught by Marcus, our AI instructor
                  </li>
                  <li>
                    <strong className="text-white">Hands-on practice</strong>{" "}
                    with ready-to-use prompts and templates for your business
                  </li>
                  <li>
                    <strong className="text-white">Quick quizzes</strong> after
                    each lesson, at your own pace
                  </li>
                  <li>
                    <strong className="text-white">A certificate</strong> when
                    you finish your 30-day action plan
                  </li>
                </ul>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {hasAccess ? (
                    <Link
                      href={`${PATH}/${nextLesson.slug}`}
                      className="bwe-cta-primary bwe-focus-ring px-6"
                    >
                      {progress?.completedAt
                        ? "Review the course"
                        : started
                          ? `Continue: Lesson ${nextLesson.number}`
                          : "Start Lesson 1"}
                    </Link>
                  ) : authenticated ? (
                    <button
                      type="button"
                      onClick={buy}
                      disabled={busy}
                      className="bwe-cta-primary bwe-focus-ring px-6 disabled:opacity-60"
                    >
                      {busy ? "Opening checkout…" : "Buy the full course: $49"}
                    </button>
                  ) : (
                    <Link
                      href={loginHref}
                      className="bwe-cta-primary bwe-focus-ring px-6"
                    >
                      {reason === "session_expired"
                        ? "Sign in again"
                        : "Sign in to buy the full course: $49"}
                    </Link>
                  )}
                  {!hasAccess && (
                    <Link
                      href="/founding-membership"
                      className="bwe-cta-secondary bwe-focus-ring px-6"
                    >
                      Claim your business: course included
                    </Link>
                  )}
                  {progress?.completedAt && (
                    <Link
                      href={`${PATH}/certificate`}
                      className="bwe-cta-secondary bwe-focus-ring px-6"
                    >
                      View certificate
                    </Link>
                  )}
                </div>

                {hasAccess && ACCESS_NOTE[reason] && (
                  <p className="mt-3 text-sm text-emerald-300/90">
                    {ACCESS_NOTE[reason]}
                  </p>
                )}
                {!hasAccess && (
                  <p className="mt-3 text-sm text-white/60">
                    Already claimed your business? Sign in with the same account
                    and the course unlocks automatically.
                  </p>
                )}
                {reason === "session_expired" && (
                  <p role="status" className="mt-3 text-sm text-[#E8CF7A]">
                    Your sign-in has expired. Sign in again to open the course.
                  </p>
                )}
                {reason === "check_failed" && (
                  <p role="alert" className="mt-3 text-sm text-red-300">
                    We couldn&apos;t check your course access just now. Please
                    refresh the page.
                  </p>
                )}
                {notice && (
                  <p className="mt-3 text-sm text-[#E8CF7A]">{notice}</p>
                )}
                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-300">
                    {error}
                  </p>
                )}
              </div>

              {firstTrailer ? (
                <CourseVideo
                  source={firstTrailer}
                  title="Course trailer"
                  placeholder=""
                />
              ) : (
                <figure>
                  <Image
                    src="/images/courses/marcus-copilot.jpg"
                    alt="Marcus, the course instructor"
                    width={480}
                    height={269}
                    priority
                    className="aspect-video w-full rounded-2xl object-cover"
                  />
                  <figcaption className="mt-2 text-sm text-white/65">
                    Meet Marcus, your instructor. Every lesson has a full video
                    from Marcus.
                  </figcaption>
                </figure>
              )}
            </div>
          </section>

          {progress && hasAccess && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  Your progress: {progress.passedCount} of{" "}
                  {course.lessons.length} lessons
                  {progress.capstoneSubmittedAt ? " · capstone submitted" : ""}
                </span>
                {progress.completedAt && (
                  <span className="bwe-badge" data-tone="success">
                    Course complete
                  </span>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#D4AF37]"
                  style={{
                    width: `${Math.round((progress.passedCount / course.lessons.length) * 100)}%`,
                  }}
                />
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="bwe-section-title">What you will learn</h2>
            {!hasAccess && (
              <p className="mt-2 text-sm text-white/65">
                One $49 purchase opens all 12 lessons. Free when you claim your
                business.
              </p>
            )}
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {course.lessons.map((lesson) => {
                const row = progress?.lessons.find(
                  (l) => l.lessonNumber === lesson.number,
                );
                const unlocked = hasAccess;
                const trailer = videosFor(lesson.number).trailer;
                const lessonHref = `${PATH}/${lesson.slug}`;
                const lessonLoginHref = `/login?redirect=${encodeURIComponent(lessonHref)}`;
                return (
                  <li
                    key={lesson.slug}
                    className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                        Lesson {lesson.number}
                      </div>
                      {row?.passedAt ? (
                        <CheckCircle2
                          className="h-5 w-5 text-emerald-400"
                          aria-label="Passed"
                        />
                      ) : !unlocked ? (
                        <Lock
                          className="h-4 w-4 text-white/35"
                          aria-label="Locked"
                        />
                      ) : null}
                    </div>
                    <div className="mt-1 font-semibold text-white/90">
                      {unlocked || !authenticated ? (
                        <Link
                          href={unlocked ? lessonHref : lessonLoginHref}
                          className="bwe-focus-ring hover:text-[#E8CF7A]"
                        >
                          {lesson.title}
                        </Link>
                      ) : (
                        lesson.title
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      {lesson.outcome}
                    </p>
                    {trailer && (
                      <div className="mt-3">
                        <CourseVideo
                          source={trailer}
                          title={`Lesson ${lesson.number} teaser: ${lesson.title}`}
                          placeholder=""
                        />
                      </div>
                    )}
                    {unlocked ? (
                      <Link
                        href={lessonHref}
                        className="bwe-cta-secondary bwe-focus-ring mt-4 self-start px-5"
                      >
                        {row?.passedAt ? "Review lesson" : "Open lesson"}
                      </Link>
                    ) : authenticated ? (
                      <button
                        type="button"
                        onClick={buy}
                        disabled={busy}
                        className="bwe-cta-secondary bwe-focus-ring mt-4 self-start px-5 disabled:opacity-60"
                      >
                        {busy
                          ? "Opening checkout…"
                          : "Unlock with the full course"}
                      </button>
                    ) : (
                      <Link
                        href={lessonLoginHref}
                        className="bwe-cta-secondary bwe-focus-ring mt-4 self-start px-5"
                      >
                        Sign in to open
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/45">
            Educational course. Not affiliated with or endorsed by Microsoft.
            Microsoft and Copilot are trademarks of Microsoft Corporation.
            Copilot features depend on your Microsoft plan and settings. Marcus
            is an AI-generated presenter; lessons are pre-recorded.
          </p>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  res,
}) => {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const db = await getDb();
    const access = await resolveAiCourseAccess(req, db);
    const progress =
      access.hasAccess && access.userId
        ? await getProgress(db, access.userId)
        : null;
    return {
      props: {
        authenticated: access.authenticated,
        hasAccess: access.hasAccess,
        reason: access.reason,
        progress,
      },
    };
  } catch (err) {
    console.error("ai-productivity landing error:", err);
    return {
      props: {
        authenticated: false,
        hasAccess: false,
        reason: "check_failed",
        progress: null,
      },
    };
  }
};
