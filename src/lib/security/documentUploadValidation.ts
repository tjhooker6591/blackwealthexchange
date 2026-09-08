import fs from "node:fs/promises";

// Phase 8 -- P8-07 Image/File/IP Protection. Same defense-in-depth pattern
// as imageUploadValidation.ts (magic-byte content signature, not a
// client-supplied filename extension or MIME type) applied to resume
// uploads (PDF / legacy DOC / DOCX).

export type SupportedDocumentType = "pdf" | "doc" | "docx";

export type DocumentValidationResult =
  | {
      ok: true;
      detectedType: SupportedDocumentType;
      canonicalExtension: ".pdf" | ".doc" | ".docx";
      size: number;
    }
  | {
      ok: false;
      reason: "file_too_large" | "invalid_document_content";
      size?: number;
    };

type UploadLikeFile = {
  filepath?: string;
  size?: number | null;
};

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const OLE_CFB_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // legacy .doc
const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
]; // .docx is a zip archive

function startsWithBytes(buffer: Uint8Array, signature: number[]) {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
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

export async function validateUploadedDocumentFile(
  file: UploadLikeFile,
  maxBytes: number,
): Promise<DocumentValidationResult> {
  const size = await fileSize(file);
  if (!file.filepath) {
    return { ok: false, reason: "invalid_document_content", size };
  }
  if (size > maxBytes) {
    return { ok: false, reason: "file_too_large", size };
  }

  const signature = await readSignature(file.filepath);

  if (startsWithBytes(signature, PDF_SIGNATURE)) {
    return { ok: true, detectedType: "pdf", canonicalExtension: ".pdf", size };
  }
  if (startsWithBytes(signature, OLE_CFB_SIGNATURE)) {
    return { ok: true, detectedType: "doc", canonicalExtension: ".doc", size };
  }
  if (ZIP_SIGNATURES.some((sig) => startsWithBytes(signature, sig))) {
    // A .docx is a zip; legacy .doc (OLE CFB) is caught above, so any
    // zip-signature file here is treated as .docx.
    return {
      ok: true,
      detectedType: "docx",
      canonicalExtension: ".docx",
      size,
    };
  }

  return { ok: false, reason: "invalid_document_content", size };
}
