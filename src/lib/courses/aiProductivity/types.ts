export type QuizQuestion = {
  question: string;
  choices: string[];
  /** Index into `choices`. */
  answer: number;
  /** Shown after the learner answers. */
  why: string;
};

export type AiLesson = {
  number: number;
  slug: string;
  title: string;
  /** One sentence: what the learner can do after this lesson. */
  outcome: string;
  /** Short trailer clip shown publicly (the original 35–42 s Marcus intros). */
  trailerTitle: string;
  /** Plain-language reading, one string per paragraph. */
  reading: string[];
  /** A worked example the learner can follow, step by step. */
  walkthrough: { title: string; steps: string[]; samplePrompt?: string };
  /** What the learner does on their own. */
  assignment: { instructions: string[]; deliverable: string };
  reflection: string[];
  quiz: QuizQuestion[];
};

export type AiCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  priceCents: number;
  passPercent: number;
  lessons: AiLesson[];
};
