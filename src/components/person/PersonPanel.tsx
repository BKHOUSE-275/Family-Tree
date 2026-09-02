"use client";

import { AnimatePresence, motion } from "framer-motion";
import { displayName, yearRange, type Person } from "@/lib/types";

export function PersonPanel({
  person,
  parents,
  partners,
  childPeople,
  siblings,
  residences,
  contact,
  onSelect,
  onSuggest,
}: {
  person: Person;
  parents: Person[];
  partners: { person: Person; date: string | null; place: string | null; notes: string | null }[];
  childPeople: Person[];
  siblings: Person[];
  residences: { year: string | null; place: string }[];
  contact: {
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  onSelect: (id: string) => void;
  onSuggest?: (personId: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={person.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35 }}
        className="h-fit rounded-3xl border border-bark/10 bg-white/85 p-6 shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-leaf-soft text-leaf-deep ring-2 ring-gold/70 sm:h-24 sm:w-24">
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photoUrl}
                alt={displayName(person)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl">{person.givenName.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-script">Intro</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight break-words sm:text-3xl">
              {displayName(person)}
            </h2>
            <p className="text-sm text-black/60">{yearRange(person)}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <Field label="1. Name" value={displayName(person)} />
          <Field label="1A. Place of birth" value={person.birthPlace} extra={person.birthDate} />
          {person.isDeceased ? (
            <div>
              <dt className="font-semibold text-script">1B. Headstone</dt>
              <dd className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  {person.headstoneLocation ?? "Location not recorded yet"}
                  {person.deathDate ? (
                    <span className="block text-black/55">Died {person.deathDate}</span>
                  ) : (
                    <span className="block text-black/55">Deceased</span>
                  )}
                </div>
                {person.headstonePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.headstonePhotoUrl}
                    alt={`Headstone for ${displayName(person)}`}
                    className="h-28 w-36 shrink-0 rounded-xl object-cover ring-1 ring-bark/15"
                  />
                ) : (
                  <div className="flex h-28 w-36 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-center text-xs text-bark/70">
                    Headstone photo
                  </div>
                )}
              </dd>
            </div>
          ) : (
            <Field label="1B. Headstone" value="Living" />
          )}
          <Field label="2. Address" value={contact?.address} empty="Shared only if this person chooses to" />
          <Field label="3. Telephone" value={contact?.phone} empty="Shared only if this person chooses to" />
          <Field label="4. Email" value={contact?.email} empty="Shared only if this person chooses to" />
          {person.notes ? <Field label="Notes" value={person.notes} /> : null}
        </dl>

        {residences.length ? (
          <section className="mt-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-script">Residences</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {residences.map((row) => (
                <li key={`${row.year}-${row.place}`}>
                  {row.year ? <strong>{row.year}: </strong> : null}
                  {row.place}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <RelationList title="Parents" people={parents} activeId={person.id} onSelect={onSelect} />
        {partners.length ? (
          <section className="mt-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-script">Spouse / partnership</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {partners.map((row) => (
                <li key={row.person.id}>
                  <button
                    className="inline-flex min-h-11 items-center text-left text-ember hover:underline"
                    onClick={() => onSelect(row.person.id)}
                  >
                    {displayName(row.person)}
                  </button>
                  <p className="text-black/60">
                    {[row.date, row.place].filter(Boolean).join(" · ")}
                    {row.notes ? ` — ${row.notes}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <RelationList title="Siblings" people={siblings} activeId={person.id} onSelect={onSelect} />
        <RelationList title="Children" people={childPeople} activeId={person.id} onSelect={onSelect} />

        {onSuggest ? (
          <button
            type="button"
            onClick={() => onSuggest(person.id)}
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-bark/15 bg-leaf-soft px-4 text-sm text-leaf-deep hover:bg-gold/40"
          >
            Suggest a change about {displayName(person)}
          </button>
        ) : null}
      </motion.aside>
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  extra,
  empty = "Not recorded yet",
}: {
  label: string;
  value?: string | null;
  extra?: string | null;
  empty?: string;
}) {
  return (
    <div>
      <dt className="font-semibold text-script">{label}</dt>
      <dd>
        {value || empty}
        {extra ? <span className="block text-black/55">{extra}</span> : null}
      </dd>
    </div>
  );
}

function RelationList({
  title,
  people,
  activeId,
  onSelect,
}: {
  title: string;
  people: Person[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (!people.length) return null;
  return (
    <section className="mt-6">
      <h3 className="text-xs uppercase tracking-[0.2em] text-script">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {people.map((person) => {
          const active = person.id === activeId;
          return (
            <li key={person.id}>
              <button
                onClick={() => onSelect(person.id)}
                aria-pressed={active}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm transition ${
                  active
                    ? "bg-gold text-bark ring-2 ring-ember/70"
                    : "bg-leaf-soft text-leaf-deep hover:bg-leaf hover:text-white"
                }`}
              >
                {displayName(person)}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
