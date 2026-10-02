import Link from "next/link";

const linkClass =
  "inline-flex min-h-11 items-center rounded-full px-3 text-sm text-bark transition hover:bg-gold/40";
const activeClass =
  "inline-flex min-h-11 items-center rounded-full bg-script px-3 text-sm text-white";

/** Small top bar shared by the gallery and upload pages. */
export function GalleryHeader({ active }: { active: "gallery" | "upload" }) {
  return (
    <header className="pt-[env(safe-area-inset-top)]">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-1 px-4 pt-4 sm:justify-start">
        <Link href="/" className={linkClass}>
          Family tree
        </Link>
        <Link href="/gallery" className={active === "gallery" ? activeClass : linkClass}>
          Gallery
        </Link>
        <Link href="/upload" className={active === "upload" ? activeClass : linkClass}>
          Upload
        </Link>
      </nav>
    </header>
  );
}
