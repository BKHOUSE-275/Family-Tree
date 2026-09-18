export type Role = "member" | "admin" | "super_admin";

export const ADMIN_PERMISSION_KEYS = [
  "people.edit",
  "people.create",
  "people.delete",
  "requests.review",
  "activity.view",
  "profiles.link",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];
export type AdminPermissions = Record<AdminPermission, boolean>;

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  "people.edit": "People list and edit",
  "people.create": "Add person",
  "people.delete": "Remove person",
  "requests.review": "Review change requests",
  "activity.view": "View activity",
  "profiles.link": "Link a login to a person",
};

export function defaultAdminPermissions(): AdminPermissions {
  return {
    "people.edit": true,
    "people.create": true,
    "people.delete": true,
    "requests.review": true,
    "activity.view": true,
    "profiles.link": true,
  };
}

export function parseAdminPermissions(raw: unknown, role: Role = "admin"): AdminPermissions {
  const defaults = defaultAdminPermissions();
  if (role === "super_admin") return defaults;
  if (raw == null || raw === "") return defaults;
  let parsed: Partial<AdminPermissions> = {};
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as Partial<AdminPermissions>;
    } catch {
      return defaults;
    }
  } else if (typeof raw === "object") {
    parsed = raw as Partial<AdminPermissions>;
  }
  return { ...defaults, ...parsed };
}

export function hasPermission(
  role: Role,
  permissions: AdminPermissions | undefined,
  key: AdminPermission,
) {
  if (role === "super_admin") return true;
  if (role !== "admin") return false;
  return Boolean(permissions?.[key]);
}

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export type AuditAction =
  | "person.create"
  | "person.update"
  | "person.delete"
  | "contact.update"
  | "request.submit"
  | "request.approve"
  | "request.reject"
  | "profile.link"
  | "role.change";

export type Person = {
  id: string;
  givenName: string;
  surname: string;
  maidenName: string | null;
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
  permissions: AdminPermissions;
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

export type PersonPickerOption = {
  id: string;
  label: string;
  maidenName?: string | null;
};

export function toPersonPickerOption(person: Person): PersonPickerOption {
  return {
    id: person.id,
    label: displayName(person),
    maidenName: person.maidenName,
  };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTHS.flatMap((name, index) => [
    [name.toLowerCase(), index],
    [name.slice(0, 3).toLowerCase(), index],
  ]),
);

/** Display family dates as month, day, year when a full date is known. */
export function formatFamilyDate(value: string | null | undefined): string {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const month = Number(iso[2]) - 1;
    const day = Number(iso[3]);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return `${MONTHS[month]} ${day}, ${iso[1]}`;
    }
  }

  const dayMonthYear = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (dayMonthYear) {
    const month = MONTH_INDEX[dayMonthYear[2].toLowerCase()];
    if (month != null) {
      return `${MONTHS[month]} ${Number(dayMonthYear[1])}, ${dayMonthYear[3]}`;
    }
  }

  const monthDayYear = raw.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const month = MONTH_INDEX[monthDayYear[1].toLowerCase()];
    if (month != null) {
      return `${MONTHS[month]} ${Number(monthDayYear[2])}, ${monthDayYear[3]}`;
    }
  }

  const monthYear = raw.match(/^([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1].toLowerCase()];
    if (month != null) {
      return `${MONTHS[month]} ${monthYear[2]}`;
    }
  }

  return raw;
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
  return parseBirthDateParts(person.birthDate)?.year ?? null;
}

/** Year, month, and day for sorting; missing month/day sort before known ones. */
export function parseBirthDateParts(
  value: string | null | undefined,
): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
  }

  const dayMonthYear = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (dayMonthYear) {
    const month = MONTH_INDEX[dayMonthYear[2].toLowerCase()];
    if (month != null) {
      return {
        year: Number(dayMonthYear[3]),
        month: month + 1,
        day: Number(dayMonthYear[1]),
      };
    }
  }

  const monthDayYear = raw.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const month = MONTH_INDEX[monthDayYear[1].toLowerCase()];
    if (month != null) {
      return {
        year: Number(monthDayYear[3]),
        month: month + 1,
        day: Number(monthDayYear[2]),
      };
    }
  }

  const monthYear = raw.match(/^([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1].toLowerCase()];
    if (month != null) {
      return { year: Number(monthYear[2]), month: month + 1, day: 0 };
    }
  }

  const year = raw.match(/\d{4}/);
  if (!year) return null;
  return { year: Number(year[0]), month: 0, day: 0 };
}

export function sortByBirth<T extends Person>(people: T[]): T[] {
  return [...people].sort((a, b) => {
    const partsA = parseBirthDateParts(a.birthDate);
    const partsB = parseBirthDateParts(b.birthDate);
    if (!partsA && !partsB) return 0;
    if (!partsA) return 1;
    if (!partsB) return -1;
    if (partsA.year !== partsB.year) return partsA.year - partsB.year;
    if (partsA.month !== partsB.month) return partsA.month - partsB.month;
    if (partsA.day !== partsB.day) return partsA.day - partsB.day;
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

export function isSlotDemoId(id: string) {
  return id === "slot-demo" || id.startsWith("slot-n-");
}

export function withoutSlotDemo(snapshot: FamilySnapshot): FamilySnapshot {
  return {
    ...snapshot,
    people: snapshot.people.filter((person) => !isSlotDemoId(person.id)),
    contacts: snapshot.contacts.filter((row) => !isSlotDemoId(row.personId)),
    parentChildren: snapshot.parentChildren.filter(
      (link) => !isSlotDemoId(link.parentId) && !isSlotDemoId(link.childId),
    ),
    partnerships: snapshot.partnerships.filter(
      (row) => !isSlotDemoId(row.personAId) && !isSlotDemoId(row.personBId),
    ),
    residences: snapshot.residences.filter((row) => !isSlotDemoId(row.personId)),
    siblings: snapshot.siblings.filter(
      (row) => !isSlotDemoId(row.personAId) && !isSlotDemoId(row.personBId),
    ),
  };
}
