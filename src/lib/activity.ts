import { easternDayLabel } from "@/lib/datetime";
import { requestKindLabel, requestSubmitter, requestSubjectName } from "@/lib/request-message";
import type { AuditEvent, ChangeRequest, FamilySnapshot } from "@/lib/types";
import { displayName } from "@/lib/types";

export type ActivityStatus = "pending" | "confirmed" | "declined";

export type ActivityItem = {
  id: string;
  createdAt: string;
  status: ActivityStatus;
  title: string;
  summary: string;
  actor: string;
  actorIsGuest: boolean;
  reviewer: string | null;
  href?: string;
  kind: "request" | "audit";
};

const REQUEST_AUDIT_ACTIONS = new Set([
  "request.submit",
  "request.approve",
  "request.reject",
]);

function requestStatus(status: ChangeRequest["status"]): ActivityStatus {
  if (status === "pending") return "pending";
  if (status === "rejected") return "declined";
  return "confirmed";
}

function requestSummary(request: ChangeRequest, personName: string | null) {
  if (request.status === "pending") return requestKindLabel(request.message, personName);
  if (request.status === "rejected") {
    return request.adminNote ? `Declined · ${request.adminNote}` : "Declined by the committee";
  }
  return request.adminNote ? `Confirmed · ${request.adminNote}` : "Confirmed by the committee";
}

export function reviewerDisplayName(
  snapshot: FamilySnapshot,
  userId: string | null,
): string | null {
  if (!userId) return null;
  const profile = snapshot.profiles.find((row) => row.userId === userId);
  if (profile?.personId) {
    const person = snapshot.people.find((row) => row.id === profile.personId);
    if (person) return displayName(person);
  }
  return profile?.email ?? userId;
}

function itemFromRequest(
  request: ChangeRequest,
  personName: string | null,
  reviewer: string | null,
): ActivityItem {
  const status = requestStatus(request.status);
  const submitter = requestSubmitter(request);
  return {
    id: request.id,
    createdAt: request.reviewedAt ?? request.createdAt,
    status,
    title:
      requestSubjectName(request.message, personName) ??
      requestKindLabel(request.message, personName),
    summary: requestSummary(request, personName),
    actor: submitter.name,
    actorIsGuest: submitter.isGuest,
    reviewer: status === "pending" ? null : reviewer,
    href: `/admin/requests/${request.id}`,
    kind: "request",
  };
}

function itemFromAudit(event: AuditEvent): ActivityItem {
  const personHref =
    event.entityId &&
    (event.action.startsWith("person") || event.action === "contact.update")
      ? `/admin/people/${event.entityId}`
      : event.action.startsWith("request")
        ? "/admin/requests"
        : event.action === "role.change" || event.action === "profile.link"
          ? "/admin"
          : undefined;
  return {
    id: event.id,
    createdAt: event.createdAt,
    status: event.action === "request.reject" ? "declined" : "confirmed",
    title: event.entityLabel,
    summary: event.summary,
    actor: event.actorEmail ?? event.actorUserId,
    actorIsGuest: false,
    reviewer: null,
    href: personHref,
    kind: "audit",
  };
}

export function buildActivityFeed(snapshot: FamilySnapshot): ActivityItem[] {
  const byId = new Map(snapshot.people.map((person) => [person.id, person]));
  const fromRequests = snapshot.changeRequests.map((request) => {
    const person = request.personId ? byId.get(request.personId) : undefined;
    return itemFromRequest(
      request,
      person ? displayName(person) : null,
      reviewerDisplayName(snapshot, request.reviewedBy),
    );
  });
  const fromAudit = snapshot.auditEvents
    .filter((event) => !REQUEST_AUDIT_ACTIONS.has(event.action))
    .map(itemFromAudit);
  return [...fromRequests, ...fromAudit].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function reviewerActionLabel(item: ActivityItem) {
  if (!item.reviewer) return null;
  if (item.status === "declined") return `Declined by ${item.reviewer}`;
  if (item.status === "confirmed") return `Approved by ${item.reviewer}`;
  return null;
}

export function dayLabel(iso: string) {
  return easternDayLabel(iso);
}

export function groupActivityByDay(items: ActivityItem[]) {
  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
