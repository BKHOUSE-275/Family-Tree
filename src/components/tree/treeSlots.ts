export type PctSlot = { cx: number; cy: number; size: number };

/** Openings in the 1536×1024 canopy, as % of the image. */
export const CANOPY_SLOTS: PctSlot[] = [
  { cx: 42.0, cy: 21.7, size: 8.6 },
  { cx: 59.7, cy: 21.6, size: 8.6 },
  { cx: 29.6, cy: 37.9, size: 8.6 },
  { cx: 69.6, cy: 38.6, size: 8.6 },
  { cx: 23.7, cy: 61.3, size: 8.6 },
  { cx: 38.6, cy: 64.6, size: 8.6 },
  { cx: 62.3, cy: 64.8, size: 8.6 },
  { cx: 77.7, cy: 60.2, size: 8.6 },
];

/** Parent portrait when a branch is open. */
export const BRANCH_SUBJECT: PctSlot = { cx: 51.0, cy: 35.2, size: 8.6 };

/**
 * Child portraits on the authored branch openings.
 * Extra children continue below the last defined row.
 */
export const BRANCH_CHILDREN: PctSlot[] = [
  { cx: 41.1, cy: 19.9, size: 7.4 },
  { cx: 60.2, cy: 20.0, size: 7.4 },
  { cx: 27.9, cy: 37.0, size: 7.4 },
  { cx: 70.2, cy: 37.4, size: 7.4 },
  { cx: 38.3, cy: 44.8, size: 7.4 },
  { cx: 62.5, cy: 44.9, size: 7.4 },
  { cx: 26.1, cy: 60.9, size: 7.4 },
  { cx: 76.2, cy: 60.0, size: 7.4 },
  { cx: 62.4, cy: 63.8, size: 7.4 },
  { cx: 39.2, cy: 63.5, size: 7.4 },
];

export function formatSlotLine(slot: PctSlot) {
  return `{ cx: ${slot.cx.toFixed(1)}, cy: ${slot.cy.toFixed(1)}, size: ${slot.size.toFixed(1)} },`;
}

export function formatCanopySlots(slots: PctSlot[]) {
  const lines = slots.map((slot) => `  ${formatSlotLine(slot)}`);
  return `export const CANOPY_SLOTS: PctSlot[] = [\n${lines.join("\n")}\n];`;
}

export function formatBranchSlots(slots: PctSlot[]) {
  const [subject, ...children] = slots;
  if (!subject) return "";
  const childLines = children.map((slot) => `  ${formatSlotLine(slot)}`);
  return [
    `export const BRANCH_SUBJECT: PctSlot = ${formatSlotLine(subject).slice(0, -1)};`,
    "",
    `export const BRANCH_CHILDREN: PctSlot[] = [`,
    ...childLines,
    `];`,
  ].join("\n");
}
