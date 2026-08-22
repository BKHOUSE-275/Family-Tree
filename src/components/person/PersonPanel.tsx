"use client";

import { AnimatePresence, motion } from "framer-motion";
import { displayName, yearRange, type Person } from "@/lib/types";

export function PersonPanel({
  person,
  parents,
  partners,
  children,
  siblings,
  residences,
  contact,
  onSelect,
}: {
  person: Person;
  parents: Person[];
  partners: { person: Person; date: string | null; place: string | null; notes: string | null }[];
  children: Person[];
  siblings: Person[];
  residences: { year: string | null; place: string }[];
  contact: {
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  onSelect: (id: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={person.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.35 }}
        className="h-fit rounded-3xl border border-black/8 bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgba(27,27,27,0.45)]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-leaf-soft text-leaf-deep">
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photoUrl}
                alt={displayName(person)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">{person.givenName.slice(0, 1)}</span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-script">Intro</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl leading-tight">
              {displayName(person)}
            </h2>
            <p className="text-sm text-black/60">{yearRange(person)}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <Field label="1. Name" value={displayName(person)} />
          <Field label="1A. Place of birth" value={person.birthPlace} extra={person.birthDate} />
          {person.isDeceased ? (
            <Field
              label="1B. Headstone"
              value={person.headstoneLocation ?? "Location not recorded yet"}
              extra={person.deathDate ? `Died ${person.deathDate}` : "Deceased"}
            />
          ) : (
            <Field label="1B. Headstone" value="Living" />
          )}
          <Field label="2. Address" value={contact?.address} empty="Shared only if this person chooses to" />
          <Field label="3. Telephone" value={contact?.phone} empty="Shared only if this person chooses to" />
          <Field label="4. Email" value={contact?.email} empty="Shared only if this person chooses to" />
          {person.familysearchId ? (
            <Field label="FamilySearch ID" value={person.familysearchId} />
          ) : null}
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

        <RelationList title="Parents" people={parents} onSelect={onSelect} />
        {partners.length ? (
          <section className="mt-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-script">Spouse / partnership</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {partners.map((row) => (
                <li key={row.person.id}>
                  <button className="text-left text-leaf-deep hover:underline" onClick={() => onSelect(row.person.id)}>
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
        <RelationList title="Siblings" people={siblings} onSelect={onSelect} />
        <RelationList title="Children" people={children} onSelect={onSelect} />
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
  onSelect,
}: {
  title: string;
  people: Person[];
  onSelect: (id: string) => void;
}) {
  if (!people.length) return null;
  return (
    <section className="mt-6">
      <h3 className="text-xs uppercase tracking-[0.2em] text-script">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {people.map((person) => (
          <li key={person.id}>
            <button
              onClick={() => onSelect(person.id)}
              className="rounded-full bg-leaf-soft px-3 py-1 text-sm text-leaf-deep transition hover:bg-leaf hover:text-white"
            >
              {displayName(person)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
