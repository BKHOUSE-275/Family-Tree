"use server";

import { revalidatePath } from "next/cache";
import { getAppUser, requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  addGalleryItems,
  deleteAlbum,
  deleteGalleryItems,
  getAlbum,
  getGalleryItem,
  isGalleryFileInUse,
  listAlbums,
  saveAlbum,
} from "@/lib/gallery-store";
import {
  deleteGalleryFiles,
  inspectUploadedFile,
  makePhotoRenditions,
  readGalleryFile,
  servedUrl,
  writeGalleryFile,
} from "@/lib/gallery-files";
import {
  GALLERY_MAX_CAPTION,
  GALLERY_MAX_ITEMS_PER_UPLOAD,
  GALLERY_MAX_NAME,
  GALLERY_MAX_POSTER_BYTES,
  GALLERY_PATHS,
  galleryKindForType,
  galleryMaxBytes,
} from "@/lib/gallery-media";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { TREE_ALBUM_ID, type Album, type GalleryItem } from "@/lib/types";

function str(formData: FormData, key: string, max = 200) {
  const value = String(formData.get(key) ?? "").trim().slice(0, max);
  return value.length ? value : null;
}

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

function revalidateGallery(albumId?: string) {
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  if (albumId) revalidatePath(`/gallery/${albumId}`);
}

function servedFrom(source: string) {
  return source.startsWith("/uploads/") ? source : servedUrl(source);
}

// ---------- Uploads (anyone) ----------

// Each save is one batch of up to GALLERY_MAX_ITEMS_PER_UPLOAD files, so this allows
// over a thousand files an hour per connection: plenty for a reunion on shared wifi.
const SAVES_PER_HOUR = 60;

export type GalleryUploadInput = {
  albumId: string;
  uploaderName: string;
  /** Hidden form field; people never fill it in, simple bots do. */
  website: string;
  items: Array<{
    url: string;
    posterUrl?: string | null;
    caption?: string | null;
    takenDate?: string | null;
    width?: number | null;
    height?: number | null;
    durationSeconds?: number | null;
  }>;
};

export type GalleryUploadResult =
  | { ok: true; saved: number; failed: number }
  | { ok: false; error: string };

async function buildItem(
  albumId: string,
  uploader: { userId: string | null; name: string },
  input: GalleryUploadInput["items"][number],
): Promise<GalleryItem | null> {
  // Never delete files from this path: the URLs come from the browser, so a bad
  // request could point at someone else's upload. Rejected files are left for cleanup.
  const original = await inspectUploadedFile(input.url, GALLERY_PATHS.original);
  if (!original || (await isGalleryFileInUse(servedFrom(original.source)))) return null;
  const kind = galleryKindForType(original.contentType);
  if (!kind || original.size > galleryMaxBytes(kind)) return null;

  const base = {
    id: `media-${crypto.randomUUID()}`,
    albumId,
    kind,
    url: servedFrom(original.source),
    contentType: original.contentType,
    caption: clean(input.caption, GALLERY_MAX_CAPTION),
    takenDate: clean(input.takenDate, 40),
    uploaderUserId: uploader.userId,
    uploaderName: uploader.name,
    createdAt: new Date().toISOString(),
  };

  if (kind === "video") {
    const poster = input.posterUrl
      ? await inspectUploadedFile(input.posterUrl, GALLERY_PATHS.poster)
      : null;
    const posterOk =
      poster &&
      poster.size <= GALLERY_MAX_POSTER_BYTES &&
      !(await isGalleryFileInUse(servedFrom(poster.source)));
    const whole = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
    return {
      ...base,
      displayUrl: base.url,
      thumbUrl: posterOk ? servedFrom(poster.source) : null,
      width: whole(input.width),
      height: whole(input.height),
      durationSeconds: whole(input.durationSeconds),
    };
  }

  const bytes = await readGalleryFile(original.source);
  const isGif = original.contentType === "image/gif";
  const renditions = await makePhotoRenditions(bytes, isGif);
  const thumbUrl = await writeGalleryFile(`${GALLERY_PATHS.thumb}thumb.webp`, renditions.thumb, "image/webp");
  let displayUrl: string;
  try {
    displayUrl = await writeGalleryFile(`${GALLERY_PATHS.display}display.webp`, renditions.display, "image/webp");
  } catch (error) {
    await deleteGalleryFiles([thumbUrl]);
    throw error;
  }
  return {
    ...base,
    displayUrl,
    thumbUrl,
    width: renditions.width,
    height: renditions.height,
    durationSeconds: null,
  };
}

/**
 * Called after the browser has sent the files to storage. Checks each file,
 * makes photo thumbnails, and adds everything to the album.
 */
export async function saveGalleryUploadsAction(
  input: GalleryUploadInput,
): Promise<GalleryUploadResult> {
  if (input.website) return { ok: true, saved: 0, failed: 0 };

  const seen = new Set<string>();
  const items = (input.items ?? [])
    .filter((item) => typeof item?.url === "string" && !seen.has(item.url) && seen.add(item.url))
    .slice(0, GALLERY_MAX_ITEMS_PER_UPLOAD);
  if (!items.length) return { ok: false, error: "Choose at least one photo or video." };

  const album = input.albumId && input.albumId !== TREE_ALBUM_ID ? await getAlbum(input.albumId) : null;
  if (!album) return { ok: false, error: "That album no longer exists." };

  const user = await getAppUser();
  // The gallery is public, so never fall back to a login name that is really an email address.
  const accountName = user?.name && !user.name.includes("@") ? user.name : null;
  const name = clean(input.uploaderName, GALLERY_MAX_NAME) ?? clean(accountName, GALLERY_MAX_NAME);
  if (!name) return { ok: false, error: "Please add your name so the family knows who shared these." };

  if (!(await hitRateLimit(`gallery-save:${await clientIp()}`, SAVES_PER_HOUR, 60 * 60))) {
    return { ok: false, error: "Too many uploads from this connection. Please wait a while and try again." };
  }

  const saved: GalleryItem[] = [];
  let failed = 0;
  for (const item of items) {
    try {
      const built = await buildItem(album.id, { userId: user?.id ?? null, name }, item);
      if (built) saved.push(built);
      else failed += 1;
    } catch (error) {
      console.error("Could not save a gallery upload", error);
      failed += 1;
    }
  }

  try {
    await addGalleryItems(saved);
  } catch (error) {
    // Only the copies made here are removed; originals and posters came from the browser.
    console.error("Could not save gallery uploads", error);
    await deleteGalleryFiles(
      saved.flatMap((item) => (item.kind === "photo" ? [item.thumbUrl, item.displayUrl] : [])),
    );
    return { ok: false, error: "Your files could not be added to the album. Please try again." };
  }
  revalidateGallery(album.id);
  return { ok: true, saved: saved.length, failed };
}

// ---------- Committee: albums ----------

export async function saveAlbumAction(formData: FormData) {
  const user = await requirePermission("gallery.manage");
  const id = str(formData, "id");
  const title = str(formData, "title", 120);
  if (!title) throw new Error("Give the album a title.");

  const now = new Date().toISOString();
  const existing = id ? await getAlbum(id) : null;
  if (id && !existing) throw new Error("That album was not found.");

  let sortOrder = existing?.sortOrder ?? 0;
  if (!existing) {
    const all = await listAlbums();
    sortOrder = all.length ? Math.min(...all.map((album) => album.sortOrder)) - 1 : 0;
  }

  const album: Album = {
    id: existing?.id ?? `album-${crypto.randomUUID().slice(0, 12)}`,
    title,
    description: str(formData, "description", 1000),
    eventDate: str(formData, "eventDate", 40),
    coverItemId: existing?.coverItemId ?? null,
    sortOrder,
    createdByUserId: existing?.createdByUserId ?? user.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await saveAlbum(album);
  await recordAudit(
    user,
    existing ? "album.update" : "album.create",
    title,
    existing ? "Updated album details" : "Created album",
    album.id,
  );
  revalidateGallery(album.id);
}

export async function deleteAlbumAction(formData: FormData) {
  const user = await requirePermission("gallery.manage");
  const id = String(formData.get("id") ?? "");
  const album = await getAlbum(id);
  if (!album) throw new Error("That album was not found.");

  const removed = await deleteAlbum(id);
  await deleteGalleryFiles(removed.flatMap((item) => [item.url, item.displayUrl, item.thumbUrl]));
  await recordAudit(
    user,
    "album.delete",
    album.title,
    `Deleted album and ${removed.length} item${removed.length === 1 ? "" : "s"}`,
    id,
  );
  revalidateGallery(id);
}

export async function moveAlbumAction(formData: FormData) {
  await requirePermission("gallery.manage");
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "down" ? 1 : -1;
  const ordered = await listAlbums();
  const index = ordered.findIndex((album) => album.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return;

  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  const now = new Date().toISOString();
  await Promise.all(
    ordered.map((album, position) =>
      album.sortOrder === position ? null : saveAlbum({ ...album, sortOrder: position, updatedAt: now }),
    ),
  );
  revalidateGallery();
}

export async function setAlbumCoverAction(formData: FormData) {
  await requirePermission("gallery.manage");
  const itemId = String(formData.get("itemId") ?? "");
  const item = await getGalleryItem(itemId);
  if (!item) throw new Error("That photo was not found.");
  const album = await getAlbum(item.albumId);
  if (!album) throw new Error("That album was not found.");
  await saveAlbum({ ...album, coverItemId: item.id, updatedAt: new Date().toISOString() });
  revalidateGallery(album.id);
}

// ---------- Committee: remove uploads ----------

export async function removeGalleryItemAction(formData: FormData) {
  const user = await requirePermission("gallery.manage");
  const id = String(formData.get("id") ?? "");
  const item = await getGalleryItem(id);
  if (!item) return;

  await deleteGalleryItems([id]);
  await deleteGalleryFiles([item.url, item.displayUrl, item.thumbUrl]);
  const album = await getAlbum(item.albumId);
  if (album?.coverItemId === id) {
    await saveAlbum({ ...album, coverItemId: null, updatedAt: new Date().toISOString() });
  }
  await recordAudit(
    user,
    "gallery.remove",
    album?.title ?? "Gallery",
    `Removed a ${item.kind} uploaded by ${item.uploaderName}${item.caption ? ` · “${item.caption}”` : ""}`,
    item.albumId,
  );
  revalidateGallery(item.albumId);
}
