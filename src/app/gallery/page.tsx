import type { Metadata } from "next";
import Link from "next/link";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { AlbumCover } from "@/components/gallery/AlbumCover";
import { listAlbumSummaries, treeAlbumItems } from "@/lib/gallery-store";
import { getSnapshot } from "@/lib/store";
import { TREE_ALBUM_ID, formatFamilyDate, withoutSlotDemo } from "@/lib/types";

export const metadata: Metadata = {
  title: "Gallery · The Story of Felix and Adaline Mitchell",
  description: "Family photos and videos, shared by everyone.",
};

type Card = {
  id: string;
  title: string;
  subtitle: string;
  thumbs: string[];
};

function countLabel(count: number) {
  return count === 1 ? "1 item" : `${count} items`;
}

export default async function GalleryPage() {
  const [albums, snapshot] = await Promise.all([listAlbumSummaries(), getSnapshot()]);
  const treeItems = treeAlbumItems(withoutSlotDemo(snapshot));

  const cards: Card[] = [
    {
      id: TREE_ALBUM_ID,
      title: "Family Tree",
      subtitle: `Portraits and headstones · ${countLabel(treeItems.length)}`,
      thumbs: treeItems.flatMap((item) => (item.thumbUrl ? [item.thumbUrl] : [])).slice(0, 4),
    },
    ...albums.map((album) => ({
      id: album.id,
      title: album.title,
      subtitle: [album.eventDate ? formatFamilyDate(album.eventDate) : null, countLabel(album.itemCount)]
        .filter(Boolean)
        .join(" · "),
      thumbs: album.collageThumbUrls,
    })),
  ];

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#f7e0c4]">
      <GalleryHeader active="gallery" />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
          Family Gallery
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
          Photos and videos from reunions, holidays, and everyday life, shared by the family.
        </p>
        <p className="mt-4 text-center">
          <Link
            href="/upload"
            className="inline-flex min-h-11 items-center rounded-full bg-ember px-6 py-2 text-white transition hover:bg-gold hover:text-bark"
          >
            Share your photos
          </Link>
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/gallery/${card.id}`}
                className="group block overflow-hidden rounded-3xl bg-white shadow transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <AlbumCover thumbs={card.thumbs} title={card.title} className="transition group-hover:opacity-90" />
                <div className="p-3 sm:p-4">
                  <p className="font-[family-name:var(--font-display)] text-lg leading-tight break-words sm:text-xl">
                    {card.title}
                  </p>
                  <p className="mt-1 text-xs text-black/55 sm:text-sm">{card.subtitle}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {!albums.length ? (
          <p className="mt-8 text-center text-sm text-black/55">
            More albums are coming soon. The committee will add events for everyone to share in.
          </p>
        ) : null}
      </div>
    </main>
  );
}
