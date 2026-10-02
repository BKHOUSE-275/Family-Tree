"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlbumCover } from "@/components/gallery/AlbumCover";

export type AlbumOption = {
  id: string;
  title: string;
  detail: string;
  thumbs: string[];
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 text-bark/60 transition ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionBody({ album }: { album: AlbumOption }) {
  return (
    <>
      <AlbumCover thumbs={album.thumbs.slice(0, 4)} title="" className="h-11 w-11 shrink-0 rounded-lg" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-[family-name:var(--font-display)] text-lg leading-tight text-ink">
          {album.title}
        </span>
        <span className="block truncate text-xs text-black/55">{album.detail}</span>
      </span>
    </>
  );
}

/** Album dropdown with covers, styled to match the site. Works with mouse, touch, and keyboard. */
export function AlbumPicker({
  albums,
  value,
  onChange,
  disabled,
  labelId,
}: {
  albums: AlbumOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  labelId: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = Math.max(0, albums.findIndex((album) => album.id === value));
  const selected = albums[selectedIndex];

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    const album = albums[index];
    if (album) onChange(album.id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onListKey(event: React.KeyboardEvent) {
    const last = albums.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show();
          }
        }}
        className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-left transition hover:border-gold focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none disabled:opacity-60 ${
          open ? "border-gold ring-2 ring-gold/60" : "border-bark/20"
        }`}
      >
        {selected ? <OptionBody album={selected} /> : <span className="flex-1 text-black/50">Choose an album</span>}
        <Chevron open={open} />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-2xl border border-bark/15 bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(42,24,16,0.45)] focus:outline-none"
        >
          {albums.map((album, index) => {
            const isSelected = album.id === value;
            return (
              <li
                key={album.id}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition ${
                  index === active ? "bg-gold/25" : ""
                } ${isSelected ? "ring-1 ring-gold" : ""}`}
              >
                <OptionBody album={album} />
                {isSelected ? (
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-leaf">
                    <path d="M4.5 10.5 8.5 14.5 15.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
