import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";
import { isVercelBlobUrl } from "@/lib/gallery-files";
import { preparePhotoUpload, storePreparedPhoto } from "@/lib/photo";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { isCommittee } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

// Guests add a photo or two with a suggestion; the committee edits many people in a sitting.
const GUEST_UPLOADS_PER_HOUR = 20;
const COMMITTEE_UPLOADS_PER_HOUR = 300;

// SVG is left out on purpose: it can carry script.
const SERVABLE_TYPE = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|quicktime|webm))$/;

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/** The real image type from the file's first bytes, or null if it is not one we accept. */
function sniffImageType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.toString("hex", 0, 8) === "89504e470d0a1a0a") return "image/png";
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(bytes.toString("ascii", 0, 6))) return "image/gif";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src || !isVercelBlobUrl(src) || !process.env.BLOB_READ_WRITE_TOKEN) {
    return notFound();
  }

  // Videos need byte ranges so the browser can seek and start playback quickly.
  const range = request.headers.get("range");
  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(src, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      headers: range ? { range } : undefined,
    });
  } catch {
    // Missing (e.g. removed) blob or an unsatisfiable range.
    return notFound();
  }
  if (!result?.stream) return notFound();

  // Only ever serve media, so a stray HTML or SVG file can't run on this origin.
  const contentType = (result.blob.contentType || "").split(";")[0].trim().toLowerCase();
  if (!SERVABLE_TYPE.test(contentType)) {
    await result.stream.cancel().catch(() => undefined);
    return notFound();
  }

  const partial = Boolean(result.headers.get("content-range"));
  const isGallery = new URL(src).pathname.startsWith("/gallery/");
  // Gallery files are public and each upload has a unique path, so the CDN caches
  // them, but only for a day (s-maxage) and browsers for an hour (max-age), so a
  // file the committee removes stops being served within about a day. Not
  // `immutable`, so browsers revalidate (cheaply, via ETag) once that hour is up.
  // Partial (206) replies stay out of the shared cache: they are one slice of the
  // file under the same URL (Vary: Range marks them as such too).
  const cacheControl = partial
    ? "private, max-age=3600"
    : isGallery
      ? "public, max-age=3600, s-maxage=86400"
      : "private, max-age=31536000, immutable";
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });
  if (partial) headers.set("Vary", "Range");
  for (const name of ["content-length", "content-range", "etag"]) {
    const value = result.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new NextResponse(result.stream, {
    status: partial ? 206 : 200,
    headers,
  });
}

/**
 * Portrait and headstone uploads from PhotoField: the committee's person editor
 * and guests' suggestion form. Guests are rate limited and kept under their own
 * prefix (family/guest/) so their files are easy to find and clean up.
 */
export async function POST(request: Request) {
  try {
    const user = await getAppUser();
    const committee = Boolean(user && isCommittee(user.role));
    const allowed = await hitRateLimit(
      `photos:${committee ? `committee:${user?.id}` : `guest:${await clientIp()}`}`,
      committee ? COMMITTEE_UPLOADS_PER_HOUR : GUEST_UPLOADS_PER_HOUR,
      60 * 60,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many photo uploads. Please wait a while and try again." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Please choose a photo under 8 MB." }, { status: 400 });
    }

    const prepared = await preparePhotoUpload(file);
    // Trust the bytes, not the browser's file name or type.
    const contentType = sniffImageType(prepared.body);
    if (!contentType) {
      return NextResponse.json({ error: "Please choose a JPEG, PNG, WebP, or GIF photo." }, { status: 400 });
    }
    const stored = await storePreparedPhoto({
      ...prepared,
      contentType,
      pathname: committee ? prepared.pathname : prepared.pathname.replace(/^family\//, "family/guest/"),
    });
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload this photo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
