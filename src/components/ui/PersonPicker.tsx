"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { type PersonPickerOption } from "@/lib/types";

export type { PersonPickerOption };

function pickerMatchesQuery(person: PersonPickerOption, query: string) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = [person.label, person.maidenName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function PersonPicker({
  name,
  people,
  defaultValue = "",
  value,
  onChange,
  required = false,
  label,
  emptyLabel = "None",
  allowNone = true,
}: {
  name: string;
  people: PersonPickerOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  required?: boolean;
  label?: ReactNode;
  emptyLabel?: string;
  allowNone?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internal, setInternal] = useState(defaultValue);
  const [active, setActive] = useState(0);
  const selectedId = value ?? internal;

  const filtered = useMemo(
    () => people.filter((person) => pickerMatchesQuery(person, query)),
    [people, query],
  );

  const choices = useMemo(
    () => (allowNone ? [{ id: "", label: emptyLabel }, ...filtered] : filtered),
    [allowNone, emptyLabel, filtered],
  );

  const selected = people.find((person) => person.id === selectedId);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function choose(id: string) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
    setOpen(false);
    setQuery("");
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(choices.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const next = choices[active];
      if (next) choose(next.id);
    }
  }

  return (
    <div ref={rootRef} className="relative block text-sm font-semibold text-script">
      {label ? <span className="mb-1 block">{label}</span> : null}
      <input type="hidden" name={name} value={selectedId} required={required} />
      <button
        type="button"
        className="ui-select mt-1 w-full text-left font-normal"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.label ?? emptyLabel}
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-2xl border border-bark/20 bg-white shadow-lg">
          <div className="border-b border-bark/10 p-2">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search the family"
              className="min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base font-normal"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {choices.length ? (
              choices.map((person, index) => (
                <li key={person.id || "none"}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={person.id === selectedId}
                    className={`flex min-h-11 w-full items-center px-3 text-left font-normal hover:bg-leaf-soft ${
                      index === active ? "bg-leaf-soft text-script" : ""
                    }`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(person.id)}
                  >
                    <span>
                      {person.label}
                      {person.id && person.maidenName ? (
                        <span className="block text-xs font-normal text-black/45">
                          née {person.maidenName}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 font-normal text-black/55">No one matches that name.</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
