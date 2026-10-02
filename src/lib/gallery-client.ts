// Browser-only helpers for preparing gallery uploads.

import { croppedPhotoName, looksLikeHeic } from "@/lib/crop-image";

const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/** Some browsers (and Windows for .mov) leave file.type blank, so fall back to the extension. */
export function mediaTypeOf(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type && type !== "application/octet-stream") return type === "image/jpg" ? "image/jpeg" : type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? "";
}

/** iPhone HEIC photos become JPEGs before upload, since the server can't read HEIC. */
export async function prepareGalleryPhoto(file: File): Promise<File> {
  if (!looksLikeHeic(file)) return file;
  try {
    const { heicTo } = await import("heic-to/csp");
    const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
    return new File([jpeg], croppedPhotoName(file.name), { type: "image/jpeg" });
  } catch {
    throw new Error("This iPhone photo could not be converted. Export it as JPEG and try again.");
  }
}

export type VideoDetails = {
  poster: Blob | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

/**
 * Grabs a frame about a second in to use as the video's thumbnail. If this browser
 * can't decode the video (some iPhone HEVC files on older browsers), the upload still
 * works, just without a poster.
 */
export function readVideoDetails(file: File, timeoutMs = 12000): Promise<VideoDetails> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (details: VideoDetails) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(details);
    };
    const basics = () => ({
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      durationSeconds: Number.isFinite(video.duration) ? Math.round(video.duration) : null,
    });
    const timer = window.setTimeout(() => finish({ poster: null, ...basics() }), timeoutMs);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => finish({ poster: null, width: null, height: null, durationSeconds: null });
    video.onloadedmetadata = () => {
      const target = Number.isFinite(video.duration) ? Math.min(1, video.duration / 4) : 0;
      video.currentTime = target;
    };
    video.onseeked = () => {
      const { width, height } = basics();
      if (!width || !height) {
        finish({ poster: null, ...basics() });
        return;
      }
      const scale = Math.min(1, 960 / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish({ poster: null, ...basics() });
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish({ poster: blob, ...basics() }), "image/jpeg", 0.8);
    };
    video.src = url;
  });
}
