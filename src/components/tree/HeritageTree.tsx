"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeritagePersonNode } from "@/components/tree/HeritagePersonNode";
import { SlotPlacer } from "@/components/tree/SlotPlacer";
import {
  ART,
  HERITAGE_SUBJECT,
  heritageChildCluster,
  type PctSlot,
} from "@/components/tree/treeGeometry";
import { CANOPY_SLOTS } from "@/components/tree/treeSlots";
import type { Person } from "@/lib/types";

export const TREE_ART = "/7a5e7b3d-93e5-43e1-8753-f2b8650c752e.png";

export function HeritageTree({
  isTopLevel,
  canopyPeople,
  canopyOverflow = [],
  subject,
  hangingChildren,
  focusId,
  onSelect,
  placeMode = false,
}: {
  isTopLevel: boolean;
  canopyPeople: Person[];
  canopyOverflow?: Person[];
  subject: Person | null;
  hangingChildren: Person[];
  focusId: string;
  onSelect: (id: string) => void;
  placeMode?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [draftSlots, setDraftSlots] = useState(CANOPY_SLOTS);
  const slots = placeMode ? draftSlots : CANOPY_SLOTS;
  const showCanopy = placeMode || isTopLevel;
  const childSlots =
    !showCanopy && subject
      ? heritageChildCluster(HERITAGE_SUBJECT, hangingChildren.length)
      : [];
  const overflowSlots =
    showCanopy && canopyOverflow.length
      ? heritageChildCluster(HERITAGE_SUBJECT, canopyOverflow.length)
      : [];

  return (
    <div ref={frameRef} className="relative w-full">
      <p className="sr-only">
        Family tree. Select a portrait to open that person and see their
        children branching from them. Use Reset to return to the first
        generation.
      </p>

      <div className="relative mx-auto w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TREE_ART}
          alt=""
          width={ART.w}
          height={ART.h}
          className="pointer-events-none block aspect-[1536/1024] h-auto w-full select-none"
          draggable={false}
        />
      </div>

      {placeMode
        ? null
        : slots.map((slot, index) => {
            const person = showCanopy ? canopyPeople[index] : undefined;
            return (
              <NodeAnchor key={index} slot={slot} z={10}>
                {person ? (
                  <HeritagePersonNode
                    person={person}
                    active={person.id === focusId}
                    onSelect={onSelect}
                  />
                ) : null}
              </NodeAnchor>
            );
          })}

      {placeMode ? (
        <SlotPlacer
          frameRef={frameRef}
          slots={draftSlots}
          onSlotsChange={setDraftSlots}
        />
      ) : null}

      {!showCanopy && subject ? (
        <NodeAnchor slot={HERITAGE_SUBJECT} z={30}>
          <HeritagePersonNode
            person={subject}
            active
            onSelect={onSelect}
          />
        </NodeAnchor>
      ) : null}

      <AnimatePresence>
        {showCanopy
          ? canopyOverflow.map((person, index) => {
              const slot = overflowSlots[index];
              if (!slot) return null;
              return (
                <NodeAnchor key={person.id} slot={slot} z={20}>
                  <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: index * 0.04, duration: 0.35 }}
                  >
                    <HeritagePersonNode
                      person={person}
                      active={person.id === focusId}
                      compact
                      onSelect={onSelect}
                    />
                  </motion.div>
                </NodeAnchor>
              );
            })
          : hangingChildren.map((person, index) => {
              const slot = childSlots[index];
              if (!slot) return null;
              return (
                <NodeAnchor key={person.id} slot={slot} z={20}>
                  <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: index * 0.04, duration: 0.35 }}
                  >
                    <HeritagePersonNode
                      person={person}
                      active={person.id === focusId}
                      compact
                      onSelect={onSelect}
                    />
                  </motion.div>
                </NodeAnchor>
              );
            })}
      </AnimatePresence>
    </div>
  );
}

function NodeAnchor({
  slot,
  z = 10,
  children,
}: {
  slot: PctSlot;
  z?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: `${slot.cx}%`,
        top: `${slot.cy}%`,
        width: `${slot.size}%`,
        transform: "translate(-50%, -50%)",
        zIndex: z,
      }}
    >
      {children}
    </div>
  );
}
