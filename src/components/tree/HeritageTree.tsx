"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeritagePersonNode } from "@/components/tree/HeritagePersonNode";
import { SlotPlacer } from "@/components/tree/SlotPlacer";
import {
  ART,
  HERITAGE_SUBJECT,
  TREE_ART,
  canopySlotsForCount,
  heritageChildCluster,
  type PctSlot,
} from "@/components/tree/treeGeometry";
import {
  CANOPY_CENTERS,
  CANOPY_EVEN,
  formatCanopySlots,
} from "@/components/tree/treeSlots";
import type { Person } from "@/lib/types";

const CANOPY_PLACE_SLOTS = [...CANOPY_EVEN, ...CANOPY_CENTERS];

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
  const [draftSlots, setDraftSlots] = useState(CANOPY_PLACE_SLOTS);
  const showCanopy = placeMode || isTopLevel;
  const canopyLayout =
    showCanopy && !placeMode ? canopySlotsForCount(canopyPeople.length) : [];
  const childSlots =
    !showCanopy && subject
      ? heritageChildCluster(HERITAGE_SUBJECT, hangingChildren.length)
      : [];
  const overflowSlots =
    showCanopy && canopyOverflow.length
      ? heritageChildCluster(HERITAGE_SUBJECT, canopyOverflow.length)
      : [];

  return (
    <div className="w-full min-w-0">
      <p className="sr-only">
        Family tree. Select a portrait to open that person and see their
        children branching from them. Use Reset to return to the first
        generation.
      </p>

      <div className="min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain md:overflow-visible">
        <div ref={frameRef} className="relative w-full min-w-[46rem] md:min-w-0">
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
            : canopyLayout.map((slot, index) => {
                const person = canopyPeople[index];
                if (!person) return null;
                return (
                  <NodeAnchor key={person.id} slot={slot} z={10}>
                    <HeritagePersonNode
                      person={person}
                      active={person.id === focusId}
                      onSelect={onSelect}
                    />
                  </NodeAnchor>
                );
              })}

          {placeMode ? (
            <SlotPlacer
              frameRef={frameRef}
              slots={draftSlots}
              onSlotsChange={setDraftSlots}
              formatSlots={formatCanopySlots}
              help="Drag a circle, or select one and click the tree. Arrow keys nudge. [ and ] change size. First 8 are pairs; last 3 are odd-count centers."
              labelFor={() => ""}
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
      </div>
      <p className="mt-3 px-3 text-center text-sm text-bark/70 md:hidden">
        Swipe to see the whole tree.
      </p>
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
      className="@container absolute"
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
