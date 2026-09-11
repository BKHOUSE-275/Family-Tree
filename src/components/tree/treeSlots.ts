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
export const BRANCH_SUBJECT: PctSlot = { cx: 52.7, cy: 17.6, size: 8.6 };

/**
 * Child portraits hanging from the parent.
 * Rows of up to 4 then 6, evenly spaced and centered under the parent.
 * Extra children continue the same pitch on new rows below.
 */
export const BRANCH_CHILDREN: PctSlot[] = [
  { cx: 40.6, cy: 32.1, size: 7.4 },
  { cx: 48.7, cy: 32.1, size: 7.4 },
  { cx: 56.7, cy: 32.1, size: 7.4 },
  { cx: 64.8, cy: 32.1, size: 7.4 },
  { cx: 32.5, cy: 45.9, size: 7.4 },
  { cx: 40.6, cy: 45.9, size: 7.4 },
  { cx: 48.7, cy: 45.9, size: 7.4 },
  { cx: 56.7, cy: 45.9, size: 7.4 },
  { cx: 64.8, cy: 45.9, size: 7.4 },
  { cx: 72.9, cy: 45.9, size: 7.4 },
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
