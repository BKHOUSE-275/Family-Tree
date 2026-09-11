"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { formatCanopySlots } from "@/components/tree/treeSlots";
import type { PctSlot } from "@/components/tree/treeGeometry";

export function SlotPlacer({
  frameRef,
  slots,
  onSlotsChange,
  formatSlots = formatCanopySlots,
  title = "Place the portraits",
  help = "Drag a numbered circle, or select one and click the tree. Arrow keys nudge. [ and ] change size.",
  labelFor = (index) => String(index + 1),
  onAdd,
  onRemove,
}: {
  frameRef: RefObject<HTMLElement | null>;
  slots: PctSlot[];
  onSlotsChange: (slots: PctSlot[]) => void;
  formatSlots?: (slots: PctSlot[]) => string;
  title?: string;
  help?: string;
  labelFor?: (index: number) => string;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [grid, setGrid] = useState(false);
  const drag = useRef<{ index: number } | null>(null);
  const slotsRef = useRef(slots);
  const selectedRef = useRef(selected);
  const labelForRef = useRef(labelFor);
  const gridId = useId();
  const current = slots[selected];
  slotsRef.current = slots;
  selectedRef.current = selected;
  labelForRef.current = labelFor;

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!drag.current) return;
      onSlotsChange(
        moveSlot(
          slotsRef.current,
          drag.current.index,
          pointToPct(event, frameRef.current),
        ),
      );
    }
    function onUp() {
      drag.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [frameRef, onSlotsChange]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) return;
      const step = event.shiftKey ? 0.1 : 0.4;
      const index = selectedRef.current;
      const next = slotsRef.current;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onSlotsChange(nudgeSlot(next, index, -step, 0));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onSlotsChange(nudgeSlot(next, index, step, 0));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        onSlotsChange(nudgeSlot(next, index, 0, -step));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onSlotsChange(nudgeSlot(next, index, 0, step));
      } else if (event.key === "[" || event.key === "-") {
        event.preventDefault();
        onSlotsChange(resizeSlot(next, index, -0.2));
      } else if (event.key === "]" || event.key === "=" || event.key === "+") {
        event.preventDefault();
        onSlotsChange(resizeSlot(next, index, 0.2));
      } else if (event.key === "p" || event.key === "P") {
        setSelected(0);
      } else if (/^[1-9]$/.test(event.key)) {
        const n = Number(event.key);
        const parentLabeled = labelForRef.current(0) === "P";
        const index = parentLabeled ? n : n - 1;
        if (index >= 0 && index < next.length) setSelected(index);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSlotsChange]);

  function startDrag(index: number, event: ReactPointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSelected(index);
    drag.current = { index };
  }

  async function copySlots() {
    const text = formatSlots(slots);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      {grid ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[8]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(92,58,33,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(92,58,33,0.18) 1px, transparent 1px)",
            backgroundSize: "5% 5%",
          }}
        />
      ) : null}

      <div
        className="absolute inset-0 z-[6] cursor-crosshair"
        onPointerDown={(event) => {
          onSlotsChange(
            moveSlot(slots, selected, pointToPct(event.nativeEvent, frameRef.current)),
          );
        }}
      />

      {slots.map((slot, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Move circle ${labelFor(index)}`}
          aria-pressed={index === selected}
          onPointerDown={(event) => startDrag(index, event)}
          className={`absolute z-40 flex aspect-square items-center justify-center rounded-full border-2 font-bold text-white shadow-lg ${
            index === selected
              ? "border-[#f6b51b] bg-[#c94313]/80 ring-4 ring-[#f6b51b]/40"
              : "border-white/80 bg-[#1a3d29]/70"
          }`}
          style={{
            left: `${slot.cx}%`,
            top: `${slot.cy}%`,
            width: `${slot.size}%`,
            transform: "translate(-50%, -50%)",
            cursor: "grab",
          }}
        >
          {labelFor(index)}
        </button>
      ))}

      <aside className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-bark/20 bg-white/95 p-3 text-sm shadow-xl">
        <p className="font-medium text-bark">{title}</p>
        <p className="mt-1 text-xs text-bark/70">{help}</p>
        {current ? (
          <label className="mt-3 block text-xs text-bark/80">
            Circle {labelFor(selected)} size
            <input
              type="range"
              min={5}
              max={14}
              step={0.1}
              value={current.size}
              onChange={(event) =>
                onSlotsChange(
                  resizeSlot(
                    slots,
                    selected,
                    Number(event.target.value) - current.size,
                  ),
                )
              }
              className="mt-1 w-full"
            />
            <span className="tabular-nums">{current.size.toFixed(1)}%</span>
          </label>
        ) : null}
        <ol className="mt-2 max-h-40 space-y-1 overflow-auto font-mono text-[11px]">
          {slots.map((slot, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                className={`w-full rounded px-1 py-0.5 text-left ${
                  index === selected ? "bg-gold/40" : "hover:bg-leaf-soft"
                }`}
              >
                {labelFor(index)}: {slot.cx.toFixed(1)}, {slot.cy.toFixed(1)},{" "}
                {slot.size.toFixed(1)}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copySlots()}
            className="min-h-11 rounded-full bg-bark px-4 text-white"
          >
            {copied ? "Copied" : "Copy locations"}
          </button>
          <label className="inline-flex min-h-11 items-center gap-2 text-xs text-bark/80">
            <input
              id={gridId}
              type="checkbox"
              checked={grid}
              onChange={(event) => setGrid(event.target.checked)}
            />
            Grid
          </label>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="min-h-11 rounded-full border border-bark/20 px-3 text-bark"
            >
              Add child
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="min-h-11 rounded-full border border-bark/20 px-3 text-bark"
            >
              Remove last
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function pointToPct(event: PointerEvent, frame: HTMLElement | null) {
  if (!frame) return { cx: 50, cy: 50 };
  const rect = frame.getBoundingClientRect();
  return {
    cx: clamp(((event.clientX - rect.left) / rect.width) * 100, 3, 97),
    cy: clamp(((event.clientY - rect.top) / rect.height) * 100, 3, 97),
  };
}

function moveSlot(
  slots: PctSlot[],
  index: number,
  point: { cx: number; cy: number },
) {
  return slots.map((slot, i) =>
    i === index
      ? { ...slot, cx: round1(point.cx), cy: round1(point.cy) }
      : slot,
  );
}

function nudgeSlot(
  slots: PctSlot[],
  index: number,
  dx: number,
  dy: number,
) {
  return slots.map((slot, i) =>
    i === index
      ? {
          ...slot,
          cx: clamp(round1(slot.cx + dx), 3, 97),
          cy: clamp(round1(slot.cy + dy), 3, 97),
        }
      : slot,
  );
}

function resizeSlot(slots: PctSlot[], index: number, delta: number) {
  return slots.map((slot, i) =>
    i === index
      ? { ...slot, size: clamp(round1(slot.size + delta), 5, 14) }
      : slot,
  );
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
