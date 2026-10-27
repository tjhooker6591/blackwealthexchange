import Image from "next/image";
import Link from "next/link";
import CourseVideo from "@/components/courses/CourseVideo";
import { videosFor } from "@/lib/courses/aiProductivity/videos";

const COURSE_PATH = "/courses/copilot-training";

/**
 * Home page feature for Microsoft Copilot Training for Business. Plays the
 * Lesson 1 teaser in place when one is hosted; otherwise shows Marcus's photo.
 */
export default function CopilotCourseHomeBanner() {
  const teaser = videosFor(1).trailer;

  return (
    <section className="mb-6 flex flex-col gap-4 overflow-hidden rounded-[24px] border-2 border-[#D4AF37]/60 bg-[#D4AF37]/[0.07] p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
      <div className="w-full shrink-0 sm:w-72">
        {teaser ? (
          <CourseVideo
            source={teaser}
            title="Microsoft Copilot Training for Business: preview with Marcus"
            placeholder=""
          />
        ) : (
          <Link href={COURSE_PATH} className="bwe-focus-ring block">
            <Image
              src="/images/courses/marcus-copilot.jpg"
              alt="Marcus, the course instructor"
              width={480}
              height={269}
              className="aspect-video w-full rounded-2xl object-cover"
            />
          </Link>
        )}
      </div>
      <div className="min-w-0 flex-1 px-1 pb-1 sm:p-0">
        <div className="bwe-eyebrow">New · Business training course</div>
        <Link
          href={COURSE_PATH}
          className="bwe-focus-ring mt-1 block text-lg font-bold text-white hover:text-[#E8CF7A] sm:text-xl"
        >
          Microsoft Copilot Training for Business
        </Link>
        <p className="mt-1 text-sm text-white/75">
          Learn to use Microsoft&apos;s AI assistant for emails, customer
          support, meetings, proposals and marketing. 12 short video lessons
          taught by Marcus.
        </p>
        <p className="mt-2 text-sm font-bold text-[#E8CF7A]">
          FREE when you claim your business · $49 for everyone else
        </p>
      </div>
      <Link
        href={COURSE_PATH}
        className="bwe-cta-primary bwe-focus-ring mx-1 mb-1 shrink-0 px-5 sm:m-0"
      >
        See the course
      </Link>
    </section>
  );
}
