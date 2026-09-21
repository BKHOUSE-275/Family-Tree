"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SlotPlacer } from "@/components/tree/SlotPlacer";
import {
  BRANCH_CENTERS,
  BRANCH_EVEN,
  BRANCH_SUBJECT,
  formatBranchSlots,
} from "@/components/tree/treeSlots";
import type { PctSlot } from "@/components/tree/treeSlots";
import { TREE_ART } from "@/components/tree/treeGeometry";

function branchSlots() {
  return [BRANCH_SUBJECT, ...BRANCH_EVEN, ...BRANCH_CENTERS];
}

export function BranchPlacePage() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<PctSlot[]>(branchSlots);

  function addChild() {
    const last = slots[slots.length - 1] ?? {
      cx: 50,
      cy: 70,
      size: 7.4,
    };
    setSlots([
      ...slots,
      {
        cx: Math.min(last.cx + 8, 90),
        cy: last.cy,
        size: last.size,
      },
    ]);
  }

  function removeLast() {
    if (slots.length <= 2) return;
    setSlots(slots.slice(0, -1));
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-[#f7e0c4]">
      <div className="relative z-10 mx-auto w-full max-w-[96rem] flex-1 px-3 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
        <p className="text-center font-[family-name:var(--font-script)] text-2xl text-script/80 sm:text-3xl">
          Next generation
        </p>
        <h1 className="mt-1 px-1 text-center font-[family-name:var(--font-display)] text-2xl break-words text-bark sm:text-4xl">
          Place the parent and children
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-bark/80">
          The first circle is the parent. The next ten are paired seats for even
          counts; the last is the centerline seat for odd counts. Drag them into
          place, then copy the locations.
        </p>
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm text-ember underline-offset-4 hover:underline"
          >
            Back to the tree
          </Link>
        </p>

        <div className="mt-6 w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain md:overflow-visible">
          <div ref={frameRef} className="relative w-full min-w-[46rem] md:min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TREE_ART}
              alt=""
              className="pointer-events-none block h-auto w-full select-none"
              draggable={false}
            />
            <SlotPlacer
              frameRef={frameRef}
              slots={slots}
              onSlotsChange={setSlots}
              formatSlots={formatBranchSlots}
              title="Place the next generation"
              help="Parent is first. Next ten are even-count pairs; last is the odd-count center. Drag, click the tree, or use arrow keys."
              labelFor={() => ""}
              onAdd={addChild}
              onRemove={removeLast}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
