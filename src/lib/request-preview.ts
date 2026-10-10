import { messageField, personMessageField } from "@/lib/request-message";
import {
  defaultPersonVisibility,
  displayName,
  type ChangeRequest,
  type Contact,
  type FamilySnapshot,
  type Person,
} from "@/lib/types";

export type RequestPersonPreview = {
  person: Person;
  contact: Contact | null;
  parents: Person[];
  partners: {
    person: Person;
    date: string | null;
    place: string | null;
    notes: string | null;
  }[];
  childPeople: Person[];
  siblings: Person[];
  residences: { year: string | null; place: string }[];
};

function emptyPerson(id: string, givenName: string, surname = ""): Person {
  return {
    id,
    givenName,
    surname,
    maidenName: null,
    nickname: null,
    suffix: null,
    photoUrl: null,
    birthDate: null,
    birthPlace: null,
    deathDate: null,
    isDeceased: false,
    headstoneLocation: null,
    headstonePhotoUrl: null,
    familysearchId: null,
    notes: null,
    ...defaultPersonVisibility(),
  };
}

function personFromLabel(
  snapshot: FamilySnapshot,
  label: string,
  fallbackId: string,
) {
  const match = snapshot.people.find((person) => displayName(person) === label);
  return match ?? emptyPerson(fallbackId, label);
}

function parseRelationship(value: string | null) {
  if (!value) return null;
  const prefixes = [
    { prefix: "Child of", role: "child" as const },
    { prefix: "Parent of", role: "parent" as const },
    { prefix: "Spouse of", role: "spouse" as const },
    { prefix: "Sibling of", role: "sibling" as const },
  ];
  for (const { prefix, role } of prefixes) {
    if (value.toLowerCase().startsWith(prefix.toLowerCase())) {
      const label = value.slice(prefix.length).trim();
      return label ? { role, label } : null;
    }
  }
  return null;
}

export function buildRequestPersonPreview(
  request: ChangeRequest,
  snapshot: FamilySnapshot,
): RequestPersonPreview {
  const message = request.message;
  const givenName = messageField(message, "given name") ?? "Unknown";
  const surname = messageField(message, "surname") ?? "";
  const person: Person = {
    ...emptyPerson(`preview-${request.id}`, givenName, surname),
    maidenName: messageField(message, "maiden name"),
    nickname: messageField(message, "nickname"),
    suffix: messageField(message, "suffix"),
    photoUrl: request.photoUrl,
    birthDate: messageField(message, "birth date"),
    birthPlace: messageField(message, "birth place"),
    deathDate: messageField(message, "death date"),
    isDeceased: messageField(message, "deceased")?.toLowerCase() === "yes",
    headstoneLocation: messageField(message, "headstone location"),
    headstonePhotoUrl: request.headstonePhotoUrl,
  };

  const phone = personMessageField(message, "contact number", "proposed phone");
  const email = personMessageField(message, "email", "proposed email");
  const address = messageField(message, "address");
  const contact: Contact | null =
    phone || email || address
      ? {
          personId: person.id,
          address,
          phone,
          email,
          shareAddress: true,
          sharePhone: true,
          shareEmail: true,
        }
      : null;

  const parents: Person[] = [];
  const childPeople: Person[] = [];
  const siblings: Person[] = [];
  const partners: RequestPersonPreview["partners"] = [];
  const seen = new Set<string>();

  function addUnique(list: Person[], next: Person) {
    if (seen.has(next.id) || next.id === person.id) return;
    seen.add(next.id);
    list.push(next);
  }

  const related = parseRelationship(messageField(message, "relationship"));
  if (related) {
    const relatedPerson = personFromLabel(
      snapshot,
      related.label,
      `preview-related-${request.id}`,
    );
    if (related.role === "child") addUnique(parents, relatedPerson);
    else if (related.role === "parent") addUnique(childPeople, relatedPerson);
    else if (related.role === "sibling") addUnique(siblings, relatedPerson);
    else if (related.role === "spouse") {
      partners.push({
        person: relatedPerson,
        date: null,
        place: null,
        notes: null,
      });
      seen.add(relatedPerson.id);
    }
  }

  // Newer requests carry the flyer's "Parent's name (Mitchell)"; older ones "Parent".
  const parentLabel =
    messageField(message, "parent's name (mitchell)") ?? messageField(message, "parent");
  if (parentLabel) {
    addUnique(
      parents,
      personFromLabel(snapshot, parentLabel, `preview-parent-${request.id}`),
    );
  }

  const spouseLabel = messageField(message, "spouse");
  if (spouseLabel && !partners.some((row) => displayName(row.person) === spouseLabel)) {
    const spouse = personFromLabel(snapshot, spouseLabel, `preview-spouse-${request.id}`);
    partners.push({
      person: spouse,
      date: null,
      place: null,
      notes: null,
    });
  }

  return {
    person,
    contact,
    parents,
    partners,
    childPeople,
    siblings,
    residences: [],
  };
}
