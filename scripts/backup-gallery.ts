// Downloads every file in the Blob store, plus the albums, gallery items, and
// tree photo links from the database, into backups/. Safe to re-run: files that
// were already downloaded are skipped.
//
//   npm run gallery:backup                   back up everything
//   npm run gallery:backup -- --prune-orphans  also delete gallery uploads that were never saved
//                                              to an album (older than one day)

import { config } from "dotenv";
import { createWriteStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { del, get, list } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const token = process.env.BLOB_READ_WRITE_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
const pruneOrphans = process.argv.includes("--prune-orphans");
const root = path.join(process.cwd(), "backups");
const filesDir = path.join(root, "files");

async function exists(file: string, size: number) {
  try {
    return (await stat(file)).size === size;
  } catch {
    return false;
  }
}

async function exportDatabase() {
  if (!databaseUrl) {
    console.log("DATABASE_URL is not set. Skipping the database export.");
    return null;
  }
  const sql = neon(databaseUrl);
  const [albums, items, people] = await Promise.all([
    sql`SELECT * FROM albums ORDER BY sort_order, created_at`,
    sql`SELECT * FROM gallery_items ORDER BY created_at`,
    sql`SELECT id, given_name, surname, photo_url, headstone_photo_url FROM people`,
  ]);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(root, `gallery-${stamp}.json`);
  await writeFile(file, JSON.stringify({ exportedAt: new Date().toISOString(), albums, items, people }, null, 2));
  console.log(`Saved ${albums.length} albums, ${items.length} gallery items, ${people.length} people → ${file}`);
  return { items, people };
}

/** Every blob URL the site still points at. */
function referencedBlobs(data: { items: Record<string, unknown>[]; people: Record<string, unknown>[] }) {
  const urls = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value !== "string" || !value) return;
    const src = value.startsWith("/api/photos?")
      ? new URLSearchParams(value.slice("/api/photos?".length)).get("src")
      : value;
    if (src) urls.add(src);
  };
  for (const item of data.items) {
    add(item.url);
    add(item.display_url);
    add(item.thumb_url);
  }
  for (const person of data.people) {
    add(person.photo_url);
    add(person.headstone_photo_url);
  }
  return urls;
}

async function main() {
  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN is not set. Add it to .env.local first.");
    process.exit(1);
  }
  await mkdir(filesDir, { recursive: true });
  // If the database can't be read, still back up the files, but skip orphan
  // detection: without the item list every gallery file would look orphaned.
  const data = await exportDatabase().catch((error) => {
    console.error("Could not export the database; orphan check is off for this run.", error);
    return null;
  });
  if (!data && pruneOrphans) {
    console.error("Refusing to prune without a database export.");
    process.exit(1);
  }

  let cursor: string | undefined;
  let downloaded = 0;
  let skipped = 0;
  let bytes = 0;
  const orphans: { url: string; pathname: string }[] = [];
  const referenced = data ? referencedBlobs(data) : null;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  do {
    const page = await list({ token, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const target = path.join(filesDir, ...blob.pathname.split("/"));
      if (
        referenced &&
        blob.pathname.startsWith("gallery/") &&
        !referenced.has(blob.url) &&
        new Date(blob.uploadedAt).getTime() < dayAgo
      ) {
        orphans.push({ url: blob.url, pathname: blob.pathname });
      }
      if (await exists(target, blob.size)) {
        skipped += 1;
        continue;
      }
      const result = await get(blob.url, { access: "private", token });
      if (result?.statusCode !== 200 || !result.stream) {
        console.warn(`Could not download ${blob.pathname}`);
        continue;
      }
      await mkdir(path.dirname(target), { recursive: true });
      await pipeline(
        Readable.fromWeb(result.stream as unknown as WebReadableStream),
        createWriteStream(target),
      );
      downloaded += 1;
      bytes += blob.size;
      if (downloaded % 25 === 0) console.log(`  ${downloaded} files downloaded…`);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  console.log(
    `Downloaded ${downloaded} new files (${Math.round(bytes / 1024 / 1024)} MB), ${skipped} already backed up → ${filesDir}`,
  );

  if (orphans.length) {
    console.log(`${orphans.length} gallery uploads are not in any album:`);
    for (const orphan of orphans.slice(0, 20)) console.log(`  ${orphan.pathname}`);
    if (pruneOrphans) {
      await del(orphans.map((orphan) => orphan.url), { token });
      console.log(`Deleted ${orphans.length} orphaned uploads (they are still in the backup).`);
    } else {
      console.log("Run with --prune-orphans to delete them.");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
