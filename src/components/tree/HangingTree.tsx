import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PersonLeaf } from "@/components/tree/PersonLeaf";
import { displayName, type Person } from "@/lib/types";

const VIEW = { w: 461, h: 612 };
const TREE_SRC = "/tree.png";

type Slot = {
  x: number;
  y: number;
  rotate: number;
};

type Point = { x: number; y: number; rotate: number };

const CANOPY_EIGHT: Slot[] = [
  { x: 78, y: 248, rotate: -16 },
  { x: 128, y: 148, rotate: -10 },
  { x: 186, y: 88, rotate: -4 },
  { x: 274, y: 88, rotate: 4 },
  { x: 332, y: 148, rotate: 10 },
  { x: 382, y: 248, rotate: 16 },
  { x: 156, y: 318, rotate: -7 },
  { x: 304, y: 318, rotate: 7 },
];

const SUBJECT_SLOT: Slot = {
  x: 230,
  y: 150,
  rotate: 0,
};

export function HangingTree({
  father,
  mother,
  isTopLevel,
  subject,
  canopyPeople,
  hangingChildren,
  focusId,
  onSelect,
}: {
  father: Person;
  mother: Person;
  isTopLevel: boolean;
  subject: Person | null;
  canopyPeople: Person[];
  hangingChildren: Person[];
  focusId: string;
  onSelect: (id: string) => void;
}) {
  const slots = isTopLevel ? canopySlots(canopyPeople.length) : [];
  const subjectSlot = !isTopLevel && subject ? SUBJECT_SLOT : null;
  const childOrigin = isTopLevel ? null : subjectSlot;
  const childPoints = childOrigin
    ? childCluster(childOrigin, hangingChildren.length)
    : [];

  return (
    <div
      className="relative mx-auto w-full max-w-xl"
      style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
    >
      <p className="sr-only">
        Family tree with Felix and Adaline at the roots. Select a leaf to open
        that person and see only their children.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TREE_SRC}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain object-bottom"
      />

      <div className="absolute inset-0">
        {isTopLevel
          ? canopyPeople.map((person, index) => {
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
            })
          : null}

        {!isTopLevel && subject && subjectSlot ? (
          <LeafAnchor key={subject.id} point={subjectSlot} size="md" z={30}>
            <PersonLeaf
              person={subject}
              active
              size="md"
              rotate={0}
              swayDelay={0}
              onClick={() => onSelect(subject.id)}
            />
          </LeafAnchor>
        ) : null}

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
        </AnimatePresence>

        <RootPlaque
          person={father}
          active={focusId === father.id}
          x={132}
          y={518}
          onClick={() => onSelect(father.id)}
        />
        <p
          className="pointer-events-none absolute font-[family-name:var(--font-script)] text-2xl text-script sm:text-3xl"
          style={{
            left: "50%",
            top: `${(522 / VIEW.h) * 100}%`,
            transform: "translate(-50%, 0)",
          }}
        >
          &
        </p>
        <RootPlaque
          person={mother}
          active={focusId === mother.id}
          x={328}
          y={518}
          onClick={() => onSelect(mother.id)}
        />
        <p
          className="pointer-events-none absolute w-full text-center text-[0.65rem] uppercase tracking-[0.28em] text-script"
          style={{ top: `${(572 / VIEW.h) * 100}%` }}
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
      className={`absolute ${
        size === "md"
          ? "w-[clamp(4.25rem,12%,8.6rem)]"
          : "w-[clamp(3.6rem,10%,7.2rem)]"
      }`}
      style={{
        left: `${(point.x / VIEW.w) * 100}%`,
        top: `${(point.y / VIEW.h) * 100}%`,
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
      className={`absolute z-20 max-w-[38%] -translate-x-1/2 rounded-full px-3 py-2 text-center font-[family-name:var(--font-display)] text-sm leading-tight shadow-sm transition sm:max-w-none sm:px-4 sm:text-xl ${
        active ? "bg-gold text-bark" : "bg-white/90 text-bark hover:bg-leaf-soft"
      } min-h-11`}
      style={{ left: `${(x / VIEW.w) * 100}%`, top: `${(y / VIEW.h) * 100}%` }}
    >
      {displayName(person)}
    </button>
  );
}

function canopySlots(count: number): Slot[] {
  if (count === 8) return CANOPY_EIGHT;
  if (count === 0) return [];
  const cx = VIEW.w / 2;
  const cy = VIEW.h * 0.34;
  const rx = VIEW.w * 0.38;
  const ry = VIEW.h * 0.22;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI * (0.92 - t * 0.84);
    return {
      x: cx + Math.cos(angle) * rx,
      y: cy - Math.sin(angle) * ry,
      rotate: (t - 0.5) * 28,
    };
  });
}

function childCluster(origin: Point, count: number, scale = 1): Point[] {
  if (count === 0) return [];
  const childW = 52 * scale;
  const gap = 5;
  const hang = 58 * scale;
  const rowDy = 62 * scale;
  const rows = count <= 5 ? [count] : [Math.ceil(count / 2), Math.floor(count / 2)];
  const prefer =
    origin.x < VIEW.w * 0.35 ? "right" : origin.x > VIEW.w * 0.65 ? "left" : "center";
  const points: Point[] = [];

  rows.forEach((n, row) => {
    const width = n * childW + (n - 1) * gap;
    let start = origin.x - width / 2 + childW / 2;
    if (prefer === "right") start = origin.x + 8;
    if (prefer === "left") start = origin.x - width - 8 + childW;
    start = Math.max(36, Math.min(start, VIEW.w - 36 - (width - childW)));
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
