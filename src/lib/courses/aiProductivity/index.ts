import type { AiCourse, AiLesson } from "./types";
import { lessons1to4 } from "./lessons1to4";
import { lessons5to8 } from "./lessons5to8";
import { lessons9to12 } from "./lessons9to12";

export type { AiCourse, AiLesson, QuizQuestion } from "./types";

export const AI_COURSE_ID = "ai-productivity-business";

export const aiProductivityCourse: AiCourse = {
  id: AI_COURSE_ID,
  slug: AI_COURSE_ID,
  title: "AI Productivity for Business",
  subtitle:
    "Use Microsoft Copilot to save time on email, support, meetings, documents, reports and marketing, safely.",
  priceCents: 4900,
  passPercent: 75,
  lessons: [...lessons1to4, ...lessons5to8, ...lessons9to12],
};

export const CAPSTONE_RUBRIC = [
  "Problem and current baseline",
  "Quality of prompts and fact constraints",
  "Privacy and review controls",
  "Workflow steps and responsible owner",
  "Pilot success criteria and stop conditions",
] as const;

export function getLesson(slug: string): AiLesson | undefined {
  return aiProductivityCourse.lessons.find((l) => l.slug === slug);
}

export function getLessonByNumber(n: number): AiLesson | undefined {
  return aiProductivityCourse.lessons.find((l) => l.number === n);
}

/**
 * Display order for a question's choices. The content keeps the right answer
 * wherever it was written; this spreads it across positions, the same way on
 * every page load, so "always pick B" doesn't work.
 */
export function choiceOrder(
  lessonNumber: number,
  questionIndex: number,
  count: number,
) {
  let seed = (lessonNumber * 7919 + questionIndex * 104729) % 2147483647 || 1;
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    seed = (seed * 48271) % 2147483647;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order; // order[displayIndex] = original choice index
}

/** Lesson quiz without answers, in display order, safe to send to the browser. */
export function publicQuiz(lesson: AiLesson) {
  return lesson.quiz.map((q, qi) => ({
    question: q.question,
    choices: choiceOrder(lesson.number, qi, q.choices.length).map(
      (i) => q.choices[i],
    ),
  }));
}

/**
 * Server-side grading. `answers` are display positions from publicQuiz.
 * Returns score 0–100 and, per question, the correct display position.
 */
export function gradeQuiz(lesson: AiLesson, answers: unknown) {
  const list = Array.isArray(answers) ? answers : [];
  const results = lesson.quiz.map((q, qi) => {
    const order = choiceOrder(lesson.number, qi, q.choices.length);
    const picked = Number.isInteger(list[qi])
      ? order[Number(list[qi])]
      : undefined;
    return {
      correct: picked === q.answer,
      answer: order.indexOf(q.answer),
      why: q.why,
    };
  });
  const correct = results.filter((r) => r.correct).length;
  const score = Math.round((correct / lesson.quiz.length) * 100);
  return {
    score,
    passed: score >= aiProductivityCourse.passPercent,
    results,
  };
}

/** The ten parts of the capstone plan, each a required answer. */
export const CAPSTONE_FIELDS = [
  { key: "goal", label: "Business goal" },
  { key: "owner", label: "Who owns the plan" },
  { key: "information", label: "Information you are allowed to use" },
  { key: "prompts", label: "Your three prompts" },
  { key: "workflow", label: "Step-by-step workflow" },
  { key: "privacy", label: "Privacy rules" },
  { key: "review", label: "Review checkpoint (who approves what)" },
  { key: "measures", label: "Quality and time-saved goals" },
  { key: "stop", label: "Stop conditions" },
  { key: "limitation", label: "One honest limitation of AI in your business" },
] as const;

export const CAPSTONE_MIN_CHARS = 20;
export const CAPSTONE_MAX_CHARS = 4000;

export function validateCapstone(body: unknown) {
  const input = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const answers: Record<string, string> = {};
  const missing: string[] = [];
  for (const f of CAPSTONE_FIELDS) {
    const v = String(input[f.key] ?? "")
      .trim()
      .slice(0, CAPSTONE_MAX_CHARS);
    answers[f.key] = v;
    if (v.length < CAPSTONE_MIN_CHARS) missing.push(f.label);
  }
  return { answers, missing };
}
