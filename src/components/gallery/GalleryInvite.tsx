import Link from "next/link";

/** Closing section on the home page that points family to the gallery. */
export function GalleryInvite() {
  return (
    <section id="gallery" className="scroll-mt-6 px-3 pb-16 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-bark/10 bg-white/90 px-4 py-8 text-center shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)] sm:px-8">
        <h2 className="px-1 font-[family-name:var(--font-script)] text-3xl break-words text-script sm:text-4xl md:text-5xl">
          Family Gallery
        </h2>
        <p className="mx-auto mt-2 max-w-md text-bark/75">
          Browse photos and videos from reunions, holidays, and everyday life, or add your own.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/gallery"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-script px-6 py-2 text-white transition hover:bg-gold hover:text-bark"
          >
            View the gallery
          </Link>
          <Link
            href="/upload"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ember px-6 py-2 text-white transition hover:bg-gold hover:text-bark"
          >
            Share your photos
          </Link>
        </div>
      </div>
    </section>
  );
}
