import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { videosFor } from "@/lib/courses/aiProductivity/videos";

const COURSE_PATH = "/courses/copilot-training";

/**
 * Home page feature for Microsoft Copilot Training for Business. Shows
 * Marcus's photo with a play button; the Lesson 1 teaser plays right in the
 * box, with its controls below the picture so they are easy to read. With no
 * hosted teaser, the photo links to the course.
 */
export default function CopilotCourseHomeBanner() {
  const teaser = videosFor(1).trailer;
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (started && teaser?.kind === "file")
      videoRef.current?.play().catch(() => {});
  }, [started, teaser?.kind]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const seek = (value: number) => {
    const v = videoRef.current;
    if (v && length) v.currentTime = (value / 100) * length;
  };
  const clock = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  const photo = (
    <Image
      src="/images/courses/marcus-copilot.jpg"
      alt="Marcus, the course instructor"
      width={480}
      height={269}
      className="aspect-video w-full rounded-2xl object-cover"
    />
  );

  return (
    <section className="mb-6 flex flex-col gap-4 overflow-hidden rounded-[24px] border-2 border-[#D4AF37]/60 bg-[#D4AF37]/[0.07] p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
      <div className="w-full shrink-0 sm:w-80 lg:w-96">
        {teaser && started && teaser.kind === "file" ? (
          <div>
            <video
              ref={videoRef}
              className="aspect-video w-full rounded-2xl bg-black"
              src={teaser.src}
              playsInline
              muted={muted}
              onClick={toggle}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
              aria-label="Course preview with Marcus"
            />
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/50 px-2 py-1.5 text-white">
              <button
                type="button"
                onClick={toggle}
                className="bwe-focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-black"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={length ? (time / length) * 100 : 0}
                onChange={(e) => seek(Number(e.target.value))}
                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#D4AF37]"
                aria-label="Video progress"
              />
              <span className="shrink-0 text-xs font-semibold tabular-nums text-white/90">
                {clock(time)} / {clock(length)}
              </span>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="bwe-focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : teaser && started ? (
          <iframe
            className="aspect-video w-full rounded-2xl bg-black"
            src={`${teaser.src}?autoplay=1&rel=0`}
            title="Course preview with Marcus"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : teaser ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="bwe-focus-ring group relative block w-full"
            aria-label="Play the course preview with Marcus"
          >
            {photo}
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/25 transition group-hover:bg-black/10">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-lg transition group-hover:scale-105">
                <Play className="ml-1 h-8 w-8" fill="currentColor" />
              </span>
            </span>
            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
              Watch the preview
            </span>
          </button>
        ) : (
          <Link href={COURSE_PATH} className="bwe-focus-ring block">
            {photo}
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
