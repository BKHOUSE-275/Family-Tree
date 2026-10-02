import { ThumbImage } from "@/components/gallery/ThumbImage";
import type { GalleryItem } from "@/lib/types";

export function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Square tile for a photo or video. Videos get a play badge and their length. */
export function MediaThumb({
  item,
  className = "",
}: {
  item: Pick<GalleryItem, "kind" | "thumbUrl" | "caption" | "durationSeconds">;
  className?: string;
}) {
  const duration = item.kind === "video" ? formatDuration(item.durationSeconds) : null;
  const placeholder = (
    <div className="flex h-full w-full items-center justify-center text-sm text-bark/60">
      {item.kind === "video" ? "Video" : "Photo"}
    </div>
  );
  return (
    <div className={`relative aspect-square overflow-hidden bg-leaf-soft ${className}`}>
      {item.thumbUrl ? (
        <ThumbImage
          src={item.thumbUrl}
          alt={item.caption ?? (item.kind === "video" ? "Family video" : "Family photo")}
          fallback={placeholder}
        />
      ) : (
        placeholder
      )}
      {item.kind === "video" ? (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-xs text-white">
          <svg aria-hidden="true" viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-current">
            <path d="M3 1.5v9l7.5-4.5z" />
          </svg>
          {duration ?? "Video"}
        </span>
      ) : null}
    </div>
  );
}
