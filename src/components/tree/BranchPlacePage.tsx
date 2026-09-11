"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SlotPlacer } from "@/components/tree/SlotPlacer";
import {
  ART,
  heritageForkPaths,
} from "@/components/tree/treeGeometry";
import {
  BRANCH_CHILDREN,
  BRANCH_SUBJECT,
  formatBranchSlots,
} from "@/components/tree/treeSlots";
import type { PctSlot } from "@/components/tree/treeSlots";

const TREE_ART = "/tree-art.png";

function branchSlots() {
  return [BRANCH_SUBJECT, ...BRANCH_CHILDREN];
}

export function BranchPlacePage() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<PctSlot[]>(branchSlots);
  const subject = slots[0];
  const children = slots.slice(1);
  const forks = subject
    ? heritageForkPaths(
        subject,
        children,
        children.map((_, index) => `place-child-${index}`),
      )
    : [];

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
    <main className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-[#f7e0c4]">
      <div className="relative z-10 mx-auto w-full max-w-[96rem] flex-1 px-3 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
        <p className="text-center font-[family-name:var(--font-script)] text-2xl text-script/80 sm:text-3xl">
          Next generation
        </p>
        <h1 className="mt-1 text-center font-[family-name:var(--font-display)] text-3xl text-bark sm:text-4xl">
          Place the parent and children
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-bark/80">
          Circle P is the parent. Numbered circles are their children. Drag
          them into the open spaces, then copy the locations and send them
          back.
        </p>
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm text-ember underline-offset-4 hover:underline"
          >
            Back to the tree
          </Link>
        </p>

        <div className="relative left-1/2 mt-6 w-screen -translate-x-1/2">
          <div ref={frameRef} className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TREE_ART}
              alt=""
              className="pointer-events-none block h-auto w-full select-none"
              draggable={false}
            />
            <svg
              viewBox={`0 0 ${ART.w} ${ART.h}`}
              className="pointer-events-none absolute inset-0 z-[18] h-full w-full overflow-visible"
              aria-hidden
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="place-fork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f6b51b" />
                  <stop offset="45%" stopColor="#d95b16" />
                  <stop offset="100%" stopColor="#8f3a12" />
                </linearGradient>
              </defs>
              {forks.map((fork) => (
                <path
                  key={fork.id}
                  d={fork.d}
                  fill="url(#place-fork)"
                  stroke="#4a2a12"
                  strokeWidth={3}
                  opacity={0.95}
                />
              ))}
            </svg>
            <SlotPlacer
              frameRef={frameRef}
              slots={slots}
              onSlotsChange={setSlots}
              formatSlots={formatBranchSlots}
              title="Place the next generation"
              help="P is the parent. Numbers are children. Drag, click the tree, or use arrow keys. [ and ] change size."
              labelFor={(index) => (index === 0 ? "P" : String(index))}
              onAdd={addChild}
              onRemove={removeLast}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
