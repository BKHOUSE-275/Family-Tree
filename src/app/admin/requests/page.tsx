import { redirect } from "next/navigation";
import {
  cancelChangeRequestAction,
  reviewChangeRequestAction,
} from "@/app/actions/requests";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { DeskLink } from "@/components/admin/DeskLink";
import { GuestBadge } from "@/components/admin/GuestBadge";
import { OpenSavedPersonButton } from "@/components/admin/OpenSavedPersonButton";
import { reviewerDisplayName } from "@/lib/activity";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { formatEasternDateTime } from "@/lib/datetime";
import { isAddPersonRequest, requestKindLabel, requestSubmitter, requestSubjectName, savedSubjectPersonId, splitRequestMessage, type RequestMessageRow } from "@/lib/request-message";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee, type ChangeRequest } from "@/lib/types";

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
      <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-3xl break-words text-script sm:text-4xl md:text-5xl">
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
                  people={byId}
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
            {reviewed.map((request) => {
              const person = request.personId ? byId.get(request.personId) : undefined;
              const reviewer = reviewerDisplayName(snapshot, request.reviewedBy);
              const reviewVerb = request.status === "approved" ? "Approved by" : "Declined by";
              const submitter = requestSubmitter(request);
              return (
                <li key={request.id} className="rounded-3xl bg-white p-4 text-sm shadow sm:p-5">
                  <p className="font-semibold capitalize">{request.status}</p>
                  <RequestHeading
                    message={request.message}
                    personName={person ? displayName(person) : null}
                  />
                  <p className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-black/60">
                    <span>{submitter.name}</span>
                    {submitter.isGuest ? <GuestBadge /> : null}
                  </p>
                  <MessageFields message={request.message} />
                  {request.adminNote ? (
                    <p className="mt-3 text-black/55">Note: {request.adminNote}</p>
                  ) : null}
                  {reviewer ? (
                    <p className="mt-3 text-xs text-black/50">
                      {reviewVerb} {reviewer}
                      {request.reviewedAt ? ` · ${formatEasternDateTime(request.reviewedAt)}` : ""}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <DeskLink href={`/admin/requests/${request.id}`}>View this change</DeskLink>
                    <SavedPersonLink request={request} people={byId} personName={person ? displayName(person) : null} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function FieldList({
  title,
  rows,
}: {
  title: string;
  rows: RequestMessageRow[];
}) {
  if (!rows.length) return null;
  return (
    <section className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-script">{title}</h3>
      <dl className="mt-2 overflow-hidden rounded-2xl border border-black/8 bg-black/[0.02] text-sm">
        {rows.map((row, index) => (
          <div
            key={`${row.label ?? "note"}-${index}`}
            className="grid gap-0.5 border-b border-black/8 px-3 py-2.5 last:border-b-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
          >
            <dt className="text-black/50">{row.label ?? "Note"}</dt>
            <dd className="min-w-0 break-words text-bark">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MessageFields({ message }: { message: string }) {
  const { submitter, person } = splitRequestMessage(message);
  if (!submitter.length && !person.length) return null;
  return (
    <div>
      <FieldList title="Submitted by" rows={submitter} />
      <FieldList title="Person" rows={person} />
    </div>
  );
}

function RequestHeading({
  message,
  personName,
}: {
  message: string;
  personName: string | null;
}) {
  const kind = requestKindLabel(message, personName);
  const subject = requestSubjectName(message, personName);
  const showSubject = Boolean(subject) && kind !== `Updating ${subject}`;
  return (
    <div className="mt-1">
      <p className="font-[family-name:var(--font-display)] text-2xl">{kind}</p>
      {showSubject ? <p className="text-lg text-bark">{subject}</p> : null}
    </div>
  );
}

function SavedPersonLink({
  request,
  people,
  personName,
  label,
}: {
  request: ChangeRequest;
  people: { has(id: string): boolean };
  personName: string | null;
  label?: string;
}) {
  const offer =
    Boolean(request.personId) || isAddPersonRequest(request.message);
  if (!offer) return null;
  const savedId = savedSubjectPersonId(request.message, request.personId, people);
  return (
    <OpenSavedPersonButton
      href={savedId ? `/admin/people/${savedId}` : null}
      personName={requestSubjectName(request.message, personName)}
      label={label}
    />
  );
}

function RequestCard({
  request,
  personName,
  people,
  canCancel,
}: {
  request: ChangeRequest;
  personName: string | null;
  people: { has(id: string): boolean };
  canCancel: boolean;
}) {
  const submitter = requestSubmitter(request);
  return (
    <li className="rounded-3xl bg-white p-4 shadow sm:p-6">
      <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-black/55">
        <span>{formatEasternDateTime(request.createdAt)}</span>
        <span>·</span>
        <span className="text-bark">{submitter.name}</span>
        {submitter.isGuest ? <GuestBadge /> : null}
      </p>
      <RequestHeading message={request.message} personName={personName} />
      <MessageFields message={request.message} />
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
        {isAddPersonRequest(request.message) && (request.photoUrl || request.headstonePhotoUrl) ? (
          <p className="text-sm text-black/60">
            Photos sent with a new person are not attached on approval. Add them
            when you create the person.
          </p>
        ) : null}
        {request.personId && request.photoUrl && !isAddPersonRequest(request.message) ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="attachPhoto" defaultChecked />
            Attach profile photo to this person
          </label>
        ) : null}
        {request.personId && request.headstonePhotoUrl && !isAddPersonRequest(request.message) ? (
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
          <button name="decision" value="approved" className="min-h-11 rounded-full bg-script px-5 py-2 text-white transition hover:bg-gold hover:text-bark">
            Approve
          </button>
          <ConfirmSubmitButton
            name="decision"
            value="rejected"
            title="Reject this request"
            message="Decline this suggestion? It will not be added to the family tree."
            confirmLabel="Reject"
            className="min-h-11 rounded-full border border-bark/20 px-5 py-2 transition hover:border-gold hover:bg-gold/40"
          >
            Reject
          </ConfirmSubmitButton>
          <DeskLink href={`/admin/requests/${request.id}`}>View this change</DeskLink>
          <SavedPersonLink request={request} people={people} personName={personName} />
          {canCancel ? (
            <ConfirmSubmitButton
              formAction={cancelChangeRequestAction}
              title="Cancel this request"
              message="Close this pending request? The committee will not review it."
              confirmLabel="Cancel request"
              className="min-h-11 rounded-full border border-ember/40 px-5 py-2 text-ember transition hover:bg-ember hover:text-white"
            >
              Cancel request
            </ConfirmSubmitButton>
          ) : null}
        </div>
      </form>
    </li>
  );
}
