import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OakTree } from "@/components/tree/OakTree";
import { PersonLeaf } from "@/components/tree/PersonLeaf";
import {
  ROOT_FATHER_POS,
  ROOT_MOTHER_POS,
  SUBJECT_SLOT,
  VIEW,
  canopySlots,
  childCluster,
  childForkPaths,
  limbTipForSlot,
  petiolePath,
  type Slot,
} from "@/components/tree/treeGeometry";
import { displayName, type Person } from "@/lib/types";

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
  const childPoints = subjectSlot ? childCluster(subjectSlot, hangingChildren.length) : [];
  const petioles = isTopLevel
    ? slots.map((slot, index) => petiolePath(limbTipForSlot(slot, index, slots.length), slot))
    : [];
  const forks = subjectSlot
    ? childForkPaths(
        subjectSlot,
        childPoints,
        hangingChildren.map((person) => person.id),
      )
    : [];

  return (
    <div
      className="relative mx-auto w-full max-w-3xl"
      style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
    >
      <p className="sr-only">
        Family tree with Felix and Adaline at the roots. Select a leaf to open
        that person and see only their children.
      </p>
      <OakTree
        layer="back"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      />

      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <radialGradient
            id="fork-bark"
            cx={SUBJECT_SLOT.x}
            cy={SUBJECT_SLOT.y + 116}
            r="280"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6b4423" stopOpacity="0.18" />
            <stop offset="42%" stopColor="#5c3a21" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4a2e16" stopOpacity="0.72" />
          </radialGradient>
        </defs>
        {isTopLevel
          ? petioles.map((d, index) => (
              <path
                key={`petiole-${canopyPeople[index]?.id ?? index}`}
                d={d}
                fill="#5c3a21"
                opacity="0.5"
                style={{ mixBlendMode: "multiply" }}
              />
            ))
          : null}
        <AnimatePresence>
          {forks.map((fork) => (
            <motion.path
              key={fork.id}
              d={fork.d}
              fill="url(#fork-bark)"
              style={{ mixBlendMode: "multiply", fill: "url(#fork-bark)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          ))}
        </AnimatePresence>
      </svg>

      <OakTree
        layer="front"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
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
          x={ROOT_FATHER_POS.x}
          y={ROOT_FATHER_POS.y}
          onClick={() => onSelect(father.id)}
        />
        <p
          className="pointer-events-none absolute font-[family-name:var(--font-script)] text-2xl text-script sm:text-3xl"
          style={{
            left: "50%",
            top: `${(812 / VIEW.h) * 100}%`,
            transform: "translate(-50%, 0)",
          }}
        >
          &
        </p>
        <RootPlaque
          person={mother}
          active={focusId === mother.id}
          x={ROOT_MOTHER_POS.x}
          y={ROOT_MOTHER_POS.y}
          onClick={() => onSelect(mother.id)}
        />
        <p
          className="pointer-events-none absolute w-full text-center text-[0.65rem] uppercase tracking-[0.28em] text-script"
          style={{ top: `${(872 / VIEW.h) * 100}%` }}
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
  point: Slot;
  size: "sm" | "md";
  z?: number;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute ${
        size === "md"
          ? "w-[clamp(5.4rem,15%,10.2rem)]"
          : "w-[clamp(4.6rem,12.4%,8.4rem)]"
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
