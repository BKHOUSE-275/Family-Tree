import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAlbum } from "@/lib/gallery-store";
import { isBlobConfigured, writeLocalGalleryFile } from "@/lib/gallery-files";
import {
  GALLERY_MAX_POSTER_BYTES,
  GALLERY_PATHS,
  GALLERY_PHOTO_TYPES,
  GALLERY_VIDEO_TYPES,
  galleryKindForType,
  galleryMaxBytes,
  safeGalleryFileName,
} from "@/lib/gallery-media";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { TREE_ALBUM_ID } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Per connection, each token is one file. Generous enough for a reunion where several
// relatives share the venue wifi and each uploads a hundred photos in an hour, while
// keeping a stranger from filling the store (videos are capped harder: 300 MB each).
const HOUR = 60 * 60;
const TOKEN_LIMITS = {
  photo: [{ limit: 600, window: HOUR }],
  video: [
    { limit: 60, window: HOUR },
    { limit: 200, window: 24 * HOUR },
  ],
} as const;

class RateLimitedError extends Error {}

async function assertUnderTokenLimit(kind: "photo" | "video") {
  const ip = await clientIp();
  for (const { limit, window } of TOKEN_LIMITS[kind]) {
    if (!(await hitRateLimit(`gallery-token:${kind}:${window}:${ip}`, limit, window))) {
      throw new RateLimitedError("Too many uploads from this connection. Please wait a while and try again.");
    }
  }
}

async function assertUploadableAlbum(albumId: unknown) {
  if (typeof albumId !== "string" || !albumId || albumId === TREE_ALBUM_ID) {
    throw new Error("Choose an album to upload to.");
  }
  if (!(await getAlbum(albumId))) {
    throw new Error("That album no longer exists.");
  }
}

function parsePayload(raw: string | null) {
  try {
    return raw ? (JSON.parse(raw) as { albumId?: unknown; kind?: unknown }) : {};
  } catch {
    return {};
  }
}

/**
 * Issues short-lived tokens so the browser can upload originals and video posters
 * straight to Blob. Large videos never pass through a function.
 */
async function issueToken(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const result = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const payload = parsePayload(clientPayload);
      await assertUploadableAlbum(payload.albumId);

      if (pathname.startsWith(GALLERY_PATHS.poster)) {
        // Posters are small stills, so they count against the photo allowance.
        await assertUnderTokenLimit("photo");
        return {
          allowedContentTypes: ["image/jpeg", "image/webp"],
          maximumSizeInBytes: GALLERY_MAX_POSTER_BYTES,
          addRandomSuffix: true,
        };
      }
      if (!pathname.startsWith(GALLERY_PATHS.original)) {
        throw new Error("That upload path is not allowed.");
      }
      const kind = payload.kind === "video" ? "video" : "photo";
      await assertUnderTokenLimit(kind);
      return {
        allowedContentTypes: [...(kind === "video" ? GALLERY_VIDEO_TYPES : GALLERY_PHOTO_TYPES)],
        maximumSizeInBytes: galleryMaxBytes(kind),
        addRandomSuffix: true,
      };
    },
  });
  return NextResponse.json(result);
}

/** Local development without Blob: the browser posts the file here instead. */
async function storeLocally(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Set BLOB_READ_WRITE_TOKEN to upload to the gallery on Vercel." },
      { status: 400 },
    );
  }
  const form = await request.formData();
  await assertUploadableAlbum(form.get("albumId"));
  const file = form.get("file");
  const target = form.get("target") === "poster" ? "poster" : "original";
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const type = (file.type || "").toLowerCase();
  const kind = galleryKindForType(type);
  const tooBig =
    target === "poster"
      ? file.size > GALLERY_MAX_POSTER_BYTES
      : !kind || file.size > galleryMaxBytes(kind);
  if ((target === "poster" && kind !== "photo") || tooBig) {
    return NextResponse.json({ error: "This file type or size is not allowed." }, { status: 400 });
  }

  const prefix = target === "poster" ? GALLERY_PATHS.poster : GALLERY_PATHS.original;
  const url = await writeLocalGalleryFile(
    `${prefix}${safeGalleryFileName(file.name, kind === "video" ? "mp4" : "jpg")}`,
    Buffer.from(await file.arrayBuffer()),
  );
  return NextResponse.json({ url });
}

export async function POST(request: Request) {
  try {
    const isForm = (request.headers.get("content-type") ?? "").includes("multipart/form-data");
    if (isForm) return await storeLocally(request);
    if (!isBlobConfigured()) {
      return NextResponse.json({ error: "Uploads are stored locally here." }, { status: 400 });
    }
    return await issueToken(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start this upload.";
    return NextResponse.json({ error: message }, { status: error instanceof RateLimitedError ? 429 : 400 });
  }
}
