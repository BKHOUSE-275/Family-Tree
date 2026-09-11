"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PersonPanel } from "@/components/person/PersonPanel";
import { HeritageTree } from "@/components/tree/HeritageTree";
import {
  ROOT_FATHER_ID,
  ROOT_MOTHER_ID,
  displayName,
  isRootPerson,
  sortByBirth,
  yearRange,
  type Contact,
  type FamilySnapshot,
  type Person,
} from "@/lib/types";

export function FamilyTree({
  snapshot,
  onSuggest,
  placeMode = false,
}: {
  snapshot: FamilySnapshot;
  onSuggest?: (personId: string) => void;
  placeMode?: boolean;
}) {
  const byId = useMemo(() => {
    return new Map(snapshot.people.map((person) => [person.id, person]));
  }, [snapshot.people]);

  const [focusId, setFocusId] = useState(ROOT_FATHER_ID);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const skipPanelScroll = useRef(true);

  useEffect(() => {
    if (skipPanelScroll.current) {
      skipPanelScroll.current = false;
      return;
    }
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusId]);

  const focus = byId.get(focusId) ?? byId.get(ROOT_FATHER_ID)!;
  const isTopLevel = isRootPerson(focusId);
  const children = childPeople(snapshot, focusId);
  const parents = parentPeople(snapshot, focusId);
  const siblings = siblingPeople(snapshot, focusId, byId);
  const partners = partnerPeople(snapshot, focusId, byId);
  const residences = snapshot.residences.filter((row) => row.personId === focusId);
  const contactRow = snapshot.contacts.find((row) => row.personId === focusId);
  const contact = visibleContact(contactRow);

  const firstGeneration = sortByBirth(
    uniquePeople([
      ...childPeople(snapshot, ROOT_FATHER_ID),
      ...childPeople(snapshot, ROOT_MOTHER_ID),
    ]),
  );

  const hangingChildren = isTopLevel ? [] : children;
  const showEmptyBranch = !isTopLevel && children.length === 0;

  const matches = snapshot.people.filter((person) =>
    displayName(person).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const trail = ancestryTrail(snapshot, focusId, byId);

  function resetView() {
    setFocusId(ROOT_FATHER_ID);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
          <label className="min-w-0 flex-1 basis-48">
            <span className="sr-only">Search the family</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a name…"
              className="min-h-11 w-full rounded-full border border-black/10 bg-white/90 px-4 py-2 text-base outline-none ring-ember/30 focus:ring-2"
            />
          </label>
          <button
            type="button"
            onClick={resetView}
            className="min-h-11 rounded-full border border-bark/20 bg-white/90 px-4 py-2 text-sm text-bark hover:bg-gold/40"
          >
            Reset
          </button>
        </div>
        {query.trim() ? (
          <ul className="mx-auto mt-3 max-h-40 max-w-3xl overflow-auto rounded-2xl bg-white/80 p-2 text-sm shadow">
            {matches.length ? (
              matches.map((person) => (
                <li key={person.id}>
                  <button
                    className="min-h-11 w-full rounded-xl px-3 py-2 text-left hover:bg-leaf-soft"
                    onClick={() => {
                      setFocusId(person.id);
                      setQuery("");
                    }}
                  >
                    {displayName(person)}
                    {yearRange(person) ? (
                      <span className="text-black/50"> {yearRange(person)}</span>
                    ) : null}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-black/50">No names match yet.</li>
            )}
          </ul>
        ) : null}

        <nav className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2 text-sm text-script">
          {trail.map((person, index) => (
            <span key={person.id} className="flex items-center gap-2">
              {index ? <span aria-hidden>›</span> : null}
              <button
                className="inline-flex min-h-11 items-center hover:underline"
                onClick={() => setFocusId(person.id)}
              >
                {displayName(person)}
              </button>
            </span>
          ))}
        </nav>

        <div className="relative left-1/2 mt-4 w-screen -translate-x-1/2">
          <HeritageTree
            isTopLevel={isTopLevel}
            canopyPeople={firstGeneration}
            subject={isTopLevel ? null : focus}
            hangingChildren={hangingChildren}
            focusId={focusId}
            onSelect={setFocusId}
            placeMode={placeMode}
          />
          {showEmptyBranch ? (
            <p className="mx-auto mt-4 max-w-3xl px-4 text-center text-black/60">
              No children are recorded for {displayName(focus)} yet. Suggest an
              update below if you know more of this branch.
            </p>
          ) : null}
        </div>

        <div ref={panelRef} className="mx-auto mt-8 w-full max-w-4xl scroll-mt-6">
          <PersonPanel
            person={focus}
            parents={parents}
            partners={partners}
            childPeople={children}
            siblings={siblings}
            residences={residences}
            contact={contact}
            onSelect={setFocusId}
            onSuggest={onSuggest}
          />
        </div>
      </section>
    </div>
  );
}

function childPeople(snapshot: FamilySnapshot, parentId: string) {
  const ids = snapshot.parentChildren
    .filter((link) => link.parentId === parentId)
    .map((link) => link.childId);
  return sortByBirth(
    uniquePeople(snapshot.people.filter((person) => ids.includes(person.id))),
  );
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
  const self = byId.get(personId);
  const fromParents = parentPeople(snapshot, personId).flatMap((parent) =>
    childPeople(snapshot, parent.id),
  );
  const fromLinks = snapshot.siblings.flatMap((link) => {
    if (link.personAId === personId) return [byId.get(link.personBId)];
    if (link.personBId === personId) return [byId.get(link.personAId)];
    return [];
  });
  return sortByBirth(
    uniquePeople(
      [self, ...fromParents, ...fromLinks].filter((person): person is Person =>
        Boolean(person),
      ),
    ),
  );
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
    if (isRootPerson(current.id)) break;
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
