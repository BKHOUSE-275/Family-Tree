export type PctSlot = { cx: number; cy: number; size: number };

/** Openings in the 1536×1024 canopy, as % of the image (paired / even layout). */
export const CANOPY_EVEN: PctSlot[] = [
  { cx: 42.0, cy: 21.7, size: 8.6 },
  { cx: 59.7, cy: 21.6, size: 8.6 },
  { cx: 29.6, cy: 37.9, size: 8.6 },
  { cx: 69.6, cy: 38.6, size: 8.6 },
  { cx: 23.7, cy: 61.3, size: 8.6 },
  { cx: 38.6, cy: 64.6, size: 8.6 },
  { cx: 62.3, cy: 64.8, size: 8.6 },
  { cx: 77.7, cy: 60.2, size: 8.6 },
];

/**
 * Centerline master openings for odd counts on the hero canopy
 * (top → mid → lower).
 */
export const CANOPY_CENTERS: PctSlot[] = [
  { cx: 50.8, cy: 21.6, size: 8.6 },
  { cx: 49.6, cy: 38.2, size: 8.6 },
  { cx: 50.5, cy: 62.7, size: 8.6 },
];

/** @deprecated Prefer CANOPY_EVEN; kept as the even paired set for callers. */
export const CANOPY_SLOTS: PctSlot[] = CANOPY_EVEN;

/** Parent portrait when a branch is open. */
export const BRANCH_SUBJECT: PctSlot = { cx: 51.0, cy: 35.2, size: 8.6 };

/**
 * Extra paired openings used only after the hero canopy seats are full.
 */
export const BRANCH_EVEN_EXTRA: PctSlot[] = [
  { cx: 62.4, cy: 63.8, size: 8.6 },
  { cx: 39.2, cy: 63.5, size: 8.6 },
];

/**
 * Paired child openings for even counts.
 * Starts with the hero canopy seats, then branch-only extras.
 */
export const BRANCH_EVEN: PctSlot[] = [
  ...CANOPY_EVEN.map((slot) => ({ ...slot })),
  ...BRANCH_EVEN_EXTRA.map((slot) => ({ ...slot })),
];

/**
 * Centerline master openings for odd counts (top → mid → lower).
 * Same centers as the hero canopy so odd layouts stay aligned.
 */
export const BRANCH_CENTERS: PctSlot[] = CANOPY_CENTERS.map((slot) => ({
  ...slot,
}));

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
