import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FallTrunk, LeafShape, makeFoliage } from "@/components/tree/FallFoliage";
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

const SUBJECT_SLOT: Slot = {
  x: 400,
  y: 132,
  rotate: 0,
  stemFrom: { x: 400, y: 96 },
};

const foliage = makeFoliage(400, 168, 310, 150, 120, 19);

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
      className="relative mx-auto w-full"
      style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
    >
      <p className="sr-only">
        Family tree with Felix and Adaline at the roots. Select a leaf to open
        that person and see only their children.
      </p>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <FallTrunk originX={400} groundY={710} height={430} />
          <g className="canopy-sway">
            {foliage.map((leaf, i) => (
              <LeafShape key={i} {...leaf} />
            ))}
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
            {subjectSlot ? (
              <path
                className="hang-stem"
                d={stemPath(subjectSlot.stemFrom, { x: subjectSlot.x, y: subjectSlot.y })}
                strokeWidth="2.6"
              />
            ) : null}
          </g>

          <AnimatePresence>
            {childOrigin && childPoints.length ? (
              <motion.g
                key={`twig-${focusId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {childPoints.map((point, i) => (
                  <path
                    key={`child-stem-${i}`}
                    className="hang-stem"
                    d={stemPath({ x: childOrigin.x, y: childOrigin.y + 10 }, point)}
                    strokeWidth="1.6"
                  />
                ))}
              </motion.g>
            ) : null}
          </AnimatePresence>
        </svg>

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

        {isTopLevel ? (
          <>
            <RootPlaque
              person={father}
              active={focusId === father.id}
              x={268}
              y={648}
              onClick={() => onSelect(father.id)}
            />
            <p
              className="pointer-events-none absolute font-[family-name:var(--font-script)] text-2xl text-script sm:text-3xl"
              style={{
                left: "50%",
                top: `${(652 / VIEW.h) * 100}%`,
                transform: "translate(-50%, 0)",
              }}
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
          </>
        ) : null}
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
  const hang = 72 * scale;
  const rowDy = 76 * scale;
  const rows = count <= 5 ? [count] : [Math.ceil(count / 2), Math.floor(count / 2)];
  const prefer = origin.x < 280 ? "right" : origin.x > 520 ? "left" : "center";
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
