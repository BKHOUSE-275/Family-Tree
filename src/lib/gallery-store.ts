import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { albums, galleryItems } from "@/lib/db/schema";
import {
  TREE_ALBUM_ID,
  displayName,
  personVisibility,
  type Album,
  type FamilySnapshot,
  type GalleryItem,
} from "@/lib/types";

const LOCAL_FILE = path.join(process.cwd(), ".data", "gallery.json");

type GalleryData = {
  albums: Album[];
  items: GalleryItem[];
};

export type AlbumSummary = Album & {
  itemCount: number;
  coverThumbUrl: string | null;
  /** Up to four thumbnails for the cover collage, newest first (the chosen cover leads). */
  collageThumbUrls: string[];
};

declare global {
  var __galleryMemory: GalleryData | undefined;
}

async function readLocal(): Promise<GalleryData> {
  if (globalThis.__galleryMemory) {
    return globalThis.__galleryMemory;
  }
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<GalleryData>;
    globalThis.__galleryMemory = {
      albums: parsed.albums ?? [],
      items: parsed.items ?? [],
    };
  } catch {
    globalThis.__galleryMemory = { albums: [], items: [] };
  }
  return globalThis.__galleryMemory;
}

async function writeLocal(data: GalleryData) {
  globalThis.__galleryMemory = data;
  try {
    await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Read-only hosts (Vercel) keep the in-memory copy for this instance only.
  }
}

function toIso(value: Date | string | null | undefined) {
  if (value == null || value === "") return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function mapAlbum(row: typeof albums.$inferSelect): Album {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.eventDate,
    coverItemId: row.coverItemId,
    sortOrder: row.sortOrder,
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapItem(row: typeof galleryItems.$inferSelect): GalleryItem {
  return {
    id: row.id,
    albumId: row.albumId,
    kind: row.kind,
    url: row.url,
    displayUrl: row.displayUrl,
    thumbUrl: row.thumbUrl,
    contentType: row.contentType,
    width: row.width,
    height: row.height,
    durationSeconds: row.durationSeconds,
    caption: row.caption,
    takenDate: row.takenDate,
    uploaderUserId: row.uploaderUserId,
    uploaderName: row.uploaderName,
    createdAt: toIso(row.createdAt),
  };
}

function albumOrder(a: Album, b: Album) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return b.createdAt.localeCompare(a.createdAt);
}

function newestFirst(a: GalleryItem, b: GalleryItem) {
  return b.createdAt.localeCompare(a.createdAt);
}

// One shared promise: parallel first queries must not race to CREATE TABLE,
// which Postgres can reject even with IF NOT EXISTS.
let galleryTablesReady: Promise<void> | null = null;

function ensureGalleryTables() {
  galleryTablesReady ??= createGalleryTables().catch((error) => {
    galleryTablesReady = null;
    throw error;
  });
  return galleryTablesReady;
}

async function createGalleryTables() {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT,
      cover_item_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by_user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      url TEXT NOT NULL,
      display_url TEXT NOT NULL,
      thumb_url TEXT,
      content_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration_seconds INTEGER,
      caption TEXT,
      taken_date TEXT,
      uploader_user_id TEXT,
      uploader_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS gallery_items_album_idx ON gallery_items (album_id, created_at)
  `);
}

async function galleryDb() {
  await ensureGalleryTables();
  return getDb();
}

export async function listAlbums(): Promise<Album[]> {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db
      .select()
      .from(albums)
      .orderBy(asc(albums.sortOrder), desc(albums.createdAt));
    return rows.map(mapAlbum);
  }
  const data = await readLocal();
  return [...data.albums].sort(albumOrder);
}

/** Albums with item counts and a cover thumbnail, for the gallery front page. */
export async function listAlbumSummaries(): Promise<AlbumSummary[]> {
  const albumList = await listAlbums();
  let items: Pick<GalleryItem, "id" | "albumId" | "thumbUrl" | "createdAt">[];
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db
      .select({
        id: galleryItems.id,
        albumId: galleryItems.albumId,
        thumbUrl: galleryItems.thumbUrl,
        createdAt: galleryItems.createdAt,
      })
      .from(galleryItems);
    items = rows.map((row) => ({ ...row, createdAt: toIso(row.createdAt) }));
  } else {
    items = (await readLocal()).items;
  }

  return albumList.map((album) => {
    const own = items
      .filter((item) => item.albumId === album.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const withThumbs = own.filter((item) => item.thumbUrl);
    const cover =
      withThumbs.find((item) => item.id === album.coverItemId) ?? withThumbs[0];
    const collage = cover
      ? [cover, ...withThumbs.filter((item) => item.id !== cover.id)].slice(0, 4)
      : [];
    return {
      ...album,
      itemCount: own.length,
      coverThumbUrl: cover?.thumbUrl ?? null,
      collageThumbUrls: collage.map((item) => item.thumbUrl as string),
    };
  });
}

export async function getAlbum(id: string): Promise<Album | null> {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
    return rows[0] ? mapAlbum(rows[0]) : null;
  }
  const data = await readLocal();
  return data.albums.find((album) => album.id === id) ?? null;
}

export async function saveAlbum(input: Album) {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const row = {
      ...input,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(input.updatedAt),
    };
    await db
      .insert(albums)
      .values(row)
      .onConflictDoUpdate({
        target: albums.id,
        set: {
          title: row.title,
          description: row.description,
          eventDate: row.eventDate,
          coverItemId: row.coverItemId,
          sortOrder: row.sortOrder,
          updatedAt: row.updatedAt,
        },
      });
    return;
  }
  const data = await readLocal();
  const index = data.albums.findIndex((album) => album.id === input.id);
  if (index >= 0) data.albums[index] = input;
  else data.albums.push(input);
  await writeLocal(data);
}

/** Deletes an album and its items. Returns the removed items so their files can be cleaned up. */
export async function deleteAlbum(id: string): Promise<GalleryItem[]> {
  const removed = await listAlbumItems(id);
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    await db.delete(albums).where(eq(albums.id, id));
    return removed;
  }
  const data = await readLocal();
  data.albums = data.albums.filter((album) => album.id !== id);
  data.items = data.items.filter((item) => item.albumId !== id);
  await writeLocal(data);
  return removed;
}

export async function listAlbumItems(albumId: string): Promise<GalleryItem[]> {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.albumId, albumId))
      .orderBy(desc(galleryItems.createdAt));
    return rows.map(mapItem);
  }
  const data = await readLocal();
  return data.items.filter((item) => item.albumId === albumId).sort(newestFirst);
}

export async function listRecentItems(limit = 60): Promise<GalleryItem[]> {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db
      .select()
      .from(galleryItems)
      .orderBy(desc(galleryItems.createdAt))
      .limit(limit);
    return rows.map(mapItem);
  }
  const data = await readLocal();
  return [...data.items].sort(newestFirst).slice(0, limit);
}

export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.id, id))
      .limit(1);
    return rows[0] ? mapItem(rows[0]) : null;
  }
  const data = await readLocal();
  return data.items.find((item) => item.id === id) ?? null;
}

/** True when any saved item already uses this file, so one upload can't become two items. */
export async function isGalleryFileInUse(url: string) {
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    const rows = await db
      .select({ id: galleryItems.id })
      .from(galleryItems)
      .where(or(eq(galleryItems.url, url), eq(galleryItems.thumbUrl, url)))
      .limit(1);
    return rows.length > 0;
  }
  const data = await readLocal();
  return data.items.some((item) => item.url === url || item.thumbUrl === url);
}

export async function addGalleryItems(input: GalleryItem[]) {
  if (!input.length) return;
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    await db
      .insert(galleryItems)
      .values(input.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })));
    return;
  }
  const data = await readLocal();
  data.items.push(...input);
  await writeLocal(data);
}

export async function deleteGalleryItems(ids: string[]) {
  if (!ids.length) return;
  if (isDatabaseConfigured()) {
    const db = await galleryDb();
    await db.delete(galleryItems).where(inArray(galleryItems.id, ids));
    return;
  }
  const data = await readLocal();
  const drop = new Set(ids);
  data.items = data.items.filter((item) => !drop.has(item.id));
  await writeLocal(data);
}

/**
 * The Family Tree album, built from portraits and headstone photos on the tree.
 * It is never stored, so it always matches the people records and their visibility settings.
 */
export function treeAlbumItems(snapshot: FamilySnapshot): (GalleryItem & { personId: string })[] {
  const items: (GalleryItem & { personId: string })[] = [];
  for (const person of snapshot.people) {
    const vis = personVisibility(person);
    const name = displayName(person);
    const base = {
      albumId: TREE_ALBUM_ID,
      kind: "photo" as const,
      thumbUrl: null,
      contentType: "image/jpeg",
      width: null,
      height: null,
      durationSeconds: null,
      takenDate: null,
      uploaderUserId: null,
      uploaderName: "Family tree",
      createdAt: new Date(0).toISOString(),
      personId: person.id,
    };
    if (vis.showPhoto && person.photoUrl) {
      items.push({
        ...base,
        id: `tree-portrait-${person.id}`,
        url: person.photoUrl,
        displayUrl: person.photoUrl,
        thumbUrl: person.photoUrl,
        caption: name,
      });
    }
    if (vis.showHeadstone && person.headstonePhotoUrl) {
      items.push({
        ...base,
        id: `tree-headstone-${person.id}`,
        url: person.headstonePhotoUrl,
        displayUrl: person.headstonePhotoUrl,
        thumbUrl: person.headstonePhotoUrl,
        caption: `${name} · headstone`,
      });
    }
  }
  return items;
}

/**
 * Items as sent to the browser on public pages. A photo's original keeps its EXIF
 * (including GPS location), so only the stripped display copy is ever exposed.
 */
export function publicGalleryItems<T extends GalleryItem>(items: T[]): T[] {
  return items.map((item) => (item.kind === "photo" ? { ...item, url: item.displayUrl } : item));
}
