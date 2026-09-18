export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const PREVIEW_MAX_EDGE = 2400;
const OUTPUT_MAX_EDGE = 1600;

export function looksLikeHeic(file: File) {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function looksLikeJpegOrPng(file: File) {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/gif" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif")
  );
}

export function croppedPhotoName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}

function decodeHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This file could not be opened as a photo."));
    image.src = src;
  });
}

function canvasToObjectUrl(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.92,
) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("This file could not be opened as a photo."));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, type, quality);
  });
}

function drawScaled(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxEdge: number,
) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This file could not be opened as a photo.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function heicFileToCropSrc(file: File) {
  try {
    const { heicTo } = await import("heic-to/csp");
    const jpeg = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.9,
    });
    const converted = new File([jpeg], croppedPhotoName(file.name), {
      type: "image/jpeg",
    });
    return await fileToCropSrc(converted);
  } catch {
    throw new Error(
      "This iPhone photo could not be converted. Export it as JPEG or PNG and try again.",
    );
  }
}

export async function fileToCropSrc(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const canvas = drawScaled(bitmap, bitmap.width, bitmap.height, PREVIEW_MAX_EDGE);
      bitmap.close();
      return canvasToObjectUrl(canvas);
    } catch {
      // HEIC and some other types fail here in Chromium.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await decodeHtmlImage(objectUrl);
    const canvas = drawScaled(image, image.naturalWidth, image.naturalHeight, PREVIEW_MAX_EDGE);
    URL.revokeObjectURL(objectUrl);
    return canvasToObjectUrl(canvas);
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function cropImageToJpeg(imageSrc: string, pixelCrop: PixelCrop) {
  const image = await decodeHtmlImage(imageSrc);
  const scale = Math.min(
    1,
    OUTPUT_MAX_EDGE / Math.max(pixelCrop.width, pixelCrop.height),
  );
  const width = Math.max(1, Math.round(pixelCrop.width * scale));
  const height = Math.max(1, Math.round(pixelCrop.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop this photo.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Could not crop this photo."));
      else resolve(blob);
    }, "image/jpeg", 0.92);
  });
}
