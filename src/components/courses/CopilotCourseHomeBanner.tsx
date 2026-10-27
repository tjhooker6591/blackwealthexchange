import Image from "next/image";
import Link from "next/link";

/** Home page feature for Microsoft Copilot Training for Business. */
export default function CopilotCourseHomeBanner() {
  return (
    <Link
      href="/courses/copilot-training"
      className="bwe-focus-ring mb-6 flex flex-col gap-4 overflow-hidden rounded-[24px] border-2 border-[#D4AF37]/60 bg-[#D4AF37]/[0.07] p-3 transition hover:border-[#D4AF37] sm:flex-row sm:items-center sm:gap-5 sm:p-4"
    >
      <Image
        src="/images/courses/marcus-copilot.jpg"
        alt="Marcus, the course instructor"
        width={480}
        height={269}
        className="aspect-video w-full rounded-2xl object-cover sm:w-56"
      />
      <div className="min-w-0 flex-1 px-1 pb-1 sm:p-0">
        <div className="bwe-eyebrow">New · Business training course</div>
        <div className="mt-1 text-lg font-bold text-white sm:text-xl">
          Microsoft Copilot Training for Business
        </div>
        <p className="mt-1 text-sm text-white/75">
          Learn to use Microsoft&apos;s AI assistant for emails, customer
          support, meetings, proposals and marketing. 12 short video lessons
          taught by Marcus.
        </p>
        <p className="mt-2 text-sm font-bold text-[#E8CF7A]">
          FREE when you claim your business · $49 for everyone else
        </p>
      </div>
      <span className="bwe-cta-primary mx-1 mb-1 shrink-0 px-5 sm:m-0">
        See the course
      </span>
    </Link>
  );
}
