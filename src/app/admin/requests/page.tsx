import Link from "next/link";
import { redirect } from "next/navigation";
import {
  cancelChangeRequestAction,
  reviewChangeRequestAction,
} from "@/app/actions/requests";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee } from "@/lib/types";

export default async function ChangeRequestsPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/requests");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "requests.review")) redirect("/admin");

  const snapshot = await getSnapshot();
  const byId = new Map(snapshot.people.map((person) => [person.id, person]));
  const pending = snapshot.changeRequests.filter((row) => row.status === "pending");
  const reviewed = snapshot.changeRequests.filter((row) => row.status !== "pending");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Change requests
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Read each note, edit the person if the content is tasteful, then approve
        or reject. Approving can attach submitted photos.
      </p>

      <section className="mt-10">
        <h2 className="text-center font-[family-name:var(--font-display)] text-3xl">Pending</h2>
        {pending.length ? (
          <ul className="mt-4 space-y-4">
            {pending.map((request) => {
              const person = request.personId ? byId.get(request.personId) : undefined;
              return (
                <RequestCard
                  key={request.id}
                  request={request}
                  personName={person ? displayName(person) : null}
                  canCancel={user.role === "super_admin"}
                />
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-center text-sm text-black/55">No pending requests.</p>
        )}
      </section>

      {reviewed.length ? (
        <section className="mt-12">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl">Reviewed</h2>
          <ul className="mt-4 space-y-3">
            {reviewed.map((request) => (
              <li key={request.id} className="rounded-3xl bg-white p-5 text-sm shadow">
                <p className="font-semibold capitalize">{request.status}</p>
                <p className="text-black/60">
                  {request.submitterEmail ?? request.submitterUserId}
                  {request.personId && byId.get(request.personId)
                    ? ` · ${displayName(byId.get(request.personId)!)}`
                    : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{request.message}</p>
                {request.adminNote ? (
                  <p className="mt-2 text-black/55">Note: {request.adminNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function RequestCard({
  request,
  personName,
  canCancel,
}: {
  request: {
    id: string;
    submitterEmail: string | null;
    submitterUserId: string;
    personId: string | null;
    message: string;
    photoUrl: string | null;
    headstonePhotoUrl: string | null;
    createdAt: string;
  };
  personName: string | null;
  canCancel: boolean;
}) {
  return (
    <li className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm text-black/55">
        {new Date(request.createdAt).toLocaleString()} ·{" "}
        {request.submitterEmail ?? request.submitterUserId}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
        {personName ?? "General family note"}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm">{request.message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {request.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={request.photoUrl} alt="Submitted portrait" className="h-24 w-24 rounded-full object-cover" />
        ) : null}
        {request.headstonePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={request.headstonePhotoUrl} alt="Submitted headstone" className="h-24 w-36 rounded-xl object-cover" />
        ) : null}
      </div>
      <form action={reviewChangeRequestAction} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={request.id} />
        {request.personId && request.photoUrl ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="attachPhoto" defaultChecked />
            Attach profile photo to this person
          </label>
        ) : null}
        {request.personId && request.headstonePhotoUrl ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="attachHeadstone" defaultChecked />
            Attach headstone photo to this person
          </label>
        ) : null}
        <label className="block text-sm font-semibold text-script">
          Committee note
          <input
            name="adminNote"
            className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button name="decision" value="approved" className="min-h-11 rounded-full bg-script px-5 py-2 text-white">
            Approve
          </button>
          <button name="decision" value="rejected" className="min-h-11 rounded-full border border-bark/20 px-5 py-2">
            Reject
          </button>
          {request.personId ? (
            <Link href={`/admin/people/${request.personId}`} className="self-center text-sm text-ember underline">
              Open person editor
            </Link>
          ) : null}
          {canCancel ? (
            <button
              type="submit"
              formAction={cancelChangeRequestAction}
              className="min-h-11 rounded-full border border-ember/40 px-5 py-2 text-ember"
            >
              Cancel request
            </button>
          ) : null}
        </div>
      </form>
    </li>
  );
}
