export type PctSlot = { cx: number; cy: number; size: number };

/** Openings in the 1536×1024 canopy, as % of the image. */
export const CANOPY_SLOTS: PctSlot[] = [
  { cx: 41.3, cy: 20.8, size: 8.6 },
  { cx: 61.4, cy: 20.9, size: 8.6 },
  { cx: 31.8, cy: 37.7, size: 8.6 },
  { cx: 73.0, cy: 36.5, size: 8.6 },
  { cx: 27.4, cy: 61.5, size: 8.6 },
  { cx: 41.2, cy: 60.7, size: 8.6 },
  { cx: 66.8, cy: 61.1, size: 8.6 },
  { cx: 81.8, cy: 58.2, size: 8.6 },
];

/** Parent portrait when a branch is open. */
export const BRANCH_SUBJECT: PctSlot = { cx: 52.1, cy: 41.6, size: 8.6 };

/**
 * Child portraits on the authored branch openings.
 * Extra children continue below the last defined row.
 */
export const BRANCH_CHILDREN: PctSlot[] = [
  { cx: 42.6, cy: 20.8, size: 7.4 },
  { cx: 61.9, cy: 20.3, size: 7.4 },
  { cx: 30.1, cy: 33.6, size: 7.4 },
  { cx: 42.1, cy: 34.2, size: 7.4 },
  { cx: 62.3, cy: 33.0, size: 7.4 },
  { cx: 74.1, cy: 32.7, size: 7.4 },
  { cx: 41.4, cy: 47.3, size: 7.4 },
  { cx: 62.6, cy: 48.1, size: 7.4 },
  { cx: 39.2, cy: 59.5, size: 7.4 },
  { cx: 68.0, cy: 60.3, size: 7.4 },
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
