import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteAlbumAction,
  moveAlbumAction,
  removeGalleryItemAction,
  saveAlbumAction,
  setAlbumCoverAction,
} from "@/app/actions/gallery";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { DeskLink, deskButtonClass, deskButtonCompactClass } from "@/components/admin/DeskLink";
import { MediaThumb } from "@/components/gallery/MediaThumb";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { formatEasternDateTime } from "@/lib/datetime";
import { listAlbumSummaries, listRecentItems, treeAlbumItems } from "@/lib/gallery-store";
import { getSnapshot } from "@/lib/store";
import { formatFamilyDate, isCommittee, withoutSlotDemo, type Album } from "@/lib/types";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-bark/20 bg-leaf-soft px-3 py-2 text-base";
const labelClass = "block text-sm font-semibold text-script";

function AlbumFields({ album }: { album?: Album }) {
  return (
    <>
      {album ? <input type="hidden" name="id" value={album.id} /> : null}
      <label className={labelClass}>
        Title
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={album?.title}
          placeholder="Mitchell Family Reunion 2026"
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Event date <span className="font-normal text-black/50">(optional)</span>
        <input
          name="eventDate"
          maxLength={40}
          defaultValue={album?.eventDate ?? ""}
          placeholder="July 4, 2026 or Summer 1985"
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Description <span className="font-normal text-black/50">(optional)</span>
        <textarea
          name="description"
          rows={2}
          maxLength={1000}
          defaultValue={album?.description ?? ""}
          className={`${fieldClass} min-h-20`}
        />
      </label>
    </>
  );
}

export default async function AdminGalleryPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/gallery");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "gallery.manage")) redirect("/admin");

  const [albums, recent, snapshot] = await Promise.all([
    listAlbumSummaries(),
    listRecentItems(48),
    getSnapshot(),
  ]);
  const treeCount = treeAlbumItems(withoutSlotDemo(snapshot)).length;
  const albumTitles = new Map(albums.map((album) => [album.id, album.title]));
  const covers = new Set(albums.map((album) => album.coverItemId).filter(Boolean));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
      <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-3xl break-words text-script sm:text-4xl md:text-5xl">
        Gallery
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Make albums and events for family to share photos and videos in, and remove anything that
        does not belong.
      </p>
      <div className="mt-4 flex justify-center">
        <DeskLink href="/gallery">Open the gallery</DeskLink>
      </div>

      <section className="mt-10 rounded-3xl bg-white p-4 shadow sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">New album or event</h2>
        <form action={saveAlbumAction} className="mt-4 space-y-3">
          <AlbumFields />
          <button className="min-h-11 rounded-full bg-ember px-6 py-2 text-white transition hover:bg-gold hover:text-bark">
            Create album
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-4 shadow sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Albums</h2>
        <p className="mt-1 text-sm text-black/60">
          Shown in this order on the gallery. The Family Tree album always comes first.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-4 rounded-2xl bg-page px-4 py-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-leaf text-xs text-white">
              Tree
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-display)] text-xl">Family Tree</p>
              <p className="text-sm text-black/55">
                {treeCount} portrait and headstone photo{treeCount === 1 ? "" : "s"} · managed on
                each person&apos;s page
              </p>
            </div>
          </li>
          {albums.map((album, index) => (
            <li key={album.id} className="rounded-2xl bg-page px-4 py-3">
              <div className="flex flex-wrap items-center gap-4">
                <MediaThumb
                  item={{ kind: "photo", thumbUrl: album.coverThumbUrl, caption: album.title, durationSeconds: null }}
                  className="h-16 w-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-display)] text-xl break-words">
                    {album.title}
                  </p>
                  <p className="text-sm text-black/55">
                    {album.itemCount} item{album.itemCount === 1 ? "" : "s"}
                    {album.eventDate ? ` · ${formatFamilyDate(album.eventDate)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={moveAlbumAction} className="flex gap-1">
                    <input type="hidden" name="id" value={album.id} />
                    <button
                      name="direction"
                      value="up"
                      disabled={index === 0}
                      aria-label={`Move ${album.title} up`}
                      className={`${deskButtonCompactClass} disabled:cursor-default disabled:opacity-40`}
                    >
                      ↑
                    </button>
                    <button
                      name="direction"
                      value="down"
                      disabled={index === albums.length - 1}
                      aria-label={`Move ${album.title} down`}
                      className={`${deskButtonCompactClass} disabled:cursor-default disabled:opacity-40`}
                    >
                      ↓
                    </button>
                  </form>
                  <DeskLink href={`/gallery/${album.id}`} compact>
                    View
                  </DeskLink>
                  <form action={deleteAlbumAction}>
                    <input type="hidden" name="id" value={album.id} />
                    <ConfirmSubmitButton
                      title="Delete album"
                      message={`Delete “${album.title}” and all ${album.itemCount} photos and videos in it? This cannot be undone.`}
                      confirmLabel="Delete album"
                      className={deskButtonCompactClass}
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-script">Edit details</summary>
                <form action={saveAlbumAction} className="mt-3 space-y-3">
                  <AlbumFields album={album} />
                  <button className={deskButtonClass}>Save changes</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
        {!albums.length ? (
          <p className="mt-4 text-sm text-black/55">
            No albums yet. Create one above so family can start uploading.
          </p>
        ) : null}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-4 shadow sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Recent uploads</h2>
        <p className="mt-1 text-sm text-black/60">
          Uploads appear on the gallery right away. Remove anything that does not belong.
        </p>
        {recent.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {recent.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-2xl bg-page">
                <a href={item.displayUrl} target="_blank" rel="noreferrer" className="block">
                  <MediaThumb item={item} />
                </a>
                <div className="space-y-1 p-3 text-xs text-black/60">
                  {item.caption ? (
                    <p className="line-clamp-2 text-sm text-ink">{item.caption}</p>
                  ) : null}
                  <p className="break-words">
                    {item.uploaderName}
                    {item.uploaderUserId ? "" : " (guest)"} ·{" "}
                    <Link href={`/gallery/${item.albumId}`} className="underline hover:text-ember">
                      {albumTitles.get(item.albumId) ?? "Album"}
                    </Link>
                  </p>
                  <p>{formatEasternDateTime(item.createdAt)}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.thumbUrl && !covers.has(item.id) ? (
                      <form action={setAlbumCoverAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button className={deskButtonCompactClass}>Use as cover</button>
                      </form>
                    ) : null}
                    <form action={removeGalleryItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmSubmitButton
                        title={`Remove ${item.kind}`}
                        message={`Remove this ${item.kind} from the gallery? The file is deleted and cannot be recovered.`}
                        confirmLabel="Remove"
                        className={deskButtonCompactClass}
                      >
                        Remove
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-black/55">Nothing has been uploaded yet.</p>
        )}
      </section>
    </main>
  );
}
