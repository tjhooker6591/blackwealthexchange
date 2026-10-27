/**
 * Marcus videos per lesson. Fill these in as videos are hosted:
 * - trailer: the short public intro (YouTube video ID, or a full https URL to an mp4)
 * - lesson: the full-length teaching video, shown only to learners with access
 * A null value shows a placeholder instead of a player.
 */
export type LessonVideos = { trailer: string | null; lesson: string | null };

export const LESSON_VIDEOS: Record<number, LessonVideos> = {
  1: { trailer: null, lesson: null },
  2: { trailer: null, lesson: null },
  3: { trailer: null, lesson: null },
  4: { trailer: null, lesson: null },
  5: { trailer: null, lesson: null },
  6: { trailer: null, lesson: null },
  7: { trailer: null, lesson: null },
  8: { trailer: null, lesson: null },
  9: { trailer: null, lesson: null },
  10: { trailer: null, lesson: null },
  11: { trailer: null, lesson: null },
  12: { trailer: null, lesson: null },
};

export type VideoSource =
  | { kind: "youtube"; src: string }
  | { kind: "file"; src: string };

export function toVideoSource(
  value: string | null | undefined,
): VideoSource | null {
  const v = String(value || "").trim();
  if (!v) return null;
  if (/^https:\/\//i.test(v) && !/youtu\.?be/i.test(v))
    return { kind: "file", src: v };
  const id = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] || v;
  if (!/^[\w-]{11}$/.test(id)) return null;
  return {
    kind: "youtube",
    src: `https://www.youtube-nocookie.com/embed/${id}`,
  };
}

/**
 * Local preview only: in `next dev`, a lesson with no hosted trailer plays
 * public/course-media/copilot-training/trailer-NN.mp4 if that file exists on
 * this computer (the folder is gitignored). Never used in production.
 */
function localPreviewTrailer(lessonNumber: number): VideoSource | null {
  if (process.env.NODE_ENV !== "development") return null;
  const nn = String(lessonNumber).padStart(2, "0");
  return {
    kind: "file",
    src: `/course-media/copilot-training/trailer-${nn}.mp4`,
  };
}

/** Local preview only: full lesson videos downloaded to this computer. */
const LOCAL_LESSON_FILES = new Set([1, 2, 3, 4, 5, 7, 8, 9]);
function localPreviewLesson(lessonNumber: number): VideoSource | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (!LOCAL_LESSON_FILES.has(lessonNumber)) return null;
  const nn = String(lessonNumber).padStart(2, "0");
  return {
    kind: "file",
    src: `/course-media/copilot-training/lesson-${nn}.mp4`,
  };
}

export function videosFor(lessonNumber: number) {
  const v = LESSON_VIDEOS[lessonNumber] || { trailer: null, lesson: null };
  return {
    trailer: toVideoSource(v.trailer) || localPreviewTrailer(lessonNumber),
    lesson: toVideoSource(v.lesson) || localPreviewLesson(lessonNumber),
  };
}
