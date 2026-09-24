import Link from "next/link";
import { redirect } from "next/navigation";
import { DeskLink } from "@/components/admin/DeskLink";
import { GuestBadge } from "@/components/admin/GuestBadge";
import { PeopleList } from "@/components/admin/PeopleList";
import { buildActivityFeed, reviewerActionLabel } from "@/lib/activity";
import { committeeHomePath, getAppUser, userHasPermission } from "@/lib/auth";
import { formatEasternDateTime } from "@/lib/datetime";
import { getSnapshot, isPlaced } from "@/lib/store";
import { displayName, isCommittee, yearRange } from "@/lib/types";

export default async function AdminPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "people.edit")) {
    redirect(committeeHomePath(user));
  }

  const snapshot = await getSnapshot();
  const peopleRows = snapshot.people.map((person) => ({
    id: person.id,
    name: displayName(person),
    maidenName: person.maidenName,
    years: yearRange(person),
    placed: isPlaced(snapshot, person.id),
    isDeceased: person.isDeceased,
    hasPhoto: Boolean(person.photoUrl),
    hasHeadstone: Boolean(person.headstoneLocation || person.headstonePhotoUrl),
    hasFamilySearch: Boolean(person.familysearchId),
  }));
  const pendingCount = snapshot.changeRequests.filter((row) => row.status === "pending").length;
  const recent = buildActivityFeed(snapshot).slice(0, 5);
  const canEdit = userHasPermission(user, "people.edit");
  const canCreate = userHasPermission(user, "people.create");
  const canDelete = userHasPermission(user, "people.delete");
  const canSeeActivity = userHasPermission(user, "activity.view");
  const canSeeRequests = userHasPermission(user, "requests.review");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-3xl break-words text-script sm:text-left sm:text-4xl md:text-5xl">
            Family admin
          </h1>
          <p className="mt-2 max-w-xl text-black/65">
            Add people, set parents, and mark headstones. Names without a parent
            stay in Unplaced until you attach them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canSeeRequests && pendingCount ? (
            <Link
              href="/admin/requests"
              className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-bark transition hover:bg-ember hover:text-white"
            >
              {pendingCount} pending request{pendingCount === 1 ? "" : "s"}
            </Link>
          ) : null}
          {canCreate ? (
            <Link
              href="/admin/people/new"
              className="inline-flex min-h-11 items-center rounded-full bg-script px-5 py-2 text-white transition hover:bg-gold hover:text-bark"
            >
              Add a person
            </Link>
          ) : null}
        </div>
      </div>

      {canSeeActivity ? (
        <section className="mt-10 rounded-3xl bg-white p-4 shadow sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">Recent activity</h2>
            <DeskLink href="/admin/activity">View all activity</DeskLink>
          </div>
          {recent.length ? (
            <ul className="mt-4 divide-y divide-black/8">
              {recent.map((item) => {
                const reviewer = reviewerActionLabel(item);
                return (
                  <li key={item.id} className="py-3 text-sm">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-black/65">{item.summary}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-black/50">
                      <span>{item.actor}</span>
                      {item.actorIsGuest ? <GuestBadge /> : null}
                      <span>· {formatEasternDateTime(item.createdAt)}</span>
                      {item.href ? (
                        <DeskLink href={item.href} compact>
                          Open
                        </DeskLink>
                      ) : null}
                    </p>
                    {reviewer ? (
                      <p className="mt-0.5 text-xs text-black/50">{reviewer}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-black/55">No activity recorded yet.</p>
          )}
        </section>
      ) : null}

      {canEdit ? <PeopleList people={peopleRows} canDelete={canDelete} /> : null}
    </main>
  );
}
