export type PctSlot = { cx: number; cy: number; size: number };

/** Openings in the 1536×1024 canopy, as % of the image (paired / even layout). */
export const CANOPY_EVEN: PctSlot[] = [
  { cx: 41.3, cy: 21.0, size: 8.6 },
  { cx: 60.6, cy: 21.0, size: 8.6 },
  { cx: 32.3, cy: 37.6, size: 8.6 },
  { cx: 70.8, cy: 37.6, size: 8.6 },
  { cx: 25.9, cy: 60.0, size: 8.6 },
  { cx: 38.6, cy: 64.9, size: 8.6 },
  { cx: 63.9, cy: 64.9, size: 8.6 },
  { cx: 77.5, cy: 60.0, size: 8.6 },
];

/**
 * Centerline master openings for odd counts on the hero canopy
 * (top → mid → lower).
 */
export const CANOPY_CENTERS: PctSlot[] = [
  { cx: 51.2, cy: 10.3, size: 8.6 },
  { cx: 51.1, cy: 35.1, size: 8.6 },
  { cx: 51.2, cy: 57.3, size: 8.6 },
];

/** @deprecated Prefer CANOPY_EVEN; kept as the even paired set for callers. */
export const CANOPY_SLOTS: PctSlot[] = CANOPY_EVEN;

/** Parent portrait when a branch is open. */
export const BRANCH_SUBJECT: PctSlot = { cx: 51.5, cy: 35.4, size: 8.6 };

/**
 * Paired child openings. The first 8 match the original canopy holes and
 * always fill first; later pairs are overflow seats.
 */
export const BRANCH_EVEN: PctSlot[] = [
  { cx: 41.1, cy: 20.9, size: 8.6 },
  { cx: 61.0, cy: 20.9, size: 8.6 },
  { cx: 30.2, cy: 37.7, size: 8.6 },
  { cx: 73.1, cy: 37.7, size: 8.6 },
  { cx: 25.2, cy: 61.3, size: 8.6 },
  { cx: 38.2, cy: 65.2, size: 8.6 },
  { cx: 64.1, cy: 65.2, size: 8.6 },
  { cx: 76.3, cy: 61.3, size: 8.6 },
  { cx: 41.1, cy: 35.4, size: 8.6 },
  { cx: 61.0, cy: 35.4, size: 8.6 },
];

/**
 * Extra openings: true centerline seats plus any added left/right pairs.
 * Runtime placement classifies these by position (pair vs center).
 */
export const BRANCH_CENTERS: PctSlot[] = [
  { cx: 50.9, cy: 54.6, size: 8.6 },
  { cx: 35.9, cy: 49.3, size: 8.6 },
  { cx: 50.9, cy: 10.1, size: 8.6 },
  { cx: 67.3, cy: 49.3, size: 8.6 },
];

/**
 * All authored branch child holes (paired + centers) for the placer.
 * Runtime placement uses BRANCH_EVEN / BRANCH_CENTERS via parity.
 */
export const BRANCH_CHILDREN: PctSlot[] = [...BRANCH_EVEN, ...BRANCH_CENTERS];

export function formatSlotLine(slot: PctSlot) {
  return `{ cx: ${slot.cx.toFixed(1)}, cy: ${slot.cy.toFixed(1)}, size: ${slot.size.toFixed(1)} },`;
}

export function formatCanopySlots(slots: PctSlot[]) {
  const evenCount = CANOPY_EVEN.length;
  const even = slots.slice(0, evenCount);
  const centers = slots.slice(evenCount);
  const evenLines = even.map((slot) => `  ${formatSlotLine(slot)}`);
  const centerLines = centers.map((slot) => `  ${formatSlotLine(slot)}`);
  if (centers.length === 0) {
    return `export const CANOPY_SLOTS: PctSlot[] = [\n${evenLines.join("\n")}\n];`;
  }
  return [
    `export const CANOPY_EVEN: PctSlot[] = [`,
    ...evenLines,
    `];`,
    "",
    `export const CANOPY_CENTERS: PctSlot[] = [`,
    ...centerLines,
    `];`,
  ].join("\n");
}

export function formatBranchSlots(slots: PctSlot[]) {
  const [subject, ...children] = slots;
  if (!subject) return "";
  const evenCount = BRANCH_EVEN.length;
  const even = children.slice(0, evenCount);
  const centers = children.slice(evenCount);
  const evenLines = even.map((slot) => `  ${formatSlotLine(slot)}`);
  const centerLines = centers.map((slot) => `  ${formatSlotLine(slot)}`);
  return [
    `export const BRANCH_SUBJECT: PctSlot = ${formatSlotLine(subject).slice(0, -1)};`,
    "",
    `export const BRANCH_EVEN: PctSlot[] = [`,
    ...evenLines,
    `];`,
    "",
    `export const BRANCH_CENTERS: PctSlot[] = [`,
    ...centerLines,
    `];`,
  ].join("\n");
}
