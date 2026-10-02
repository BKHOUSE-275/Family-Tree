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
  const baseId = useId();
  const listId = `${baseId}-list`;
  const labelId = `${baseId}-label`;
  const triggerId = `${baseId}-trigger`;
  const errorId = `${baseId}-error`;
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internal, setInternal] = useState(defaultValue);
  const [active, setActive] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const selectedId = value ?? internal;
  const showError = invalid && required && !selectedId;

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

  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${baseId}-option-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, baseId, open]);

  function close() {
    setOpen(false);
    setQuery("");
    // The search box unmounts on close; hand focus back to the trigger.
    triggerRef.current?.focus();
  }

  function choose(id: string) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
    if (id) setInvalid(false);
    close();
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
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
      {label ? (
        <span id={labelId} className="mb-1 block">
          {label}
        </span>
      ) : null}
      {/*
        Visually hidden but still validatable (type="hidden" skips constraint
        validation), so `required` actually blocks an empty submit.
      */}
      <input
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        name={name}
        value={selectedId}
        required={required}
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          const input = event.currentTarget;
          if (input.form?.querySelector(":invalid") === input) {
            triggerRef.current?.focus();
          }
        }}
      />
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="ui-select mt-1 w-full text-left font-normal"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
        aria-describedby={showError ? errorId : undefined}
        onClick={() => {
          setActive(0);
          setOpen((current) => !current);
        }}
      >
        {selected?.label ?? emptyLabel}
      </button>
      {showError ? (
        <p id={errorId} role="alert" className="mt-1 text-xs font-normal text-ember">
          Choose someone from the list.
        </p>
      ) : null}
      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-2xl border border-bark/20 bg-white shadow-lg">
          <div className="border-b border-bark/10 p-2">
            <input
              ref={searchRef}
              role="combobox"
              aria-label="Search the family"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={choices[active] ? optionId(active) : undefined}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
              placeholder="Search the family"
              className="min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base font-normal"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            aria-label={label ? undefined : "People"}
            className="max-h-[min(16rem,50dvh)] overflow-y-auto py-1"
          >
            {choices.map((person, index) => (
              <li
                key={person.id || "none"}
                id={optionId(index)}
                role="option"
                aria-selected={person.id === selectedId}
                className={`flex min-h-11 w-full cursor-pointer items-center px-3 text-left font-normal hover:bg-leaf-soft ${
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
              </li>
            ))}
          </ul>
          {choices.length ? null : (
            <p className="px-3 py-3 font-normal text-black/55">No one matches that name.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
