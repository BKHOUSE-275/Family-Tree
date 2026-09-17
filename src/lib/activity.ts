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

function requestSummary(request: ChangeRequest) {
  const firstLine =
    request.message
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "Family suggestion";
  if (request.status === "pending") return firstLine;
  if (request.status === "rejected") {
    return request.adminNote ? `Declined · ${request.adminNote}` : "Declined by the committee";
  }
  return request.adminNote ? `Confirmed · ${request.adminNote}` : "Confirmed by the committee";
}

function itemFromRequest(
  request: ChangeRequest,
  personName: string | null,
): ActivityItem {
  return {
    id: request.id,
    createdAt: request.reviewedAt ?? request.createdAt,
    status: requestStatus(request.status),
    title: personName ?? "Family suggestion",
    summary: requestSummary(request),
    actor: request.submitterEmail ?? request.submitterUserId,
    href: "/admin/requests",
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
    href: personHref,
    kind: "audit",
  };
}

export function buildActivityFeed(snapshot: FamilySnapshot): ActivityItem[] {
  const byId = new Map(snapshot.people.map((person) => [person.id, person]));
  const fromRequests = snapshot.changeRequests.map((request) => {
    const person = request.personId ? byId.get(request.personId) : undefined;
    return itemFromRequest(request, person ? displayName(person) : null);
  });
  const fromAudit = snapshot.auditEvents
    .filter((event) => !REQUEST_AUDIT_ACTIONS.has(event.action))
    .map(itemFromAudit);
  return [...fromRequests, ...fromAudit].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return startOfThatDay.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: startOfThatDay.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
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
