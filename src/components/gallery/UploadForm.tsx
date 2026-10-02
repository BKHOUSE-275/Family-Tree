"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { saveGalleryUploadsAction, type GalleryUploadInput } from "@/app/actions/gallery";
import { AlbumPicker, type AlbumOption } from "@/components/gallery/AlbumPicker";
import { mediaTypeOf, prepareGalleryPhoto, readVideoDetails } from "@/lib/gallery-client";
import {
  GALLERY_MAX_CAPTION,
  GALLERY_MAX_ITEMS_PER_UPLOAD,
  GALLERY_MAX_NAME,
  GALLERY_PATHS,
  formatBytes,
  galleryKindForType,
  galleryMaxBytes,
  safeGalleryFileName,
} from "@/lib/gallery-media";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-bark/20 bg-white px-3 py-2 text-base transition hover:border-gold focus:border-gold focus:ring-2 focus:ring-gold/60 focus:outline-none";
const inputClass =
  "min-h-11 w-full rounded-xl border border-bark/20 bg-white px-3 py-2 text-base transition hover:border-gold focus:border-gold focus:ring-2 focus:ring-gold/60 focus:outline-none";
const labelClass = "block text-sm font-semibold text-script";
const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.mp4,.m4v,.mov,.webm";

type Status = "ready" | "uploading" | "done" | "error";

type Entry = {
  key: string;
  file: File;
  kind: "photo" | "video";
  previewUrl: string | null;
  caption: string;
  takenDate: string;
  status: Status;
  progress: number;
  error: string | null;
};

type Uploaded = GalleryUploadInput["items"][number];

function RequiredMark() {
  return (
    <span className="text-ember" aria-hidden="true">
      *
    </span>
  );
}

async function sendFile(
  file: Blob,
  name: string,
  contentType: string,
  target: "original" | "poster",
  albumId: string,
  kind: "photo" | "video",
  useBlob: boolean,
  onProgress?: (percent: number) => void,
) {
  if (useBlob) {
    const prefix = target === "poster" ? GALLERY_PATHS.poster : GALLERY_PATHS.original;
    const result = await upload(`${prefix}${safeGalleryFileName(name, "jpg")}`, file, {
      access: "private",
      handleUploadUrl: "/api/gallery/upload",
      clientPayload: JSON.stringify({ albumId, kind }),
      contentType,
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: onProgress ? ({ percentage }) => onProgress(percentage) : undefined,
    });
    return result.url;
  }

  const form = new FormData();
  form.set("albumId", albumId);
  form.set("target", target);
  form.set("file", new File([file], name, { type: contentType }));
  const response = await fetch("/api/gallery/upload", { method: "POST", body: form });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? "Could not upload this file.");
  onProgress?.(100);
  return data.url;
}

export function UploadForm({
  albums,
  defaultAlbumId,
  defaultName,
  useBlob,
}: {
  albums: AlbumOption[];
  defaultAlbumId: string | null;
  defaultName: string;
  useBlob: boolean;
}) {
  const inputId = useId();
  const albumLabelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [albumId, setAlbumId] = useState(defaultAlbumId ?? albums[0]?.id ?? "");
  const [name, setName] = useState(defaultName);
  const [website, setWebsite] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState<{ saved: number; failed: number; albumId: string } | null>(
    null,
  );

  // Free preview images when entries go away.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Leaving mid-upload on a phone (back swipe, closing the tab) would lose the files.
  useEffect(() => {
    if (!busy) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  function update(key: string, patch: Partial<Entry>) {
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setNotice(null);
    setFinished(null);
    const skipped: string[] = [];
    const next: Entry[] = [];
    for (const file of Array.from(list)) {
      const heic = /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
      const kind = heic ? "photo" : galleryKindForType(mediaTypeOf(file));
      if (!kind) {
        skipped.push(`${file.name} is not a photo or video we can use`);
        continue;
      }
      if (file.size > galleryMaxBytes(kind)) {
        skipped.push(`${file.name} is over ${formatBytes(galleryMaxBytes(kind))}`);
        continue;
      }
      const previewUrl = kind === "photo" && !heic ? URL.createObjectURL(file) : null;
      if (previewUrl) previews.current.add(previewUrl);
      next.push({
        key: crypto.randomUUID(),
        file,
        kind,
        previewUrl,
        caption: "",
        takenDate: "",
        status: "ready",
        progress: 0,
        error: null,
      });
    }
    setEntries((current) => {
      const room = GALLERY_MAX_ITEMS_PER_UPLOAD - current.length;
      if (next.length > room) {
        skipped.push(`Only ${GALLERY_MAX_ITEMS_PER_UPLOAD} files at a time; the rest were left out`);
      }
      return [...current, ...next.slice(0, Math.max(0, room))];
    });
    if (skipped.length) setNotice(skipped.join(". ") + ".");
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeEntry(key: string) {
    setEntries((current) => {
      const entry = current.find((item) => item.key === key);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  }

  async function uploadEntry(entry: Entry): Promise<Uploaded | null> {
    update(entry.key, { status: "uploading", progress: 0, error: null });
    try {
      if (entry.kind === "photo") {
        const file = await prepareGalleryPhoto(entry.file);
        const url = await sendFile(file, file.name, mediaTypeOf(file), "original", albumId, "photo", useBlob, (p) =>
          update(entry.key, { progress: p }),
        );
        update(entry.key, { status: "done", progress: 100 });
        return { url, caption: entry.caption, takenDate: entry.takenDate };
      }

      const details = await readVideoDetails(entry.file);
      const url = await sendFile(
        entry.file,
        entry.file.name,
        mediaTypeOf(entry.file),
        "original",
        albumId,
        "video",
        useBlob,
        (p) => update(entry.key, { progress: Math.min(99, p) }),
      );
      let posterUrl: string | null = null;
      if (details.poster) {
        posterUrl = await sendFile(details.poster, "poster.jpg", "image/jpeg", "poster", albumId, "video", useBlob).catch(
          () => null,
        );
      }
      update(entry.key, { status: "done", progress: 100 });
      return {
        url,
        posterUrl,
        caption: entry.caption,
        takenDate: entry.takenDate,
        width: details.width,
        height: details.height,
        durationSeconds: details.durationSeconds,
      };
    } catch (error) {
      update(entry.key, {
        status: "error",
        error: error instanceof Error ? error.message : "Could not upload this file.",
      });
      return null;
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const pending = entries.filter((entry) => entry.status !== "done");
    if (!albumId) return setNotice("Choose an album first.");
    if (!name.trim()) return setNotice("Please add your name so the family knows who shared these.");
    if (!pending.length) return setNotice("Choose at least one photo or video.");

    setBusy(true);
    setNotice(null);
    try {
      // Two at a time keeps phones responsive on slow connections.
      const uploaded: Uploaded[] = [];
      const queue = [...pending];
      await Promise.all(
        [0, 1].map(async () => {
          for (let entry = queue.shift(); entry; entry = queue.shift()) {
            const result = await uploadEntry(entry);
            if (result) uploaded.push(result);
          }
        }),
      );
      if (!uploaded.length) {
        setNotice("Nothing was uploaded. Check the files marked below and try again.");
        return;
      }

      const result = await saveGalleryUploadsAction({ albumId, uploaderName: name, website, items: uploaded });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setFinished({ saved: result.saved, failed: result.failed, albumId });
      setEntries((current) => current.filter((entry) => entry.status === "error"));
    } catch {
      setNotice("Something went wrong while saving. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!albums.length) {
    return (
      <p className="rounded-3xl bg-white p-6 text-center text-black/65 shadow">
        There are no albums to upload to yet. The committee will add albums and events soon.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl bg-white p-4 shadow sm:p-6">
      {finished ? (
        <div className="rounded-2xl bg-leaf-soft px-4 py-3 text-leaf-deep" role="status">
          <p className="font-semibold">
            Thank you! {finished.saved} {finished.saved === 1 ? "item was" : "items were"} added.
          </p>
          {finished.failed ? (
            <p className="text-sm">{finished.failed} could not be saved.</p>
          ) : null}
          <p className="mt-1 text-sm">
            <Link href={`/gallery/${finished.albumId}`} className="underline hover:text-ember">
              See the album
            </Link>{" "}
            or choose more files below.
          </p>
        </div>
      ) : null}

      <div>
        <span id={albumLabelId} className={labelClass}>
          Album <RequiredMark />
        </span>
        <AlbumPicker
          albums={albums}
          value={albumId}
          onChange={setAlbumId}
          disabled={busy}
          labelId={albumLabelId}
        />
      </div>

      <label className={labelClass}>
        Your name <RequiredMark />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={GALLERY_MAX_NAME}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          disabled={busy}
          className={fieldClass}
          placeholder="Shown with your photos"
        />
      </label>

      {/* Hidden from people; simple bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div>
        <label
          htmlFor={inputId}
          className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-bark/25 bg-page px-4 py-6 text-center transition hover:border-gold hover:bg-gold/15"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!busy) addFiles(event.dataTransfer.files);
          }}
        >
          <span className="font-[family-name:var(--font-display)] text-xl text-bark">
            <span className="sm:hidden">Tap to choose photos or videos</span>
            <span className="hidden sm:inline">Choose or drop photos and videos</span>
          </span>
          <span className="mt-1 text-sm text-black/55">
            Up to {GALLERY_MAX_ITEMS_PER_UPLOAD} at a time · photos up to {formatBytes(galleryMaxBytes("photo"))}, videos up to{" "}
            {formatBytes(galleryMaxBytes("video"))}
          </span>
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT}
          disabled={busy}
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {notice ? (
        <p className="rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember" role="alert">
          {notice}
        </p>
      ) : null}

      {entries.length ? (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.key} className="flex gap-3 rounded-2xl bg-page p-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-leaf-soft text-xs text-bark/60">
                {entry.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{entry.kind === "video" ? "Video" : "Photo"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm text-black/60">
                    {entry.file.name} · {formatBytes(entry.file.size)}
                  </p>
                  {entry.status === "ready" || entry.status === "error" ? (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.key)}
                      disabled={busy}
                      className="-mt-3 -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm text-bark/60 hover:text-ember"
                      aria-label={`Remove ${entry.file.name}`}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  value={entry.caption}
                  onChange={(event) => update(entry.key, { caption: event.target.value })}
                  maxLength={GALLERY_MAX_CAPTION}
                  disabled={busy || entry.status === "done"}
                  placeholder="Caption: who, where, what was happening (optional)"
                  aria-label={`Caption for ${entry.file.name}`}
                  autoCapitalize="sentences"
                  enterKeyHint="next"
                  className={inputClass}
                />
                <input
                  value={entry.takenDate}
                  onChange={(event) => update(entry.key, { takenDate: event.target.value })}
                  maxLength={40}
                  disabled={busy || entry.status === "done"}
                  placeholder="When was it taken? e.g. Summer 1975 (optional)"
                  aria-label={`Date for ${entry.file.name}`}
                  enterKeyHint="done"
                  className={inputClass}
                />
                {entry.status === "uploading" ? (
                  <div className="h-2 overflow-hidden rounded-full bg-black/10" aria-label="Upload progress">
                    <div className="h-full bg-leaf transition-all" style={{ width: `${Math.max(4, entry.progress)}%` }} />
                  </div>
                ) : null}
                {entry.status === "error" ? <p className="text-sm text-ember">{entry.error}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="submit"
        disabled={busy || !entries.length}
        className="min-h-11 w-full rounded-full bg-ember px-6 py-2 text-white transition hover:bg-gold hover:text-bark disabled:cursor-default disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Uploading…" : `Upload ${entries.length || ""} ${entries.length === 1 ? "file" : "files"}`.replace("  ", " ")}
      </button>
    </form>
  );
}
