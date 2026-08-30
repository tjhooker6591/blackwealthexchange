export function getCloudinaryUploadConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  return { cloudName, uploadPreset };
}

export async function uploadImageBufferToCloudinary(args: {
  buffer: Buffer;
  fileName?: string;
  folder: string;
  contentType?: string;
}) {
  const { cloudName, uploadPreset } = getCloudinaryUploadConfig();
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  const byteView = new Uint8Array(args.buffer);
  const blob = new Blob([byteView], {
    type: args.contentType || "application/octet-stream",
  });

  formData.append("file", blob, args.fileName || "upload.jpg");
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", args.folder);

  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "Image upload failed.");
  }

  return {
    secureUrl: String(data.secure_url),
    publicId: String(data.public_id || ""),
  };
}
