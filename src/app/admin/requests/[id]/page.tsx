import { notFound, redirect } from "next/navigation";
import { DeskLink } from "@/components/admin/DeskLink";
import { GuestBadge } from "@/components/admin/GuestBadge";
import { OpenSavedPersonButton } from "@/components/admin/OpenSavedPersonButton";
import { PersonPanel } from "@/components/person/PersonPanel";
import { reviewerDisplayName } from "@/lib/activity";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { formatEasternDateTime } from "@/lib/datetime";
import { isAddPersonRequest, requestKindLabel, requestSubjectName, requestSubmitter, savedSubjectPersonId } from "@/lib/request-message";
import { buildRequestPersonPreview } from "@/lib/request-preview";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee } from "@/lib/types";

export default async function RequestPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/requests");
  if (!isCommittee(user.role)) redirect("/");
  if (
    !userHasPermission(user, "activity.view") &&
    !userHasPermission(user, "requests.review")
  ) {
    redirect("/admin");
  }

  const { id } = await params;
  const snapshot = await getSnapshot();
  const request = snapshot.changeRequests.find((row) => row.id === id);
  if (!request) notFound();

  const related = request.personId
    ? snapshot.people.find((row) => row.id === request.personId)
    : undefined;
  const relatedName = related ? displayName(related) : null;
  const kind = requestKindLabel(request.message, relatedName);
  const submitter = requestSubmitter(request);
  const preview = buildRequestPersonPreview(request, snapshot);
  const reviewer = reviewerDisplayName(snapshot, request.reviewedBy);
  const savedSubjectId = savedSubjectPersonId(
    request.message,
    request.personId,
    new Map(snapshot.people.map((person) => [person.id, person])),
  );

  const banner =
    request.status === "approved"
      ? {
          kicker: "Approved",
          body: "The committee approved this request. This card is the submitted change, shown so you can see what was confirmed.",
          className: "border-leaf bg-leaf-soft",
          badge: "Approved",
          badgeClass: "bg-leaf text-white",
        }
      : request.status === "rejected"
        ? {
            kicker: "Declined",
            body: "The committee declined this request. This card is only what was submitted. It was not added to the family tree.",
            className: "border-black/20 bg-black/[0.04]",
            badge: "Declined",
            badgeClass: "bg-black/70 text-white",
          }
        : {
            kicker: "Needs review",
            body: "This is what this one request submitted. It is not the saved person on the family tree, and opening it here does not change anything.",
            className: "border-dashed border-gold bg-gold/25",
            badge: "Not saved",
            badgeClass: "bg-gold/90 text-bark",
          };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-10">
      <div className="mt-6 flex flex-wrap gap-3">
        <DeskLink href="/admin/activity">Back to activity</DeskLink>
        <DeskLink href="/admin/requests">Change requests</DeskLink>
      </div>

      <div className={`mt-6 rounded-3xl border-2 px-4 py-4 sm:px-6 ${banner.className}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-script">
          {banner.kicker}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-bark">
          {kind}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-bark/80">{banner.body}</p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-bark/70">
          <span>{submitter.name}</span>
          {submitter.isGuest ? <GuestBadge /> : null}
          <span>· {formatEasternDateTime(request.createdAt)}</span>
        </p>
        {request.status !== "pending" && (reviewer || request.reviewedAt) ? (
          <p className="mt-1 text-sm text-bark/70">
            {request.status === "approved" ? "Approved" : "Declined"}
            {reviewer ? ` by ${reviewer}` : ""}
            {request.reviewedAt ? ` · ${formatEasternDateTime(request.reviewedAt)}` : ""}
          </p>
        ) : null}
      </div>

      <div className="relative mt-8">
        <p
          className={`pointer-events-none absolute right-3 top-4 z-10 rotate-12 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow ${banner.badgeClass}`}
        >
          {banner.badge}
        </p>
        <PersonPanel
          person={preview.person}
          parents={preview.parents}
          partners={preview.partners}
          childPeople={preview.childPeople}
          siblings={preview.siblings}
          residences={preview.residences}
          contact={preview.contact}
          previewStatus={request.status}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {userHasPermission(user, "requests.review") ? (
          <DeskLink href="/admin/requests">
            {request.status === "pending" ? "Review the request" : "See all requests"}
          </DeskLink>
        ) : null}
        {userHasPermission(user, "people.edit") &&
        (request.personId || isAddPersonRequest(request.message)) ? (
          <OpenSavedPersonButton
            href={savedSubjectId ? `/admin/people/${savedSubjectId}` : null}
            personName={requestSubjectName(request.message, relatedName)}
            label="Open the saved person editor"
          />
        ) : null}
      </div>
    </main>
  );
}
