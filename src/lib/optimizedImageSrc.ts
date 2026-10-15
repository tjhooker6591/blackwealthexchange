// Returns a URL that serves a site-hosted image resized to roughly the size it
// is displayed at, through Next's image optimizer. Full-size originals shown
// as small thumbnails (a 2000x2000 avatar at 36px, 3 MB sponsor art in a
// 144px card) cost phones a lot of graphics memory, which on some Android
// devices shows up as corrupted, striped rendering. Remote URLs are returned
// unchanged.
const WIDTHS = [64, 96, 128, 256, 384, 640, 750, 828, 1080] as const;

export function optimizedImageSrc(
  src: string | null | undefined,
  displayWidth: number,
): string {
  const value = String(src || "");
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/_next/")
  ) {
    return value;
  }
  // Twice the display width for sharp images on high-density screens.
  const wanted = Math.max(1, Math.round(displayWidth * 2));
  const width = WIDTHS.find((w) => w >= wanted) ?? WIDTHS[WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(value)}&w=${width}&q=75`;
}
