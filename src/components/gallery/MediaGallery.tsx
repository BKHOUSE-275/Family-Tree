"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { removeGalleryItemAction } from "@/app/actions/gallery";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { MediaThumb } from "@/components/gallery/MediaThumb";
import { formatFamilyDate, type GalleryItem } from "@/lib/types";

const controlClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 px-3 text-white transition hover:bg-gold hover:text-bark";

function Lightbox({
  items,
  index,
  canManage,
  onClose,
  onMove,
}: {
  items: GalleryItem[];
  index: number;
  canManage: boolean;
  onClose: () => void;
  onMove: (delta: number) => void;
}) {
  const item = items[index];
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onMove(1);
      if (event.key === "ArrowLeft") onMove(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onMove]);

  if (!item) return null;
  const isTree = item.id.startsWith("tree-");
  const details = [
    item.takenDate ? formatFamilyDate(item.takenDate) : null,
    isTree ? null : `Shared by ${item.uploaderName}`,
  ].filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? "Photo"}
      className="fixed inset-0 z-50 flex flex-col bg-black/92 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onTouchStart={(event) => {
        // Ignore pinch-zoom and drags on the video's own controls.
        const touch = event.touches[0];
        const onVideo = (event.target as HTMLElement).closest("video");
        touchStart.current =
          touch && event.touches.length === 1 && !onVideo ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchMove={(event) => {
        if (event.touches.length > 1) touchStart.current = null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0];
        touchStart.current = null;
        if (!start || !end || (window.visualViewport?.scale ?? 1) > 1) return;
        const dx = end.clientX - start.x;
        const dy = end.clientY - start.y;
        // A clear downward swipe closes the viewer, like most phone photo apps.
        if (dy > 80 && dy > Math.abs(dx) * 1.5) return onClose();
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        onMove(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-white/75">
        <span>
          {index + 1} of {items.length}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={item.kind === "video" ? item.url : item.displayUrl}
            download
            className={controlClass}
          >
            Download
          </a>
          <button ref={closeRef} type="button" onClick={onClose} className={controlClass} aria-label="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {item.kind === "video" ? (
          <video
            key={item.id}
            src={item.displayUrl}
            poster={item.thumbUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="max-h-full max-w-full rounded-lg"
          />
        ) : failed.has(item.id) ? (
          <p className="px-6 text-center text-white/70">This photo can&apos;t be shown right now.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={item.displayUrl}
            alt={item.caption ?? "Family photo"}
            onError={() => setFailed((current) => new Set(current).add(item.id))}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onMove(-1)}
              className={`${controlClass} absolute left-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex`}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              className={`${controlClass} absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex`}
              aria-label="Next"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-3 text-center text-white">
        {items.length > 1 ? (
          <div className="mb-2 flex items-center justify-center gap-6 sm:hidden">
            <button type="button" onClick={() => onMove(-1)} className={controlClass}>
              ‹ Previous
            </button>
            <button type="button" onClick={() => onMove(1)} className={controlClass}>
              Next ›
            </button>
          </div>
        ) : null}
        {item.caption ? <p className="text-base break-words">{item.caption}</p> : null}
        {details.length ? <p className="mt-1 text-sm text-white/60">{details.join(" · ")}</p> : null}
        {canManage && !isTree ? (
          <form action={removeGalleryItemAction} className="mt-2">
            <input type="hidden" name="id" value={item.id} />
            <ConfirmSubmitButton
              title={`Remove ${item.kind}`}
              message={`Remove this ${item.kind} from the gallery? The file is deleted and cannot be recovered.`}
              confirmLabel="Remove"
              className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-4 text-sm text-white/80 transition hover:border-ember hover:bg-ember hover:text-white"
            >
              Remove (committee)
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}

/** Grid of an album's photos and videos that opens a full-screen viewer. */
export function MediaGallery({ items, canManage }: { items: GalleryItem[]; canManage: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (delta: number) =>
      setOpen((current) => (current == null ? current : (current + delta + items.length) % items.length)),
    [items.length],
  );

  // If the last item is removed while open, the viewer simply closes.
  const shown = open != null && open < items.length ? open : null;

  return (
    <>
      <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 md:grid-cols-5">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="block w-full overflow-hidden rounded-md transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:rounded-xl"
              aria-label={`Open ${item.caption ?? (item.kind === "video" ? "video" : "photo")}`}
            >
              <MediaThumb item={item} />
            </button>
          </li>
        ))}
      </ul>
      {shown != null ? (
        <Lightbox items={items} index={shown} canManage={canManage} onClose={close} onMove={move} />
      ) : null}
    </>
  );
}
