"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deletePersonAction } from "@/app/actions/family";

export type AdminPersonRow = {
  id: string;
  name: string;
  years: string;
  placed: boolean;
  isDeceased: boolean;
  hasPhoto: boolean;
  hasHeadstone: boolean;
  hasFamilySearch: boolean;
};

type FilterId =
  | "placed"
  | "unplaced"
  | "living"
  | "deceased"
  | "has-photo"
  | "no-photo"
  | "has-headstone"
  | "no-headstone"
  | "has-familysearch"
  | "no-familysearch";

const FILTERS: { id: FilterId; group: string; label: string }[] = [
  { id: "placed", group: "placement", label: "On the tree" },
  { id: "unplaced", group: "placement", label: "Unplaced" },
  { id: "living", group: "status", label: "Living" },
  { id: "deceased", group: "status", label: "Deceased" },
  { id: "has-photo", group: "photo", label: "Has photo" },
  { id: "no-photo", group: "photo", label: "Missing photo" },
  { id: "has-headstone", group: "headstone", label: "Has headstone" },
  { id: "no-headstone", group: "headstone", label: "Missing headstone" },
  { id: "has-familysearch", group: "familysearch", label: "Has FamilySearch ID" },
  { id: "no-familysearch", group: "familysearch", label: "Missing FamilySearch ID" },
];

const FILTER_BY_ID = new Map(FILTERS.map((filter) => [filter.id, filter]));

export function PeopleList({
  people,
  canDelete,
}: {
  people: AdminPersonRow[];
  canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterId[]>([]);

  const availableFilters = FILTERS.filter(
    (filter) => !filters.some((id) => FILTER_BY_ID.get(id)?.group === filter.group),
  );

  const filtered = useMemo(
    () => people.filter((person) => matchesPerson(person, query, filters)),
    [people, query, filters],
  );
  const unplaced = useMemo(() => {
    const withoutPlacement = filters.filter(
      (id) => FILTER_BY_ID.get(id)?.group !== "placement",
    );
    return people.filter(
      (person) => !person.placed && matchesPerson(person, query, withoutPlacement),
    );
  }, [people, query, filters]);

  const active = Boolean(query.trim() || filters.length);
  const showUnplaced = !filters.some((id) => id === "placed");

  function addFilter(id: string) {
    const next = FILTERS.find((filter) => filter.id === id);
    if (!next) return;
    setFilters((current) => [
      ...current.filter((item) => FILTER_BY_ID.get(item)?.group !== next.group),
      next.id,
    ]);
  }

  function clearAll() {
    setQuery("");
    setFilters([]);
  }

  return (
    <>
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Everyone</h2>
          <p className="text-sm text-black/55" aria-live="polite">
            {filtered.length === people.length
              ? `${people.length} ${people.length === 1 ? "person" : "people"}`
              : `${filtered.length} of ${people.length}`}
          </p>
        </div>

        <div className="mt-4 rounded-3xl bg-white shadow">
          <div className="space-y-3 border-b border-black/8 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Search people by name</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search names…"
                  autoComplete="off"
                  className="min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/40"
                />
              </label>
              {availableFilters.length ? (
                <label className="sm:w-52">
                  <span className="sr-only">Add a filter</span>
                  <select
                    className="ui-select"
                    value=""
                    onChange={(event) => {
                      addFilter(event.target.value);
                    }}
                  >
                    <option value="">Add a filter</option>
                    {availableFilters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {active ? (
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((id) => {
                  const filter = FILTER_BY_ID.get(id);
                  if (!filter) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFilters((current) => current.filter((item) => item !== id))}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-leaf-soft px-3 text-sm text-leaf-deep"
                      aria-label={`Remove filter: ${filter.label}`}
                    >
                      {filter.label}
                      <span aria-hidden="true">×</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex min-h-11 items-center text-sm text-ember underline-offset-4 hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : null}
          </div>

          {filtered.length ? (
            <ul className="divide-y divide-black/8">
              {filtered.map((person) => (
                <PersonRow key={person.id} person={person} canDelete={canDelete} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-sm text-black/55">No one matches that search.</p>
          )}
        </div>
      </section>

      {showUnplaced ? (
        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Unplaced names</h2>
          <p className="mt-1 text-sm text-black/60">
            From the booklet lists where the parent line is not yet confirmed.
          </p>
          {unplaced.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {unplaced.map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/admin/people/${person.id}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-leaf-soft px-3 text-sm text-leaf-deep"
                  >
                    {person.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-black/55">
              {active ? "No unplaced names match that search." : "Everyone is placed on the tree."}
            </p>
          )}
        </section>
      ) : null}
    </>
  );
}

function PersonRow({
  person,
  canDelete,
}: {
  person: AdminPersonRow;
  canDelete: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <Link href={`/admin/people/${person.id}`} className="font-semibold hover:text-leaf-deep">
          {person.name}
        </Link>
        {person.years ? <p className="text-sm text-black/55">{person.years}</p> : null}
      </div>
      {canDelete ? (
        <form action={deletePersonAction}>
          <input type="hidden" name="id" value={person.id} />
          <button className="min-h-11 text-sm text-black/45 hover:text-leaf-deep">Remove</button>
        </form>
      ) : null}
    </li>
  );
}

function matchesPerson(person: AdminPersonRow, query: string, filters: FilterId[]) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length) {
    const haystack = person.name.toLowerCase();
    if (!tokens.every((token) => haystack.includes(token))) return false;
  }

  for (const filter of filters) {
    switch (filter) {
      case "placed":
        if (!person.placed) return false;
        break;
      case "unplaced":
        if (person.placed) return false;
        break;
      case "living":
        if (person.isDeceased) return false;
        break;
      case "deceased":
        if (!person.isDeceased) return false;
        break;
      case "has-photo":
        if (!person.hasPhoto) return false;
        break;
      case "no-photo":
        if (person.hasPhoto) return false;
        break;
      case "has-headstone":
        if (!person.hasHeadstone) return false;
        break;
      case "no-headstone":
        if (person.hasHeadstone) return false;
        break;
      case "has-familysearch":
        if (!person.hasFamilySearch) return false;
        break;
      case "no-familysearch":
        if (person.hasFamilySearch) return false;
        break;
    }
  }

  return true;
}
