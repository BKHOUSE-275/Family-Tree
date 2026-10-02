import { del, get, head, put } from "@vercel/blob";
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Gallery files live in the same Blob store as tree portraits. That store is private,
// so they are served through /api/photos, which lets the CDN cache gallery files.
const ACCESS = "private" as const;
// turbopackIgnore: local paths are only known at run time (and only used in local
// development), so the bundler must not trace every file they could reach.
const LOCAL_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
const LOCAL_PREFIX = "/uploads/";
const LOCAL_GALLERY = "gallery/";

/** Sharp refuses images over 100 MP instead of decoding them into memory. */
const MAX_INPUT_PIXELS = 100_000_000;

const LOCAL_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

/** This project's store id, from the token (`vercel_blob_rw_<storeId>_<secret>`) or BLOB_STORE_ID. */
function blobStoreId() {
  const match = /^vercel_blob_rw_([a-z0-9]+)_/i.exec(blobToken() ?? "");
  const id = match?.[1] ?? process.env.BLOB_STORE_ID?.trim().replace(/^store_/i, "");
  return id ? id.toLowerCase() : null;
}

/** True only for https URLs on this project's own Blob store, never any other store. */
export function isVercelBlobUrl(value: string) {
  const storeId = blobStoreId();
  if (!storeId) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === `${storeId}.private.blob.vercel-storage.com` ||
        host === `${storeId}.public.blob.vercel-storage.com`)
    );
  } catch {
    return false;
  }
}

/** The URL the site stores and renders for a blob. */
export function servedUrl(blobUrl: string) {
  return `/api/photos?src=${encodeURIComponent(blobUrl)}`;
}

/** Turns a stored URL back into the underlying blob URL or local path. */
export function sourceUrl(stored: string) {
  if (stored.startsWith("/api/photos?")) {
    const src = new URLSearchParams(stored.slice("/api/photos?".length)).get("src");
    return src ?? stored;
  }
  return stored;
}

/**
 * Maps a stored `/uploads/...` URL to a file under public/uploads/<within>. The path is
 * normalized before the check, so `..` segments can never step outside that folder.
 */
function localPath(stored: string, within: string = LOCAL_GALLERY) {
  if (!stored.startsWith(LOCAL_PREFIX)) return null;
  const root = path.resolve(LOCAL_ROOT, within);
  const resolved = path.resolve(LOCAL_ROOT, stored.slice(LOCAL_PREFIX.length));
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

/**
 * Confirms a URL the browser sent back points at a gallery file we accept under the given
 * prefix, and returns its real size and type (never trust the client's word for either).
 */
export async function inspectUploadedFile(stored: string, prefix: string) {
  const source = sourceUrl(stored);
  if (isVercelBlobUrl(source)) {
    if (!new URL(source).pathname.startsWith(`/${prefix}`)) return null;
    try {
      const info = await head(source, { token: blobToken() });
      return { source, size: info.size, contentType: info.contentType.toLowerCase() };
    } catch {
      return null;
    }
  }

  const file = localPath(source, prefix);
  if (!file) return null;
  try {
    const info = await stat(/*turbopackIgnore: true*/ file);
    const ext = path.extname(file).slice(1).toLowerCase();
    return { source, size: info.size, contentType: LOCAL_TYPES[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function readGalleryFile(source: string): Promise<Buffer> {
  if (isVercelBlobUrl(source)) {
    const result = await get(source, { access: ACCESS, token: blobToken() });
    if (result?.statusCode !== 200 || !result.stream) {
      throw new Error("Could not read an uploaded file.");
    }
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  const file = localPath(source);
  if (!file) throw new Error("Could not read an uploaded file.");
  return readFile(/*turbopackIgnore: true*/ file);
}

/** Writes a server-made file (thumbnail or display copy). Returns the URL to store. */
export async function writeGalleryFile(pathname: string, body: Buffer, contentType: string) {
  if (isBlobConfigured()) {
    const blob = await put(pathname, body, {
      access: ACCESS,
      addRandomSuffix: true,
      token: blobToken(),
      contentType,
    });
    return servedUrl(blob.url);
  }
  if (process.env.VERCEL) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN to upload to the gallery on Vercel.");
  }
  return writeLocalGalleryFile(pathname, body);
}

/** Local development only: keeps files under public/uploads. */
export async function writeLocalGalleryFile(pathname: string, body: Buffer) {
  const ext = path.extname(pathname);
  const unique = `${pathname.slice(0, pathname.length - ext.length)}-${crypto.randomUUID().slice(0, 8)}${ext}`;
  const file = path.join(LOCAL_ROOT, unique);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ file, body);
  return `${LOCAL_PREFIX}${unique}`;
}

/** Best-effort cleanup; a missing file is not an error. */
export async function deleteGalleryFiles(stored: Array<string | null | undefined>) {
  const sources = [...new Set(stored.filter((url): url is string => Boolean(url)).map(sourceUrl))];
  const blobs = sources.filter(isVercelBlobUrl);
  if (blobs.length && isBlobConfigured()) {
    try {
      await del(blobs, { token: blobToken() });
    } catch (error) {
      console.error("Could not delete gallery blobs", error);
    }
  }
  for (const source of sources) {
    const file = localPath(source);
    if (file) await unlink(/*turbopackIgnore: true*/ file).catch(() => undefined);
  }
}

/**
 * Makes the lightbox copy (~1600px) and grid thumbnail (~480px) for a photo.
 * Rotates by EXIF first, so phone photos are upright, and drops the metadata
 * (including GPS location) from the copies people see. Animated GIFs get an
 * animated WebP display copy, so the public never needs the original file either.
 */
export async function makePhotoRenditions(original: Buffer, animated: boolean) {
  const options = { failOn: "none", limitInputPixels: MAX_INPUT_PIXELS } as const;
  const base = sharp(original, options).rotate();
  const meta = await base.metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const width = (swap ? meta.height : meta.width) ?? null;
  const height = (swap ? meta.width : meta.height) ?? null;

  const thumb = await base
    .clone()
    .resize(480, 480, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toBuffer();
  const display = await (animated ? sharp(original, { ...options, animated: true }) : base.clone())
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return { width, height, thumb, display };
}
