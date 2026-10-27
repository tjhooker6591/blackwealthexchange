import { PlayCircle } from "lucide-react";
import type { VideoSource } from "@/lib/courses/aiProductivity/videos";

type Props = {
  source: VideoSource | null;
  title: string;
  /** Shown when the video is not hosted yet. */
  placeholder: string;
};

export default function CourseVideo({ source, title, placeholder }: Props) {
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
