import fs from "node:fs/promises";
import path from "node:path";

type SupportedImageType = "jpeg" | "png" | "webp";
type RejectedImageType = "gif" | "tiff" | "vips";

export type DetectedImageType = SupportedImageType | RejectedImageType;

export type ValidationResult =
  | {
      ok: true;
      detectedType: SupportedImageType;
      canonicalExtension: ".jpg" | ".png" | ".webp";
      canonicalMimeType: "image/jpeg" | "image/png" | "image/webp";
      size: number;
    }
  | {
      ok: false;
      reason:
        | "file_too_large"
        | "invalid_image_content"
        | "unsupported_image_type";
      detectedType?: DetectedImageType;
      size?: number;
    };

type UploadLikeFile = {
  filepath?: string;
  size?: number | null;
};

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF_87A = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const GIF_89A = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
const TIFF_LE = [0x49, 0x49, 0x2a, 0x00];
const TIFF_BE = [0x4d, 0x4d, 0x00, 0x2a];
const VIPS_LE = [0x08, 0xf2, 0xa6, 0xb6];
const VIPS_BE = [0xb6, 0xa6, 0xf2, 0x08];

function startsWithBytes(buffer: Uint8Array, signature: number[]) {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function detectImageType(buffer: Uint8Array): DetectedImageType | null {
  if (startsWithBytes(buffer, JPEG_SIGNATURE)) return "jpeg";
  if (startsWithBytes(buffer, PNG_SIGNATURE)) return "png";

  if (
    buffer.length >= 12 &&
    Buffer.from(buffer.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(buffer.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  if (startsWithBytes(buffer, GIF_87A) || startsWithBytes(buffer, GIF_89A)) {
    return "gif";
  }
  if (startsWithBytes(buffer, TIFF_LE) || startsWithBytes(buffer, TIFF_BE)) {
    return "tiff";
  }
  if (startsWithBytes(buffer, VIPS_LE) || startsWithBytes(buffer, VIPS_BE)) {
    return "vips";
  }

  return null;
}

function canonicalExtensionFor(type: SupportedImageType) {
  if (type === "jpeg") return ".jpg" as const;
  if (type === "png") return ".png" as const;
  return ".webp" as const;
}

function canonicalMimeFor(type: SupportedImageType) {
  if (type === "jpeg") return "image/jpeg" as const;
  if (type === "png") return "image/png" as const;
  return "image/webp" as const;
}

function isSupportedImageType(
  type: DetectedImageType,
): type is SupportedImageType {
  return type === "jpeg" || type === "png" || type === "webp";
}

async function fileSize(file: UploadLikeFile) {
  if (typeof file.size === "number" && Number.isFinite(file.size)) {
    return file.size;
  }
  if (!file.filepath) return 0;
  const stats = await fs.stat(file.filepath);
  return stats.size;
}

async function readSignature(filepath: string) {
  const handle = await fs.open(filepath, "r");
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export async function validateUploadedImageFile(
  file: UploadLikeFile,
  maxBytes: number,
): Promise<ValidationResult> {
  const size = await fileSize(file);
  if (!file.filepath) {
    return { ok: false, reason: "invalid_image_content", size };
  }
  if (size > maxBytes) {
    return { ok: false, reason: "file_too_large", size };
  }

  const signature = await readSignature(file.filepath);
  const detectedType = detectImageType(signature);
  if (!detectedType) {
    return { ok: false, reason: "invalid_image_content", size };
  }
  if (!isSupportedImageType(detectedType)) {
    return { ok: false, reason: "unsupported_image_type", detectedType, size };
  }

  return {
    ok: true,
    detectedType,
    canonicalExtension: canonicalExtensionFor(detectedType),
    canonicalMimeType: canonicalMimeFor(detectedType),
    size,
  };
}

export function isMultipartFileTooLargeError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error ? String((error as { code?: unknown }).code) : "";
  const httpCode =
    "httpCode" in error
      ? Number((error as { httpCode?: unknown }).httpCode)
      : NaN;
  const message =
    "message" in error ? String((error as { message?: unknown }).message) : "";
  return (
    code === "ETOOBIG" ||
    httpCode === 413 ||
    message.toLowerCase().includes("maxfilesize exceeded")
  );
}

export function replaceExtension(filename: string, extension: string) {
  const base = path.basename(filename, path.extname(filename));
  return `${base}${extension}`;
}

export async function moveUploadedFile(sourcePath: string, destPath: string) {
  try {
    await fs.rename(sourcePath, destPath);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code !== "EXDEV") throw error;
    await fs.copyFile(sourcePath, destPath);
    await fs.unlink(sourcePath);
  }
}
