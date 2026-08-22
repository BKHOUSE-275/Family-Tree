"use client";

import { useMemo, useState } from "react";
import { PersonPanel } from "@/components/person/PersonPanel";
import { HangingTree } from "@/components/tree/HangingTree";
import {
  ROOT_FATHER_ID,
  ROOT_MOTHER_ID,
  displayName,
  yearRange,
  type Contact,
  type FamilySnapshot,
  type Person,
} from "@/lib/types";

export function FamilyTree({ snapshot }: { snapshot: FamilySnapshot }) {
  const byId = useMemo(() => {
    return new Map(snapshot.people.map((person) => [person.id, person]));
  }, [snapshot.people]);

  const [focusId, setFocusId] = useState(ROOT_FATHER_ID);
  const [query, setQuery] = useState("");

  const focus = byId.get(focusId) ?? byId.get(ROOT_FATHER_ID)!;
  const children = childPeople(snapshot, focusId);
  const parents = parentPeople(snapshot, focusId);
  const siblings = siblingPeople(snapshot, focusId, byId);
  const partners = partnerPeople(snapshot, focusId, byId);
  const residences = snapshot.residences.filter((row) => row.personId === focusId);
  const contactRow = snapshot.contacts.find((row) => row.personId === focusId);
  const contact = visibleContact(contactRow);

  const father = byId.get(ROOT_FATHER_ID)!;
  const mother = byId.get(ROOT_MOTHER_ID)!;
  const firstGeneration = uniquePeople([
    ...childPeople(snapshot, ROOT_FATHER_ID),
    ...childPeople(snapshot, ROOT_MOTHER_ID),
  ]);
  const firstGenIds = useMemo(
    () => new Set(firstGeneration.map((person) => person.id)),
    [firstGeneration],
  );

  const hangFromId = hangSourceId(snapshot, focusId, firstGenIds);
  const hangingChildren = hangFromId ? childPeople(snapshot, hangFromId) : [];
  const nestedChildren =
    hangFromId && hangFromId !== focusId ? childPeople(snapshot, focusId) : [];
  const showEmptyBranch =
    focusId !== ROOT_FATHER_ID &&
    focusId !== ROOT_MOTHER_ID &&
    children.length === 0;

  const matches = snapshot.people.filter((person) =>
    displayName(person).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const trail = ancestryTrail(snapshot, focusId, byId);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
      <section>
        <label className="block">
          <span className="sr-only">Search the family</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a name…"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 outline-none ring-leaf/30 focus:ring-2"
          />
        </label>
        {query.trim() ? (
          <ul className="mt-3 max-h-40 overflow-auto rounded-2xl bg-white/80 p-2 text-sm shadow">
            {matches.length ? (
              matches.map((person) => (
                <li key={person.id}>
                  <button
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-leaf-soft"
                    onClick={() => {
                      setFocusId(person.id);
                      setQuery("");
                    }}
                  >
                    {displayName(person)}{" "}
                    <span className="text-black/50">{yearRange(person)}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-black/50">No names match yet.</li>
            )}
          </ul>
        ) : null}

        <nav className="mt-4 flex flex-wrap gap-2 text-sm text-script">
          {trail.map((person, index) => (
            <span key={person.id} className="flex items-center gap-2">
              {index ? <span aria-hidden>›</span> : null}
              <button className="hover:underline" onClick={() => setFocusId(person.id)}>
                {displayName(person)}
              </button>
            </span>
          ))}
        </nav>

        <div className="relative mt-6 overflow-hidden rounded-[2.5rem] border border-black/8 bg-[linear-gradient(180deg,#fff 0%,#f7ebe3 55%,#efe2d4 100%)] p-3 sm:p-5">
          <HangingTree
            father={father}
            mother={mother}
            firstGeneration={firstGeneration}
            focusId={focusId}
            hangFromId={hangFromId}
            hangingChildren={hangingChildren}
            nestedChildren={nestedChildren}
            onSelect={setFocusId}
          />
        </div>

        {showEmptyBranch ? (
          <p className="mt-4 text-black/60">
            No children hang from {displayName(focus)} yet. An admin can add them
            from the Admin page.
          </p>
        ) : null}
      </section>

      <PersonPanel
        person={focus}
        parents={parents}
        partners={partners}
        children={children}
        siblings={siblings}
        residences={residences}
        contact={contact}
        onSelect={setFocusId}
      />
    </div>
  );
}

function hangSourceId(
  snapshot: FamilySnapshot,
  focusId: string,
  firstGenIds: Set<string>,
) {
  if (focusId === ROOT_FATHER_ID || focusId === ROOT_MOTHER_ID) return null;
  if (firstGenIds.has(focusId)) return focusId;

  const seen = new Set<string>();
  let current = focusId;
  while (!seen.has(current)) {
    seen.add(current);
    const parents = parentPeople(snapshot, current);
    const gen1 = parents.find((parent) => firstGenIds.has(parent.id));
    if (gen1) return gen1.id;
    if (!parents[0]) break;
    current = parents[0].id;
    if (current === ROOT_FATHER_ID || current === ROOT_MOTHER_ID) break;
  }
  return null;
}

function childPeople(snapshot: FamilySnapshot, parentId: string) {
  const ids = snapshot.parentChildren
    .filter((link) => link.parentId === parentId)
    .map((link) => link.childId);
  return uniquePeople(snapshot.people.filter((person) => ids.includes(person.id)));
}

function parentPeople(snapshot: FamilySnapshot, childId: string) {
  const ids = snapshot.parentChildren
    .filter((link) => link.childId === childId)
    .map((link) => link.parentId);
  return snapshot.people.filter((person) => ids.includes(person.id));
}

function siblingPeople(
  snapshot: FamilySnapshot,
  personId: string,
  byId: Map<string, Person>,
) {
  const fromParents = parentPeople(snapshot, personId).flatMap((parent) =>
    childPeople(snapshot, parent.id),
  );
  const fromLinks = snapshot.siblings.flatMap((link) => {
    if (link.personAId === personId) return [byId.get(link.personBId)];
    if (link.personBId === personId) return [byId.get(link.personAId)];
    return [];
  });
  return uniquePeople(
    [...fromParents, ...fromLinks].filter((person): person is Person => Boolean(person)),
  ).filter((person) => person.id !== personId);
}

function partnerPeople(
  snapshot: FamilySnapshot,
  personId: string,
  byId: Map<string, Person>,
) {
  return snapshot.partnerships
    .filter((union) => union.personAId === personId || union.personBId === personId)
    .map((union) => {
      const otherId = union.personAId === personId ? union.personBId : union.personAId;
      return {
        person: byId.get(otherId)!,
        date: union.startDate,
        place: union.place,
        notes: union.notes,
      };
    })
    .filter((row) => row.person);
}

function uniquePeople(people: Person[]) {
  const seen = new Set<string>();
  return people.filter((person) => {
    if (seen.has(person.id)) return false;
    seen.add(person.id);
    return true;
  });
}

function ancestryTrail(
  snapshot: FamilySnapshot,
  personId: string,
  byId: Map<string, Person>,
) {
  const trail: Person[] = [];
  const seen = new Set<string>();
  let current = byId.get(personId);
  while (current && !seen.has(current.id)) {
    trail.unshift(current);
    seen.add(current.id);
    if (current.id === ROOT_FATHER_ID || current.id === ROOT_MOTHER_ID) break;
    const parents = parentPeople(snapshot, current.id);
    current = parents[0];
  }
  if (!trail.some((person) => person.id === ROOT_FATHER_ID)) {
    const father = byId.get(ROOT_FATHER_ID);
    if (father) trail.unshift(father);
  }
  return trail;
}

function visibleContact(contact: Contact | undefined) {
  if (!contact) return null;
  return {
    address: contact.shareAddress ? contact.address : null,
    phone: contact.sharePhone ? contact.phone : null,
    email: contact.shareEmail ? contact.email : null,
  };
}
