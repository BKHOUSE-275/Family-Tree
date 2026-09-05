import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePersonAction, linkProfileAction } from "@/app/actions/family";
import { getAppUser } from "@/lib/auth";
import { getSnapshot, isPlaced } from "@/lib/store";
import { displayName, isCommittee, yearRange } from "@/lib/types";

export default async function AdminPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (!isCommittee(user.role)) redirect("/");

  const snapshot = await getSnapshot();
  const unplaced = snapshot.people.filter((person) => !isPlaced(snapshot, person.id));
  const pendingCount = snapshot.changeRequests.filter((row) => row.status === "pending").length;
  const recentEdits = [...snapshot.auditEvents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

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
      <p className="mt-2 text-sm text-black/50">
        Data source: {process.env.DATABASE_URL ? "Neon Postgres" : "local booklet seed (connect Neon to persist in production)"}
      </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {pendingCount ? (
            <Link
              href="/admin/requests"
              className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-bark"
            >
              {pendingCount} pending request{pendingCount === 1 ? "" : "s"}
            </Link>
          ) : null}
          <Link
            href="/admin/people/new"
            className="inline-flex min-h-11 items-center rounded-full bg-script px-5 py-2 text-white"
          >
            Add a person
          </Link>
        </div>
      </div>

      <section className="mt-10 rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Recently edited</h2>
          <Link href="/admin/activity" className="text-sm text-ember underline-offset-4 hover:underline">
            View all activity
          </Link>
        </div>
        {recentEdits.length ? (
          <ul className="mt-4 divide-y divide-black/8">
            {recentEdits.map((event) => (
              <li key={event.id} className="py-3 text-sm">
                <p className="font-semibold">{event.entityLabel}</p>
                <p className="text-black/65">{event.summary}</p>
                <p className="mt-1 text-xs text-black/50">
                  {event.actorEmail ?? event.actorUserId} ·{" "}
                  {new Date(event.createdAt).toLocaleString()}
                  {event.entityId && event.action.startsWith("person") ? (
                    <>
                      {" · "}
                      <Link href={`/admin/people/${event.entityId}`} className="text-ember underline">
                        Open
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-black/55">No edits recorded yet.</p>
        )}
      </section>

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
              <form action={deletePersonAction}>
                <input type="hidden" name="id" value={person.id} />
                  <button className="min-h-11 text-sm text-black/45 hover:text-leaf-deep">Remove</button>
              </form>
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

      <section className="mt-10 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Link a login to a person</h2>
        <p className="mt-1 text-sm text-black/60">
          After a relative signs in once, they appear here. Choose who they are
          on the tree so they can add phone, email, and address.
        </p>
        {snapshot.profiles.length ? (
          <ul className="mt-4 space-y-3">
            {snapshot.profiles.map((profile) => (
              <li key={profile.userId}>
                <form action={linkProfileAction} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="userId" value={profile.userId} />
                  <p className="self-center text-sm">
                    {profile.email ?? profile.userId}
                    <span className="ml-2 text-xs text-black/45">
                      {profile.role.replace("_", " ")}
                    </span>
                  </p>
                  <select
                    name="personId"
                    defaultValue={profile.personId ?? ""}
                    className="ui-select"
                  >
                    <option value="">Not linked</option>
                    {snapshot.people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {displayName(person)}
                      </option>
                    ))}
                  </select>
                  <button className="min-h-11 rounded-full bg-script px-5 py-2 text-white sm:col-span-2">
                    Save link
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-black/55">
            No logins yet. Ask a relative to create an account, then refresh this page.
          </p>
        )}
      </section>
    </main>
  );
}
