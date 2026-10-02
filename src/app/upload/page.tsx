import type { Metadata } from "next";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { UploadForm } from "@/components/gallery/UploadForm";
import { getAppUser } from "@/lib/auth";
import { isBlobConfigured } from "@/lib/gallery-files";
import { listAlbumSummaries } from "@/lib/gallery-store";
import { formatFamilyDate } from "@/lib/types";

export const metadata: Metadata = {
  title: "Upload · The Story of Felix and Adaline Mitchell",
  description: "Share family photos and videos with the gallery.",
};

export default async function UploadPage({ searchParams }: PageProps<"/upload">) {
  const [albums, user, params] = await Promise.all([listAlbumSummaries(), getAppUser(), searchParams]);
  const requested = typeof params.album === "string" ? params.album : null;
  const defaultAlbumId = albums.some((album) => album.id === requested) ? requested : null;
  const defaultName = user?.name && !user.name.includes("@") ? user.name : "";

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#f7e0c4]">
      <GalleryHeader active="upload" />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
        <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
          Share your photos
        </h1>
        <p className="mx-auto mt-2 mb-8 max-w-xl text-center text-black/65">
          Add photos and videos to a family album. They appear in the gallery for everyone right
          away, so please only share what the family would be glad to see.
        </p>
        <UploadForm
          albums={albums.map((album) => ({
            id: album.id,
            title: album.title,
            detail: [
              album.eventDate ? formatFamilyDate(album.eventDate) : null,
              album.itemCount === 1 ? "1 item" : `${album.itemCount} items`,
            ]
              .filter(Boolean)
              .join(" · "),
            thumbs: album.collageThumbUrls,
          }))}
          defaultAlbumId={defaultAlbumId}
          defaultName={defaultName}
          useBlob={isBlobConfigured()}
        />
      </div>
    </main>
  );
}
