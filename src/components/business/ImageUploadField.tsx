import { useRef, useState } from "react";

// Matches MAX_UPLOAD_BYTES in api/business/media (Vercel's request limit).
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const TOO_LARGE = "That image is too large. Use one under 4MB.";
const WRONG_TYPE =
  "That file type isn't supported. Use a JPG, PNG or WebP image (iPhone HEIC photos and SVG logos won't work).";

export default function ImageUploadField({
  businessId,
  slot,
  label,
  currentUrl,
  onUploaded,
}: {
  businessId: string;
  slot: "logo" | "cover";
  label: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(TOO_LARGE);
      return;
    }
    if (file.type && !/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      setError(WRONG_TYPE);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("businessId", businessId);
      form.append("slot", slot);
      form.append("file", file);
      const res = await fetch("/api/business/media", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.url) {
        throw new Error(
          json?.error === "file_too_large" || res.status === 413
            ? TOO_LARGE
            : json?.error === "unsupported_media_type"
              ? WRONG_TYPE
              : json?.error === "ownership_verification_required"
                ? "Ownership isn't verified for this business yet."
                : "Upload failed. Please try again.",
        );
      }
      onUploaded(json.url);
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block font-semibold text-gray-200">{label}</label>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className="h-16 w-16 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 text-center text-[10px] text-white/40">
            No image
          </div>
        )}
        <div className="min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            disabled={uploading || !businessId}
            className="block text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black hover:file:bg-yellow-400 disabled:opacity-50"
          />
          {uploading ? (
            <p className="mt-1 text-xs text-yellow-300">Uploading…</p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
