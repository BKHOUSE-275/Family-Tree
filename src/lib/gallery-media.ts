// Upload rules shared by the browser uploader and the server checks.

export const GALLERY_MAX_ITEMS_PER_UPLOAD = 20;
export const GALLERY_MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const GALLERY_MAX_VIDEO_BYTES = 300 * 1024 * 1024;
export const GALLERY_MAX_POSTER_BYTES = 2 * 1024 * 1024;
export const GALLERY_MAX_CAPTION = 500;
export const GALLERY_MAX_NAME = 80;

export const GALLERY_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const GALLERY_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

/** Blob path prefixes. Originals and video posters come straight from the browser. */
export const GALLERY_PATHS = {
  original: "gallery/originals/",
  poster: "gallery/posters/",
  display: "gallery/display/",
  thumb: "gallery/thumbs/",
} as const;

export function galleryKindForType(contentType: string): "photo" | "video" | null {
  const type = contentType.toLowerCase();
  if ((GALLERY_PHOTO_TYPES as readonly string[]).includes(type)) return "photo";
  if ((GALLERY_VIDEO_TYPES as readonly string[]).includes(type)) return "video";
  return null;
}

export function galleryMaxBytes(kind: "photo" | "video") {
  return kind === "video" ? GALLERY_MAX_VIDEO_BYTES : GALLERY_MAX_PHOTO_BYTES;
}

export function safeGalleryFileName(name: string, fallbackExt: string) {
  const ext = (name.split(".").pop() || fallbackExt).toLowerCase().replace(/[^a-z0-9]/g, "");
  const base =
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .slice(0, 60) || "file";
  return `${base}.${ext || fallbackExt}`;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
