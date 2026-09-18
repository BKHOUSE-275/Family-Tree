import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { preparePhotoUpload, storePreparedPhoto } from "@/lib/photo";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function isVercelBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src || !isVercelBlobUrl(src)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await get(src, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  if (result?.statusCode !== 200 || !result.stream) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Please choose a photo under 8 MB." }, { status: 400 });
    }

    const prepared = await preparePhotoUpload(file);
    const stored = await storePreparedPhoto(prepared);
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload this photo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
