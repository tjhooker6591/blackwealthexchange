/**
 * Marcus videos per lesson. Fill these in as videos are hosted:
 * - trailer: the short public intro (YouTube video ID, an https URL to an mp4,
 *   or a /videos/... mp4 served by this site)
 * - lesson: the full-length teaching video, shown only to learners with access
 * A null value shows a placeholder instead of a player.
 */
export type LessonVideos = { trailer: string | null; lesson: string | null };

export const LESSON_VIDEOS: Record<number, LessonVideos> = {
  1: {
    trailer: "/videos/copilot-training/trailer-01.mp4",
    lesson: "https://youtu.be/4FnqKVkGpc8",
  },
  2: {
    trailer: "/videos/copilot-training/trailer-02.mp4",
    lesson: "https://youtu.be/FCqwjglW8MQ",
  },
  3: {
    trailer: "/videos/copilot-training/trailer-03.mp4",
    lesson: "https://youtu.be/xq5LZ-JE0gY",
  },
  4: {
    trailer: "/videos/copilot-training/trailer-04.mp4",
    lesson: "https://youtu.be/eRLqxGOFUSE",
  },
  5: {
    trailer: "/videos/copilot-training/trailer-05.mp4",
    lesson: "https://youtu.be/4Xx2m1Qzyi4",
  },
  6: {
    trailer: "/videos/copilot-training/trailer-06.mp4",
    lesson: "https://youtu.be/Fw62sWsQTnI",
  },
  7: {
    trailer: "/videos/copilot-training/trailer-07.mp4",
    lesson: "https://youtu.be/x4qzw9UXzGU",
  },
  8: {
    trailer: "/videos/copilot-training/trailer-08.mp4",
    lesson: "https://youtu.be/rUCm9iVVaHk",
  },
  9: {
    trailer: "/videos/copilot-training/trailer-09.mp4",
    lesson: "https://youtu.be/LTotlqIqYP8",
  },
  10: {
    trailer: "/videos/copilot-training/trailer-10.mp4",
    lesson: "https://youtu.be/QNa-VNbhEHY",
  },
  11: {
    trailer: "/videos/copilot-training/trailer-11.mp4",
    lesson: "https://youtu.be/32gyVBynY5w",
  },
  12: {
    trailer: "/videos/copilot-training/trailer-12.mp4",
    lesson: "https://youtu.be/rxZ0llfyV8Y",
  },
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
  // A file served by this site, e.g. /videos/copilot-training/trailer-01.mp4
  if (/^\/videos\/[\w/-]+\.mp4$/.test(v)) return { kind: "file", src: v };
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
const LOCAL_LESSON_FILES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
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
