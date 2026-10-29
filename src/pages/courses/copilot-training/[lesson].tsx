import { useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import CourseVideo from "@/components/courses/CourseVideo";
import {
  aiProductivityCourse as course,
  CAPSTONE_FIELDS,
  CAPSTONE_MIN_CHARS,
  CAPSTONE_RUBRIC,
  getLesson,
  publicQuiz,
  type AiLesson,
} from "@/lib/courses/aiProductivity";
import {
  videosFor,
  type VideoSource,
} from "@/lib/courses/aiProductivity/videos";
import {
  getDb,
  getProgress,
  resolveAiCourseAccess,
  type CourseProgress,
} from "@/lib/courses/aiProductivity/server";
import {
  claimCourseDevice,
  signedLessonVideo,
  STREAM_LESSONS,
} from "@/lib/courses/aiProductivity/stream";

const PATH = "/courses/copilot-training";

type LessonView = Omit<AiLesson, "quiz">;

type Props = {
  lesson: LessonView;
  quiz: { question: string; choices: string[] }[];
  video: VideoSource | null;
  /** True when only Marcus's short intro exists for this lesson. */
  videoIsIntro: boolean;
  /** Viewer's name, shown faintly over the private lesson video. */
  watermark: string | null;
  /** The course is playing on another of this account's devices. */
  otherDevice: boolean;
  /** The private video link could not be issued just now. */
  videoFailed: boolean;
  progress: CourseProgress;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  isLast: boolean;
};

type QuizResult = {
  score: number;
  passed: boolean;
  results: { correct: boolean; answer: number; why: string }[];
};

export default function LessonPage({
  lesson,
  quiz,
  video,
  videoIsIntro,
  watermark,
  otherDevice,
  videoFailed,
  progress: initial,
  prev,
  next,
  isLast,
}: Props) {
  const [progress, setProgress] = useState(initial);
  const [answers, setAnswers] = useState<number[]>(() => quiz.map(() => -1));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const row = progress.lessons.find((l) => l.lessonNumber === lesson.number);
  const passed = Boolean(row?.passedAt);

  const submitQuiz = async () => {
    setError("");
    if (answers.some((a) => a < 0)) {
      setError("Answer every question first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses/ai-productivity/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lesson: lesson.slug, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(
          data.code === "LOGIN_REQUIRED"
            ? "Your session ended. Sign in again to save your answers."
            : "We could not save your answers. Please try again.",
        );
        return;
      }
      setResult({
        score: data.score,
        passed: data.passed,
        results: data.results,
      });
      setProgress(data.progress);
    } catch {
      setError("We could not save your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers(quiz.map(() => -1));
  };

  return (
    <>
      <Head>
        <title>{`Lesson ${lesson.number}: ${lesson.title} | Copilot Training for Business`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="bwe-section-wrap py-6 sm:py-8">
          <nav className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link
              href={PATH}
              className="bwe-open-link bwe-focus-ring text-white/75"
            >
              <ArrowLeft className="h-4 w-4" /> All lessons
            </Link>
            <span className="text-white/50">
              Lesson {lesson.number} of {course.lessons.length} ·{" "}
              {progress.passedCount} passed
            </span>
          </nav>

          <header className="mt-4">
            <div className="bwe-eyebrow">Lesson {lesson.number}</div>
            <h1 className="bwe-section-title mt-2">{lesson.title}</h1>
            <p className="bwe-lead mt-3 max-w-3xl">{lesson.outcome}</p>
          </header>

          <div className="mt-6 max-w-4xl">
            {otherDevice ? (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center">
                <p className="max-w-md text-sm text-white/75">
                  <strong className="text-white">
                    This course is open on another device.
                  </strong>{" "}
                  Your course access works on one device at a time.
                </p>
                <a
                  href={`${PATH}/${lesson.slug}?device=this`}
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Watch on this device
                </a>
              </div>
            ) : (
              <CourseVideo
                source={video}
                title={`Marcus: ${lesson.title}`}
                placeholder={
                  videoFailed
                    ? "We couldn't load this video just now. Refresh the page to try again. The reading and walkthrough below cover everything in the lesson."
                    : "Marcus's video for this lesson is coming soon. The reading and walkthrough below cover everything in the lesson."
                }
                watermark={watermark}
              />
            )}
            {videoIsIntro && (
              <p className="mt-2 text-sm text-white/65">
                <strong className="text-white">
                  Lesson introduction from Marcus.
                </strong>{" "}
                The full video lesson is coming soon. The reading and
                walkthrough below cover everything in the lesson.
              </p>
            )}
          </div>

          <article className="mt-8 grid max-w-4xl gap-8">
            <section>
              <h2 className="bwe-card-title">The lesson</h2>
              <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-white/80">
                {lesson.reading.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="bwe-card-title">
                Walkthrough: {lesson.walkthrough.title}
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-white/80">
                {lesson.walkthrough.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {lesson.walkthrough.samplePrompt && (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                    Prompt to try
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-[#D4AF37]/25 bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-[#F3E3A6]">
                    {lesson.walkthrough.samplePrompt}
                  </pre>
                  <CopyButton text={lesson.walkthrough.samplePrompt} />
                </div>
              )}
            </section>

            <section>
              <h2 className="bwe-card-title">Your assignment</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-white/80">
                {lesson.assignment.instructions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-white/65">
                <span className="font-semibold text-white/85">
                  Deliverable:
                </span>{" "}
                {lesson.assignment.deliverable}
              </p>
            </section>

            <section>
              <h2 className="bwe-card-title">Think it through</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-white/75">
                {lesson.reflection.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="bwe-card-title">Check your understanding</h2>
                {passed && (
                  <span className="bwe-badge" data-tone="success">
                    Passed · best {row?.bestScore}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/55">
                Score {course.passPercent}% or higher to pass this lesson. You
                can retry as often as you like. Pass all 12 and submit your
                30-day plan to earn your certificate.
              </p>

              <div className="mt-4 space-y-5">
                {quiz.map((q, qi) => {
                  const r = result?.results[qi];
                  return (
                    <fieldset key={qi} className="space-y-2">
                      <legend className="font-semibold text-white/90">
                        {qi + 1}. {q.question}
                      </legend>
                      {q.choices.map((choice, ci) => {
                        const picked = answers[qi] === ci;
                        const tone = r
                          ? ci === r.answer
                            ? "border-emerald-400/60 bg-emerald-400/10"
                            : picked
                              ? "border-red-400/60 bg-red-400/10"
                              : "border-white/10"
                          : picked
                            ? "border-[#D4AF37]/70 bg-[#D4AF37]/10"
                            : "border-white/10 hover:border-white/25";
                        return (
                          <label
                            key={ci}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-[15px] ${tone}`}
                          >
                            <input
                              type="radio"
                              name={`q${qi}`}
                              className="mt-1"
                              checked={picked}
                              disabled={Boolean(result)}
                              onChange={() =>
                                setAnswers((prev) =>
                                  prev.map((a, i) => (i === qi ? ci : a)),
                                )
                              }
                            />
                            <span>{choice}</span>
                          </label>
                        );
                      })}
                      {r && (
                        <p
                          className={`flex items-start gap-2 text-sm ${r.correct ? "text-emerald-300" : "text-red-300"}`}
                        >
                          {r.correct ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          <span>{r.why}</span>
                        </p>
                      )}
                    </fieldset>
                  );
                })}
              </div>

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!result ? (
                  <button
                    type="button"
                    onClick={submitQuiz}
                    disabled={submitting}
                    className="bwe-cta-primary bwe-focus-ring px-6 disabled:opacity-60"
                  >
                    {submitting ? "Checking…" : "Check my answers"}
                  </button>
                ) : (
                  <>
                    <span
                      className={`font-semibold ${result.passed ? "text-emerald-300" : "text-[#E8CF7A]"}`}
                    >
                      You scored {result.score}%.{" "}
                      {result.passed
                        ? "Lesson passed."
                        : "Review the lesson and try again."}
                    </span>
                    <button
                      type="button"
                      onClick={retry}
                      className="bwe-cta-secondary bwe-focus-ring px-5"
                    >
                      Try again
                    </button>
                  </>
                )}
              </div>
            </section>

            {isLast && <Capstone progress={progress} onSaved={setProgress} />}
          </article>

          <nav className="mt-10 flex max-w-4xl flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
            {prev ? (
              <Link
                href={`${PATH}/${prev.slug}`}
                className="bwe-cta-secondary bwe-focus-ring px-5"
              >
                <ArrowLeft className="h-4 w-4" /> Lesson {lesson.number - 1}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`${PATH}/${next.slug}`}
                className="bwe-cta-primary bwe-focus-ring px-5"
              >
                Next: {next.title} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {isLast && progress.completedAt && (
              <Link
                href={`${PATH}/certificate`}
                className="bwe-cta-primary bwe-focus-ring px-5"
              >
                View your certificate <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>
      </main>
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="bwe-focus-ring mt-2 text-sm text-[#E8CF7A] underline-offset-4 hover:underline"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {});
      }}
    >
      {copied ? "Copied" : "Copy prompt"}
    </button>
  );
}

function Capstone({
  progress,
  onSaved,
}: {
  progress: CourseProgress;
  onSaved: (p: CourseProgress) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitted = Boolean(progress.capstoneSubmittedAt);
  const allPassed = progress.passedCount === course.lessons.length;

  const submit = async () => {
    setError("");
    const short = CAPSTONE_FIELDS.filter(
      (f) => String(values[f.key] || "").trim().length < CAPSTONE_MIN_CHARS,
    );
    if (short.length) {
      setError(
        `Add a little more to: ${short.map((f) => f.label).join(", ")}.`,
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/courses/ai-productivity/capstone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(
          data.missing?.length
            ? `Add a little more to: ${data.missing.join(", ")}.`
            : "We could not save your plan. Please try again.",
        );
        return;
      }
      onSaved(data.progress);
    } catch {
      setError("We could not save your plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="capstone"
      className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.04] p-5"
    >
      <h2 className="bwe-card-title">Capstone: submit your 30-day plan</h2>
      {submitted ? (
        <p className="mt-3 text-[15px] text-emerald-300">
          Your plan was submitted.{" "}
          {allPassed
            ? "You have completed the course."
            : "Pass every lesson check to complete the course."}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-white/65">
            Answer each part in a few sentences. Your plan is reviewed against
            these points: {CAPSTONE_RUBRIC.join("; ")}.
          </p>
          <div className="mt-4 space-y-4">
            {CAPSTONE_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="text-sm font-semibold text-white/85">
                  {f.label}
                </span>
                <textarea
                  className="bwe-textarea mt-1 w-full"
                  rows={3}
                  maxLength={4000}
                  value={values[f.key] || ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="bwe-cta-primary bwe-focus-ring mt-4 px-6 disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit my plan"}
          </button>
        </>
      )}
    </section>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  res,
  params,
  query,
}) => {
  res.setHeader("Cache-Control", "private, no-store");
  const lesson = getLesson(String(params?.lesson || ""));
  if (!lesson) return { notFound: true };

  const db = await getDb();
  const access = await resolveAiCourseAccess(req, db);
  if (!access.authenticated) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(`${PATH}/${lesson.slug}`)}`,
        permanent: false,
      },
    };
  }
  if (!access.hasAccess || !access.userId) {
    return { redirect: { destination: PATH, permanent: false } };
  }

  const progress = await getProgress(db, access.userId);

  const { quiz: _answers, ...view } = lesson;
  const idx = course.lessons.indexOf(lesson);
  const lessonVideos = videosFor(lesson.number);
  const mayPlay = await claimCourseDevice(
    db,
    access.userId,
    req,
    res,
    query.device === "this",
  );
  const privateVideo = mayPlay ? await signedLessonVideo(lesson.number) : null;
  // A private video exists but its link could not be issued: say so rather
  // than showing the short intro as if the lesson had no video.
  const videoFailed =
    mayPlay && !privateVideo && Boolean(STREAM_LESSONS[lesson.number]);
  const prev = course.lessons[idx - 1];
  const next = course.lessons[idx + 1];
  return {
    props: {
      lesson: view,
      quiz: publicQuiz(lesson),
      video:
        mayPlay && !videoFailed
          ? privateVideo || lessonVideos.lesson || lessonVideos.trailer
          : null,
      videoIsIntro:
        !videoFailed &&
        !privateVideo &&
        !lessonVideos.lesson &&
        Boolean(lessonVideos.trailer),
      videoFailed,
      // The student's own name (email if the account has no name).
      watermark: privateVideo ? access.name || access.email : null,
      otherDevice: !mayPlay,
      progress,
      prev: prev ? { slug: prev.slug, title: prev.title } : null,
      next: next ? { slug: next.slug, title: next.title } : null,
      isLast: !next,
    },
  };
};
