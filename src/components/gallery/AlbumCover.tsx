import { ThumbImage } from "@/components/gallery/ThumbImage";

const placeholder = (
  <div className="flex h-full w-full items-center justify-center text-sm text-bark/60">Photo</div>
);

function Tile({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`min-h-0 min-w-0 overflow-hidden bg-leaf-soft ${className}`}>
      <ThumbImage src={src} alt={alt} fallback={placeholder} />
    </div>
  );
}

/**
 * Square album cover made from up to four photos:
 * 1 fills the square, 2 split it, 3 are one tall + two stacked, 4 make a 2×2 grid.
 */
export function AlbumCover({
  thumbs,
  title,
  className = "",
}: {
  thumbs: string[];
  title: string;
  className?: string;
}) {
  const shown = thumbs.slice(0, 4);
  const layout =
    shown.length >= 4
      ? "grid-cols-2 grid-rows-2"
      : shown.length === 3
        ? "grid-cols-2 grid-rows-2"
        : shown.length === 2
          ? "grid-cols-2 grid-rows-1"
          : "grid-cols-1 grid-rows-1";

  return (
    <div className={`relative aspect-square overflow-hidden bg-leaf-soft ${className}`}>
      {shown.length ? (
        <div className={`grid h-full w-full gap-0.5 ${layout}`}>
          {shown.map((src, index) => (
            <Tile
              key={`${src}-${index}`}
              src={src}
              alt={index === 0 ? title : ""}
              className={shown.length === 3 && index === 0 ? "row-span-2" : ""}
            />
          ))}
        </div>
      ) : (
        placeholder
      )}
    </div>
  );
}
