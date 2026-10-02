import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { MediaGallery } from "@/components/gallery/MediaGallery";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { getAlbum, listAlbumItems, publicGalleryItems, treeAlbumItems } from "@/lib/gallery-store";
import { getSnapshot } from "@/lib/store";
import { TREE_ALBUM_ID, formatFamilyDate, withoutSlotDemo, type GalleryItem } from "@/lib/types";

async function loadAlbum(albumId: string) {
  if (albumId === TREE_ALBUM_ID) {
    const items: GalleryItem[] = treeAlbumItems(withoutSlotDemo(await getSnapshot()));
    return {
      title: "Family Tree",
      description: "Portraits and headstones from the family tree. These are managed on each person's page.",
      eventDate: null,
      items,
      canUpload: false,
    };
  }
  const album = await getAlbum(albumId);
  if (!album) return null;
  return {
    title: album.title,
    description: album.description,
    eventDate: album.eventDate,
    items: await listAlbumItems(album.id),
    canUpload: true,
  };
}

export async function generateMetadata({ params }: PageProps<"/gallery/[albumId]">): Promise<Metadata> {
  const { albumId } = await params;
  const album = albumId === TREE_ALBUM_ID ? { title: "Family Tree" } : await getAlbum(albumId);
  return { title: `${album?.title ?? "Album"} · Family Gallery` };
}

export default async function AlbumPage({ params }: PageProps<"/gallery/[albumId]">) {
  const { albumId } = await params;
  const [album, user] = await Promise.all([loadAlbum(albumId), getAppUser()]);
  if (!album) notFound();
  const canManage = Boolean(user && userHasPermission(user, "gallery.manage"));

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#f7e0c4]">
      <GalleryHeader active="gallery" />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <p className="text-center text-sm">
          <Link href="/gallery" className="inline-flex min-h-11 items-center text-script hover:text-ember">
            ‹ All albums
          </Link>
        </p>
        <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-4xl break-words text-script sm:text-5xl">
          {album.title}
        </h1>
        {album.eventDate ? (
          <p className="mt-1 text-center font-[family-name:var(--font-display)] text-xl text-ember">
            {formatFamilyDate(album.eventDate)}
          </p>
        ) : null}
        {album.description ? (
          <p className="mx-auto mt-2 max-w-xl text-center whitespace-pre-line text-black/65">
            {album.description}
          </p>
        ) : null}
        {album.canUpload ? (
          <p className="mt-4 text-center">
            <Link
              href={`/upload?album=${encodeURIComponent(albumId)}`}
              className="inline-flex min-h-11 items-center rounded-full bg-ember px-6 py-2 text-white transition hover:bg-gold hover:text-bark"
            >
              Add photos to this album
            </Link>
          </p>
        ) : null}

        <div className="mt-8">
          {album.items.length ? (
            <MediaGallery items={publicGalleryItems(album.items)} canManage={canManage} />
          ) : (
            <p className="rounded-3xl bg-white p-6 text-center text-black/60 shadow">
              No photos yet.{album.canUpload ? " Be the first to share one!" : ""}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
