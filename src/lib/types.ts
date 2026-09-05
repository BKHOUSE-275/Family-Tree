export type Role = "member" | "admin" | "super_admin";

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export type AuditAction =
  | "person.create"
  | "person.update"
  | "person.delete"
  | "contact.update"
  | "request.approve"
  | "request.reject"
  | "role.change";

export type Person = {
  id: string;
  givenName: string;
  surname: string;
  nickname: string | null;
  suffix: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  isDeceased: boolean;
  headstoneLocation: string | null;
  headstonePhotoUrl: string | null;
  familysearchId: string | null;
  notes: string | null;
};

export type Contact = {
  personId: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  shareAddress: boolean;
  sharePhone: boolean;
  shareEmail: boolean;
};

export type ParentChild = {
  parentId: string;
  childId: string;
};

export type Partnership = {
  id: string;
  personAId: string;
  personBId: string;
  startDate: string | null;
  place: string | null;
  notes: string | null;
};

export type Residence = {
  id: string;
  personId: string;
  year: string | null;
  place: string;
};

export type Sibling = {
  personAId: string;
  personBId: string;
};

export type Profile = {
  userId: string;
  personId: string | null;
  role: Role;
  email: string | null;
};

export type ChangeRequest = {
  id: string;
  submitterUserId: string;
  submitterEmail: string | null;
  personId: string | null;
  message: string;
  photoUrl: string | null;
  headstonePhotoUrl: string | null;
  status: ChangeRequestStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type AuditEvent = {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorEmail: string | null;
  action: AuditAction;
  entityId: string | null;
  entityLabel: string;
  summary: string;
};

export type CommitteeInvite = {
  id: string;
  email: string;
  invitedByUserId: string;
  invitedByEmail: string | null;
  createdAt: string;
  usedAt: string | null;
};

export type FamilySnapshot = {
  people: Person[];
  contacts: Contact[];
  parentChildren: ParentChild[];
  partnerships: Partnership[];
  residences: Residence[];
  siblings: Sibling[];
  profiles: Profile[];
  changeRequests: ChangeRequest[];
  auditEvents: AuditEvent[];
  committeeInvites: CommitteeInvite[];
};

export const ROOT_FATHER_ID = "felix-mitchell";
export const ROOT_MOTHER_ID = "adaline-kiah";

export const LEAF_FILLS = ["#4f5d2a", "#c45c26", "#a3441c", "#6b7c38"] as const;
export const LEAF_SELECTED_FILL = "#c9a227";

export function displayName(person: Person): string {
  const nick = person.nickname ? ` “${person.nickname}”` : "";
  const suffix = person.suffix ? ` ${person.suffix}` : "";
  const surname = person.surname ? ` ${person.surname}` : "";
  return `${person.givenName}${nick}${surname}${suffix}`.trim();
}

export function yearRange(person: Person): string {
  const start = person.birthDate?.match(/\d{4}/)?.[0] ?? "";
  const end = person.isDeceased ? (person.deathDate?.match(/\d{4}/)?.[0] ?? "") : "";
  if (start && end) return `${start}–${end}`;
  if (end) return `d. ${end}`;
  if (start) return `b. ${start}`;
  return "";
}

export function birthYear(person: Person): number | null {
  const match = person.birthDate?.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

export function sortByBirth<T extends Person>(people: T[]): T[] {
  return [...people].sort((a, b) => {
    const yearA = birthYear(a);
    const yearB = birthYear(b);
    if (yearA == null && yearB == null) return 0;
    if (yearA == null) return 1;
    if (yearB == null) return -1;
    if (yearA !== yearB) return yearA - yearB;
    return displayName(a).localeCompare(displayName(b));
  });
}

export function leafFillFor(id: string, selected = false): string {
  if (selected) return LEAF_SELECTED_FILL;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return LEAF_FILLS[hash % LEAF_FILLS.length];
}

export function isRootPerson(id: string) {
  return id === ROOT_FATHER_ID || id === ROOT_MOTHER_ID;
}

export function isCommittee(role: Role) {
  return role === "admin" || role === "super_admin";
}
