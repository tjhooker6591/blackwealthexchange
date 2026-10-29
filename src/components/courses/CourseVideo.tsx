import { PlayCircle } from "lucide-react";
import type { VideoSource } from "@/lib/courses/aiProductivity/videos";

type Props = {
  source: VideoSource | null;
  title: string;
  /** Shown when the video is not hosted yet. */
  placeholder: string;
  /** Shown faintly over a private lesson video (the viewer's name). */
  watermark?: string | null;
};

export default function CourseVideo({
  source,
  title,
  placeholder,
  watermark,
}: Props) {
  if (!source) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center">
        <PlayCircle className="h-10 w-10 text-[#D4AF37]/70" aria-hidden />
        <p className="max-w-md text-sm text-white/65">{placeholder}</p>
      </div>
    );
  }

  if (source.kind === "file") {
    return (
      <video
        className="aspect-video w-full rounded-2xl bg-black"
        // Start the preview a second in: some videos open on a black frame.
        src={source.src.includes("#") ? source.src : `${source.src}#t=1`}
        controls
        preload="metadata"
        playsInline
        aria-label={title}
      />
    );
  }

  if (source.kind === "stream") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={source.src}
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
        {watermark && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-3 select-none text-[11px] font-medium text-white/35 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
          >
            {watermark}
          </span>
        )}
      </div>
    );
  }

  return (
    <iframe
      className="aspect-video w-full rounded-2xl bg-black"
      src={source.src}
      title={title}
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      loading="lazy"
    />
  );
}
