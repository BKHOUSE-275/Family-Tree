"use client";

import { useState, type ReactNode } from "react";

/** A lazy thumbnail that swaps to the fallback if the file can't be loaded. */
export function ThumbImage({ src, alt, fallback }: { src: string; alt: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      // The image can fail before hydration attaches onError, so check once on mount too.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
      className="h-full w-full object-cover"
    />
  );
}
