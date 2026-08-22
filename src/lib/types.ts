export type Role = "member" | "admin";

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

export type FamilySnapshot = {
  people: Person[];
  contacts: Contact[];
  parentChildren: ParentChild[];
  partnerships: Partnership[];
  residences: Residence[];
  siblings: Sibling[];
  profiles: Profile[];
};

export const ROOT_FATHER_ID = "felix-mitchell";
export const ROOT_MOTHER_ID = "adaline-kiah";

export function displayName(person: Person): string {
  const nick = person.nickname ? ` “${person.nickname}”` : "";
  const suffix = person.suffix ? ` ${person.suffix}` : "";
  const surname = person.surname ? ` ${person.surname}` : "";
  return `${person.givenName}${nick}${surname}${suffix}`.trim();
}

export function yearRange(person: Person): string {
  const start = person.birthDate?.match(/\d{4}/)?.[0] ?? "";
  if (person.isDeceased) {
    const end = person.deathDate?.match(/\d{4}/)?.[0] ?? "Deceased";
    return start ? `${start}–${end}` : end;
  }
  return start ? `b. ${start}` : "";
}
