import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PersonLeaf } from "@/components/tree/PersonLeaf";
import { displayName, type Person } from "@/lib/types";

const VIEW = { w: 800, h: 760 };

type Slot = {
  x: number;
  y: number;
  rotate: number;
  stemFrom: { x: number; y: number };
};

type Point = { x: number; y: number; rotate: number };

const CANOPY_EIGHT: Slot[] = [
  { x: 88, y: 188, rotate: -16, stemFrom: { x: 168, y: 158 } },
  { x: 198, y: 86, rotate: -9, stemFrom: { x: 258, y: 72 } },
  { x: 322, y: 40, rotate: -3, stemFrom: { x: 360, y: 36 } },
  { x: 478, y: 40, rotate: 3, stemFrom: { x: 440, y: 36 } },
  { x: 602, y: 86, rotate: 9, stemFrom: { x: 542, y: 72 } },
  { x: 712, y: 188, rotate: 16, stemFrom: { x: 632, y: 158 } },
  { x: 248, y: 246, rotate: -7, stemFrom: { x: 318, y: 206 } },
  { x: 552, y: 246, rotate: 7, stemFrom: { x: 482, y: 206 } },
];

const canopyDots = Array.from({ length: 36 }, (_, i) => ({
  cx: 400 + Math.cos(i * 1.07) * (90 + (i % 6) * 38),
  cy: 168 + Math.sin(i * 0.93) * (58 + (i % 5) * 16),
  r: 10 + (i % 4) * 4,
}));

export function HangingTree({
  father,
  mother,
  firstGeneration,
  focusId,
  hangFromId,
  hangingChildren,
  nestedChildren,
  onSelect,
}: {
  father: Person;
  mother: Person;
  firstGeneration: Person[];
  focusId: string;
  hangFromId: string | null;
  hangingChildren: Person[];
  nestedChildren: Person[];
  onSelect: (id: string) => void;
}) {
  const slots = canopySlots(firstGeneration.length);
  const hangIndex = hangFromId
    ? firstGeneration.findIndex((person) => person.id === hangFromId)
    : -1;
  const hangSlot = hangIndex >= 0 ? slots[hangIndex] : null;
  const childPoints = hangSlot
    ? childCluster(hangSlot, hangingChildren.length)
    : [];
  const nestedOrigin =
    hangFromId && hangFromId !== focusId
      ? childPoints[hangingChildren.findIndex((person) => person.id === focusId)]
      : undefined;
  const nestedPoints = nestedOrigin
    ? childCluster(nestedOrigin, nestedChildren.length, 0.72)
    : [];

  return (
    <div className="overflow-x-auto">
      <div
        className="relative mx-auto min-w-[40rem] w-full"
        style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
      >
        <p className="sr-only">
          Family tree with Felix and Adaline at the roots and their descendants
          hanging as leaves. Select a leaf to open that person.
        </p>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {canopyDots.map((dot, i) => (
            <circle key={i} className="leaf-dot" {...dot} />
          ))}

          <g className="grow-trunk">
            <ellipse cx="400" cy="722" rx="250" ry="16" fill="#e4d0be" opacity="0.7" />
            <path
              d="M400 710 c-12 -100 -8 -210 -3 -318 c12 -24 20 -40 20 -64 c0 24 12 42 22 66 c6 104 10 210 -3 316z"
              fill="#111"
            />
            <path d="M396 668 c-58 24 -108 42 -158 52" stroke="#111" strokeWidth="9" fill="none" />
            <path d="M404 676 c60 20 114 38 162 48" stroke="#111" strokeWidth="9" fill="none" />
            <path d="M394 692 c-40 10 -72 14 -108 16" stroke="#111" strokeWidth="6" fill="none" />
            <path d="M406 696 c42 8 80 12 114 14" stroke="#111" strokeWidth="6" fill="none" />
            <path
              d="M424 360 c58 -26 118 -12 168 10 M376 356 c-62 -24 -128 -8 -176 16 M436 318 c48 -54 108 -64 162 -50 M364 316 c-52 -50 -118 -54 -172 -34 M400 286 c-14 -96 12 -150 0 -206 M348 298 c-32 -70 -16 -124 12 -168 M452 296 c34 -68 26 -122 8 -164 M400 340 c-8 -40 6 -70 0 -108"
              stroke="#111"
              strokeWidth="3.2"
              fill="none"
            />
          </g>

          <g>
            {slots.map((slot, i) => (
              <path
                key={`stem-${i}`}
                className="hang-stem"
                d={stemPath(slot.stemFrom, { x: slot.x, y: slot.y })}
                strokeWidth="2.2"
              />
            ))}
          </g>

          <AnimatePresence>
            {hangSlot && childPoints.length ? (
              <motion.g
                key={`twig-${hangFromId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {childPoints.map((point, i) => (
                  <path
                    key={`child-stem-${i}`}
                    className="hang-stem"
                    d={stemPath({ x: hangSlot.x, y: hangSlot.y + 10 }, point)}
                    strokeWidth="1.6"
                  />
                ))}
                {nestedPoints.map((point, i) => (
                  <path
                    key={`nested-stem-${i}`}
                    className="hang-stem"
                    d={stemPath(
                      nestedOrigin ?? hangSlot,
                      point,
                    )}
                    strokeWidth="1.4"
                  />
                ))}
              </motion.g>
            ) : null}
          </AnimatePresence>
        </svg>

        {firstGeneration.map((person, index) => {
          const slot = slots[index];
          if (!slot) return null;
          return (
            <LeafAnchor
              key={person.id}
              point={slot}
              size="md"
              z={focusId === person.id ? 30 : 10}
            >
              <PersonLeaf
                person={person}
                active={focusId === person.id}
                size="md"
                rotate={slot.rotate}
                swayDelay={index * 0.18}
                onClick={() => onSelect(person.id)}
              />
            </LeafAnchor>
          );
        })}

        <AnimatePresence>
          {hangingChildren.map((person, index) => {
            const point = childPoints[index];
            if (!point) return null;
            return (
              <LeafAnchor key={person.id} point={point} size="sm" z={20}>
                <motion.div
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                >
                  <PersonLeaf
                    person={person}
                    active={focusId === person.id}
                    size="sm"
                    rotate={point.rotate}
                    swayDelay={0.3 + index * 0.12}
                    onClick={() => onSelect(person.id)}
                  />
                </motion.div>
              </LeafAnchor>
            );
          })}
          {nestedChildren.map((person, index) => {
            const point = nestedPoints[index];
            if (!point) return null;
            return (
              <LeafAnchor key={person.id} point={point} size="sm" z={25}>
                <motion.div
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.12 + index * 0.04, duration: 0.35 }}
                >
                  <PersonLeaf
                    person={person}
                    active={focusId === person.id}
                    size="sm"
                    rotate={point.rotate}
                    swayDelay={0.5 + index * 0.1}
                    onClick={() => onSelect(person.id)}
                  />
                </motion.div>
              </LeafAnchor>
            );
          })}
        </AnimatePresence>

        <RootPlaque
          person={father}
          active={focusId === father.id}
          x={268}
          y={648}
          onClick={() => onSelect(father.id)}
        />
        <p
          className="pointer-events-none absolute font-[family-name:var(--font-script)] text-3xl text-script"
          style={{ left: "50%", top: `${(652 / VIEW.h) * 100}%`, transform: "translate(-50%, 0)" }}
        >
          &
        </p>
        <RootPlaque
          person={mother}
          active={focusId === mother.id}
          x={532}
          y={648}
          onClick={() => onSelect(mother.id)}
        />
        <p
          className="pointer-events-none absolute w-full text-center text-[0.65rem] uppercase tracking-[0.28em] text-script"
          style={{ top: `${(708 / VIEW.h) * 100}%` }}
        >
          Great-great-grandparents
        </p>
      </div>
    </div>
  );
}

function LeafAnchor({
  point,
  size,
  z = 10,
  children,
}: {
  point: Point;
  size: "sm" | "md";
  z?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: `${(point.x / VIEW.w) * 100}%`,
        top: `${(point.y / VIEW.h) * 100}%`,
        width: size === "md" ? "clamp(6.4rem, 14%, 8.6rem)" : "clamp(5.5rem, 11.5%, 7.2rem)",
        transform: "translate(-50%, 0)",
        zIndex: z,
      }}
    >
      {children}
    </div>
  );
}

function RootPlaque({
  person,
  active,
  x,
  y,
  onClick,
}: {
  person: Person;
  active: boolean;
  x: number;
  y: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`absolute z-20 -translate-x-1/2 rounded-full px-4 py-1.5 font-[family-name:var(--font-display)] text-lg shadow-sm transition sm:text-xl ${
        active ? "bg-bark text-white" : "bg-white text-bark hover:bg-leaf-soft"
      }`}
      style={{ left: `${(x / VIEW.w) * 100}%`, top: `${(y / VIEW.h) * 100}%` }}
    >
      {displayName(person)}
    </button>
  );
}

function canopySlots(count: number): Slot[] {
  if (count === 8) return CANOPY_EIGHT;
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI * (0.92 - t * 0.84);
    const rx = 330;
    const ry = 175;
    const x = 400 + Math.cos(angle) * rx;
    const y = 210 - Math.sin(angle) * ry;
    return {
      x,
      y,
      rotate: (t - 0.5) * 28,
      stemFrom: {
        x: 400 + Math.cos(angle) * (rx * 0.52),
        y: 250 - Math.sin(angle) * (ry * 0.42),
      },
    };
  });
}

function childCluster(origin: Point, count: number, scale = 1): Point[] {
  if (count === 0) return [];
  const childW = 92 * scale;
  const gap = 8;
  const hang = 58 * scale;
  const rowDy = 76 * scale;
  const rows = count <= 5 ? [count] : [Math.ceil(count / 2), Math.floor(count / 2)];
  const prefer =
    origin.x < 280 ? "right" : origin.x > 520 ? "left" : "center";
  const points: Point[] = [];

  rows.forEach((n, row) => {
    const width = n * childW + (n - 1) * gap;
    let start = origin.x - width / 2 + childW / 2;
    if (prefer === "right") start = origin.x + 8;
    if (prefer === "left") start = origin.x - width - 8 + childW;
    start = Math.max(56, Math.min(start, VIEW.w - 56 - (width - childW)));
    const y = origin.y + hang + row * rowDy;
    for (let c = 0; c < n; c += 1) {
      const t = n === 1 ? 0.5 : c / (n - 1);
      points.push({
        x: start + c * (childW + gap),
        y,
        rotate: (t - 0.5) * 12,
      });
    }
  });

  return points;
}

function stemPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midY = from.y + (to.y - from.y) * 0.45;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${to.y - 22}, ${to.x} ${to.y}`;
}
