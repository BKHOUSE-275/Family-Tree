"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
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
  const [grid, setGrid] = useState(true);
  const drag = useRef<{ index: number } | null>(null);
  const gridId = useId();
  const current = slots[selected];

  const onWindowMove = useEffectEvent((event: PointerEvent) => {
    if (!drag.current) return;
    onSlotsChange(
      moveSlot(slots, drag.current.index, pointToPct(event, frameRef.current)),
    );
  });

  useEffect(() => {
    function onMove(event: PointerEvent) {
      onWindowMove(event);
    }
    // pointercancel too, so a touch drag the browser takes over can't stay "dragging".
    function onUp() {
      drag.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onWindowKey = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return;
    const step = event.shiftKey ? 0.1 : 0.4;
    const index = selected;
    const next = slots;
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
      const parentLabeled = labelFor(0) === "P";
      const index = parentLabeled ? n : n - 1;
      if (index >= 0 && index < next.length) setSelected(index);
    }
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      onWindowKey(event);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      {grid ? <PlacementGrid slot={current} /> : null}
      <AlignmentGuides slots={slots} selected={selected} />

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
          aria-label={`Move circle ${labelFor(index) || index + 1}`}
          aria-pressed={index === selected}
          onPointerDown={(event) => startDrag(index, event)}
          className={`absolute z-40 flex aspect-square items-center justify-center rounded-full border-2 font-bold text-white shadow-lg ${
            index === selected
              ? "border-[#f6b51b] bg-[#c94313]/80 ring-4 ring-[#f6b51b]/40"
              : current &&
                  (axisMatch(slot.cx, current.cx) || axisMatch(slot.cy, current.cy))
                ? "border-[#f6b51b] bg-[#1a3d29]/70 ring-2 ring-dashed ring-[#f6b51b]"
                : "border-white/80 bg-[#1a3d29]/70"
          }`}
          style={{
            left: `${slot.cx}%`,
            top: `${slot.cy}%`,
            width: `${slot.size}%`,
            transform: "translate(-50%, -50%)",
            cursor: "grab",
            touchAction: "none",
          }}
        >
          {labelFor(index)}
        </button>
      ))}

      <aside className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-bark/20 bg-white/95 p-3 text-sm shadow-xl sm:left-auto sm:right-4 sm:translate-x-0">
        <p className="font-medium text-bark">{title}</p>
        <p className="mt-1 text-xs text-bark/70">{help}</p>
        {current ? (
          <label className="mt-3 block text-xs text-bark/80">
            Circle {labelFor(selected) || selected + 1} size
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
        {current ? (
          <p className="mt-2 font-mono text-[11px] text-bark/70">
            {Math.abs(current.cx - 50) < 0.2
              ? `Centerline ${current.cx.toFixed(1)}`
              : `${formatDelta(current.cx - 50)} from center · mirror ${round1(100 - current.cx).toFixed(1)}`}
            {axisMates(slots, selected, "cx").length
              ? ` · same x: ${axisMates(slots, selected, "cx").join(", ")}`
              : ""}
            {axisMates(slots, selected, "cy").length
              ? ` · same y: ${axisMates(slots, selected, "cy").join(", ")}`
              : ""}
          </p>
        ) : null}
        <div className="mt-2 max-h-44 overflow-auto">
          <div className="grid grid-cols-[1.75rem_1fr_1fr_2.5rem] gap-x-2 px-1 font-mono text-[10px] text-bark/50">
            <span>#</span>
            <span>cx</span>
            <span>cy</span>
            <span>size</span>
          </div>
          <ol className="mt-1 space-y-0.5 font-mono text-[11px]">
            {slots.map((slot, index) => {
              const name = labelFor(index) || String(index + 1);
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => setSelected(index)}
                    className={`grid w-full grid-cols-[1.75rem_1fr_1fr_2.5rem] gap-x-2 rounded px-1 py-0.5 text-left tabular-nums ${
                      index === selected ? "bg-gold/40" : "hover:bg-leaf-soft"
                    }`}
                  >
                    <span>{name}</span>
                    <span className={axisClass(slot.cx, current?.cx, 50)}>
                      {slot.cx.toFixed(1)}
                    </span>
                    <span className={axisClass(slot.cy, current?.cy)}>
                      {slot.cy.toFixed(1)}
                    </span>
                    <span>{slot.size.toFixed(1)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
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

function PlacementGrid({ slot }: { slot?: PctSlot }) {
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const mirrorX = slot ? round1(100 - slot.cx) : 50;
  const showMirror = Boolean(slot && Math.abs(slot.cx - 50) >= 0.2);

  return (
    <div className="pointer-events-none absolute inset-0 z-[8]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full">
        {Array.from({ length: 99 }, (_, index) => index + 1).map((n) => {
          const center = n === 50;
          const major = n % 10 === 0;
          const mid = n % 5 === 0;
          const stroke = center
            ? "rgba(196,92,38,0.72)"
            : major
              ? "rgba(92,58,33,0.42)"
              : mid
                ? "rgba(92,58,33,0.24)"
                : "rgba(92,58,33,0.1)";
          const width = center ? 2 : major ? 1.25 : 1;
          return (
            <g key={n}>
              <line
                x1={`${n}%`}
                y1="0"
                x2={`${n}%`}
                y2="100%"
                stroke={stroke}
                strokeWidth={width}
              />
              <line
                x1="0"
                y1={`${n}%`}
                x2="100%"
                y2={`${n}%`}
                stroke={stroke}
                strokeWidth={width}
              />
            </g>
          );
        })}
        {showMirror ? (
          <line
            x1={`${mirrorX}%`}
            y1="0"
            x2={`${mirrorX}%`}
            y2="100%"
            stroke="#f6b51b"
            strokeWidth={1.5}
            strokeDasharray="6 5"
            opacity={0.7}
          />
        ) : null}
      </svg>
      {ticks.map((n) => (
        <span
          key={`x-${n}`}
          className={`absolute top-1 -translate-x-1/2 rounded bg-white/75 px-0.5 font-mono text-[10px] tabular-nums ${
            n === 50 ? "font-semibold text-ember" : "text-bark/70"
          }`}
          style={{ left: `${n}%` }}
        >
          {n}
        </span>
      ))}
      {ticks.map((n) => (
        <span
          key={`y-${n}`}
          className={`absolute left-1 -translate-y-1/2 rounded bg-white/75 px-0.5 font-mono text-[10px] tabular-nums ${
            n === 50 ? "font-semibold text-ember" : "text-bark/70"
          }`}
          style={{ top: `${n}%` }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function AlignmentGuides({
  slots,
  selected,
}: {
  slots: PctSlot[];
  selected: number;
}) {
  const vertical = groupByAxis(slots, "cx").map(([x, indexes]) => ({
    x,
    y1: Math.min(...indexes.map((index) => slots[index]!.cy)),
    y2: Math.max(...indexes.map((index) => slots[index]!.cy)),
    active: indexes.includes(selected),
  }));
  const horizontal = groupByAxis(slots, "cy").map(([y, indexes]) => ({
    y,
    x1: Math.min(...indexes.map((index) => slots[index]!.cx)),
    x2: Math.max(...indexes.map((index) => slots[index]!.cx)),
    active: indexes.includes(selected),
  }));

  if (vertical.length === 0 && horizontal.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[45] h-full w-full"
      aria-hidden
    >
      {vertical.map((guide) => (
        <line
          key={`v-${guide.x}-${guide.y1}-${guide.y2}`}
          x1={`${guide.x}%`}
          y1={`${guide.y1}%`}
          x2={`${guide.x}%`}
          y2={`${guide.y2}%`}
          stroke="#f6b51b"
          strokeWidth={guide.active ? 3 : 2}
          strokeDasharray="8 7"
          strokeLinecap="round"
          opacity={guide.active ? 1 : 0.45}
        />
      ))}
      {horizontal.map((guide) => (
        <line
          key={`h-${guide.y}-${guide.x1}-${guide.x2}`}
          x1={`${guide.x1}%`}
          y1={`${guide.y}%`}
          x2={`${guide.x2}%`}
          y2={`${guide.y}%`}
          stroke="#f6b51b"
          strokeWidth={guide.active ? 3 : 2}
          strokeDasharray="8 7"
          strokeLinecap="round"
          opacity={guide.active ? 1 : 0.45}
        />
      ))}
    </svg>
  );
}

function groupByAxis(slots: PctSlot[], axis: "cx" | "cy") {
  const groups = new Map<number, number[]>();
  slots.forEach((slot, index) => {
    const key = round1(slot[axis]);
    const list = groups.get(key);
    if (list) list.push(index);
    else groups.set(key, [index]);
  });
  return [...groups.entries()].filter(([, indexes]) => indexes.length >= 2);
}

function axisMatch(a: number, b: number) {
  return Math.abs(a - b) < 0.05;
}

function axisClass(value: number, selected?: number, center?: number) {
  if (selected != null && axisMatch(value, selected)) {
    return "font-semibold text-ember";
  }
  if (center != null && axisMatch(value, center)) {
    return "text-ember";
  }
  return "";
}

function axisMates(slots: PctSlot[], selected: number, axis: "cx" | "cy") {
  const current = slots[selected];
  if (!current) return [];
  return slots.flatMap((slot, index) =>
    index !== selected && axisMatch(slot[axis], current[axis])
      ? [String(index + 1)]
      : [],
  );
}

function formatDelta(value: number) {
  const rounded = round1(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}`;
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
  const snapped = snapToSiblings(slots, index, point);
  return slots.map((slot, i) =>
    i === index
      ? { ...slot, cx: snapped.cx, cy: snapped.cy }
      : slot,
  );
}

function snapToSiblings(
  slots: PctSlot[],
  index: number,
  point: { cx: number; cy: number },
) {
  const snap = 0.35;
  let cx = point.cx;
  let cy = point.cy;
  let bestX = snap;
  let bestY = snap;
  slots.forEach((slot, i) => {
    if (i === index) return;
    const dx = Math.abs(slot.cx - point.cx);
    const dy = Math.abs(slot.cy - point.cy);
    if (dx <= bestX) {
      bestX = dx;
      cx = slot.cx;
    }
    if (dy <= bestY) {
      bestY = dy;
      cy = slot.cy;
    }
  });
  return { cx: round1(cx), cy: round1(cy) };
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

/** Keys typed into form fields or editable text must not nudge circles. */
function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
