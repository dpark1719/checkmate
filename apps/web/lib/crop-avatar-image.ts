const DEFAULT_OUTPUT_SIZE = 512;

export interface AvatarCropState {
  zoom: number;
  panX: number;
  panY: number;
}

export function computeBaseCoverScale(
  imageWidth: number,
  imageHeight: number,
  viewportSize: number
): number {
  return Math.max(viewportSize / imageWidth, viewportSize / imageHeight);
}

export function getDisplaySize(
  imageWidth: number,
  imageHeight: number,
  baseScale: number,
  zoom: number
) {
  const scale = baseScale * zoom;
  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
}

export function clampPan(
  panX: number,
  panY: number,
  displayWidth: number,
  displayHeight: number,
  viewportSize: number
) {
  const maxX = Math.max(0, (displayWidth - viewportSize) / 2);
  const maxY = Math.max(0, (displayHeight - viewportSize) / 2);
  return {
    panX: Math.min(maxX, Math.max(-maxX, panX)),
    panY: Math.min(maxY, Math.max(-maxY, panY)),
  };
}

export async function cropAvatarToFile(
  image: HTMLImageElement,
  crop: AvatarCropState,
  options: {
    viewportSize?: number;
    outputSize?: number;
    fileName?: string;
  } = {}
): Promise<File> {
  const viewportSize = options.viewportSize ?? 280;
  const outputSize = options.outputSize ?? DEFAULT_OUTPUT_SIZE;
  const baseScale = computeBaseCoverScale(
    image.naturalWidth,
    image.naturalHeight,
    viewportSize
  );
  const { width: displayWidth, height: displayHeight } = getDisplaySize(
    image.naturalWidth,
    image.naturalHeight,
    baseScale,
    crop.zoom
  );

  const imageLeft = viewportSize / 2 + crop.panX - displayWidth / 2;
  const imageTop = viewportSize / 2 + crop.panY - displayHeight / 2;

  const srcX = Math.max(0, (-imageLeft / displayWidth) * image.naturalWidth);
  const srcY = Math.max(0, (-imageTop / displayHeight) * image.naturalHeight);
  const srcW = Math.min(
    image.naturalWidth - srcX,
    (viewportSize / displayWidth) * image.naturalWidth
  );
  const srcH = Math.min(
    image.naturalHeight - srcY,
    (viewportSize / displayHeight) * image.naturalHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");

  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("Could not process image");

  const fileName = options.fileName ?? "avatar.jpg";
  return new File([blob], fileName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
