import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePersonAction } from "@/app/actions/family";
import { LinkProfileForm } from "@/components/admin/LinkProfileForm";
import { buildActivityFeed } from "@/lib/activity";
import { committeeHomePath, getAppUser, userHasPermission } from "@/lib/auth";
import { getSnapshot, isPlaced } from "@/lib/store";
import { displayName, isCommittee, yearRange } from "@/lib/types";

export default async function AdminPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "people.edit") && !userHasPermission(user, "profiles.link")) {
    redirect(committeeHomePath(user));
  }

  const snapshot = await getSnapshot();
  const unplaced = snapshot.people.filter((person) => !isPlaced(snapshot, person.id));
  const pendingCount = snapshot.changeRequests.filter((row) => row.status === "pending").length;
  const recent = buildActivityFeed(snapshot).slice(0, 8);
  const peopleOptions = snapshot.people.map((person) => ({
    id: person.id,
    label: displayName(person),
  }));
  const canEdit = userHasPermission(user, "people.edit");
  const canCreate = userHasPermission(user, "people.create");
  const canDelete = userHasPermission(user, "people.delete");
  const canLink = userHasPermission(user, "profiles.link");
  const canSeeActivity = userHasPermission(user, "activity.view");
  const canSeeRequests = userHasPermission(user, "requests.review");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-left sm:text-5xl">
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
              className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-bark"
            >
              {pendingCount} pending request{pendingCount === 1 ? "" : "s"}
            </Link>
          ) : null}
          {canCreate ? (
            <Link
              href="/admin/people/new"
              className="inline-flex min-h-11 items-center rounded-full bg-script px-5 py-2 text-white"
            >
              Add a person
            </Link>
          ) : null}
        </div>
      </div>

      {canSeeActivity ? (
        <section className="mt-10 rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">Recent activity</h2>
            <Link href="/admin/activity" className="text-sm text-ember underline-offset-4 hover:underline">
              View all activity
            </Link>
          </div>
          {recent.length ? (
            <ul className="mt-4 divide-y divide-black/8">
              {recent.map((item) => (
                <li key={item.id} className="py-3 text-sm">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-black/65">{item.summary}</p>
                  <p className="mt-1 text-xs text-black/50">
                    {item.actor} · {new Date(item.createdAt).toLocaleString()}
                    {item.href ? (
                      <>
                        {" · "}
                        <Link href={item.href} className="text-ember underline">
                          Open
                        </Link>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-black/55">No activity recorded yet.</p>
          )}
        </section>
      ) : null}

      {canEdit ? (
        <>
          <section className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">Everyone</h2>
            <ul className="mt-4 divide-y divide-black/8 rounded-3xl bg-white shadow">
              {snapshot.people.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link href={`/admin/people/${person.id}`} className="font-semibold hover:text-leaf-deep">
                      {displayName(person)}
                    </Link>
                    {yearRange(person) ? (
                      <p className="text-sm text-black/55">{yearRange(person)}</p>
                    ) : null}
                  </div>
                  {canDelete ? (
                    <form action={deletePersonAction}>
                      <input type="hidden" name="id" value={person.id} />
                      <button className="min-h-11 text-sm text-black/45 hover:text-leaf-deep">Remove</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">Unplaced names</h2>
            <p className="mt-1 text-sm text-black/60">
              From the booklet lists where the parent line is not yet confirmed.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {unplaced.map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/admin/people/${person.id}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-leaf-soft px-3 text-sm text-leaf-deep"
                  >
                    {displayName(person)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {canLink ? (
        <section className="mt-10 rounded-3xl bg-white p-6 shadow">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Link a login to a person</h2>
          <p className="mt-1 text-sm text-black/60">
            After a relative signs in once, they appear here. Choose who they are
            on the tree so they can add phone, email, and address.
          </p>
          {snapshot.profiles.length ? (
            <ul className="mt-4 space-y-3">
              {snapshot.profiles.map((profile) => (
                <li key={profile.userId} className="rounded-2xl bg-page px-4 py-3">
                  <p className="mb-3 text-sm">
                    {profile.email ?? profile.userId}
                    <span className="ml-2 text-xs text-black/45">
                      {profile.role.replace("_", " ")}
                    </span>
                  </p>
                  <LinkProfileForm
                    userId={profile.userId}
                    defaultPersonId={profile.personId ?? ""}
                    people={peopleOptions}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-black/55">
              No logins yet. Invite an admin, then they appear here after they sign in.
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}
