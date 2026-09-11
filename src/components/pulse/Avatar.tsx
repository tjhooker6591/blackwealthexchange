// Shared small avatar for BWE Pulse (feed items, comments). Extracted out
// of src/pages/pulse.tsx (2026-09-11) so CommentThread can render outside
// the Pulse page too.

export function Avatar({
  name,
  url,
  small = false,
}: {
  name: string;
  url: string | null;
  small?: boolean;
}) {
  // Tailwind's JIT scanner needs literal class strings, not interpolated
  // ones -- `h-${size}` would never actually get generated, so this
  // branches between two fully-literal class strings instead.
  const sizeClass = small ? "h-6 w-6" : "h-9 w-9";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
