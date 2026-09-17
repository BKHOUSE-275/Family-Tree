import { saveAuditEvent } from "@/lib/store";
import {
  type AuditAction,
  type AuditEvent,
  type Person,
} from "@/lib/types";

const PERSON_FIELDS: Array<[keyof Person, string]> = [
  ["givenName", "Given name"],
  ["surname", "Surname"],
  ["nickname", "Nickname"],
  ["suffix", "Suffix"],
  ["photoUrl", "Profile photo"],
  ["birthDate", "Birth date"],
  ["birthPlace", "Place of birth"],
  ["deathDate", "Death date"],
  ["isDeceased", "Deceased"],
  ["headstoneLocation", "Headstone location"],
  ["headstonePhotoUrl", "Headstone photo"],
  ["familysearchId", "FamilySearch ID"],
  ["notes", "Notes"],
];

export function personFieldDiff(before: Person | null, after: Person, extras: string[] = []) {
  if (!before) {
    return extras.length ? `Created record · ${extras.join(", ")}` : "Created record";
  }
  const changed: string[] = [];
  for (const [key, label] of PERSON_FIELDS) {
    if (before[key] !== after[key]) changed.push(label);
  }
  changed.push(...extras);
  return changed.length ? changed.join(", ") : "Updated record";
}

export async function recordAudit(
  user: { id: string; email: string | null },
  action: AuditAction,
  entityLabel: string,
  summary: string,
  entityId: string | null = null,
) {
  const event: AuditEvent = {
    id: `audit-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    actorUserId: user.id,
    actorEmail: user.email,
    action,
    entityId,
    entityLabel,
    summary,
  };
  try {
    await saveAuditEvent(event);
  } catch (error) {
    console.error("Could not record activity", error);
  }
}
