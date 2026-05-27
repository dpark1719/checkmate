/** Resize and compress photos before upload (~1MB target). */
export async function compressImageForUpload(
  file: File,
  options: {
    maxBytes?: number;
    maxDimension?: number;
    minQuality?: number;
  } = {}
): Promise<File> {
  const maxBytes = options.maxBytes ?? 1024 * 1024;
  const maxDimension = options.maxDimension ?? 1440;
  const minQuality = options.minQuality ?? 0.55;

  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image file");
  }

  if (file.size <= maxBytes && file.type === "image/jpeg") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let blob: Blob | null = null;

  while (quality >= minQuality) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob && blob.size <= maxBytes) break;
    quality -= 0.08;
  }

  if (!blob) {
    throw new Error("Could not compress image");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
