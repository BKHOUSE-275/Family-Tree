import { BRANCH_CHILDREN, BRANCH_SUBJECT, type PctSlot } from "@/components/tree/treeSlots";

/** Pixel size of the heirloom tree art (`public/7a5e7b3d-93e5-43e1-8753-f2b8650c752e.png`). */
export const ART = { w: 1536, h: 1024 };

export type { PctSlot } from "@/components/tree/treeSlots";

/** Crown of the painted canopy — parent sits here when drilling into a branch. */
export const HERITAGE_SUBJECT: PctSlot = BRANCH_SUBJECT;

/** Place children on the authored branch slots; overflow continues below. */
export function heritageChildCluster(origin: PctSlot, count: number): PctSlot[] {
  if (count === 0) return [];

  const placed = BRANCH_CHILDREN.slice(0, count).map((slot) => ({ ...slot }));
  if (count <= BRANCH_CHILDREN.length) return placed;

  const pattern = branchRowPattern(BRANCH_CHILDREN);
  const lastCy =
    BRANCH_CHILDREN[BRANCH_CHILDREN.length - 1]?.cy ?? pattern.firstCy;
  let remaining = count - BRANCH_CHILDREN.length;
  let row = 1;

  while (remaining > 0) {
    const rowCount = Math.min(pattern.perRow, remaining);
    const cy = Math.min(lastCy + row * pattern.rowGap, 88);
    const start = origin.cx - ((rowCount - 1) * pattern.pitch) / 2;
    for (let col = 0; col < rowCount; col += 1) {
      placed.push({
        cx: round1(clamp(start + col * pattern.pitch, 8, 92)),
        cy: round1(cy),
        size: pattern.size,
      });
    }
    remaining -= rowCount;
    row += 1;
  }

  return placed;
}

/**
 * Derive spacing from authored slots for overflow rows only.
 */
function branchRowPattern(placed: PctSlot[]) {
  const size = placed[0]?.size ?? 7.4;
  const sorted = [...placed].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const firstCy = sorted[0]?.cy ?? 32;
  const firstRow = sorted.filter((slot) => Math.abs(slot.cy - firstCy) < 3);
  const rest = sorted.filter((slot) => Math.abs(slot.cy - firstCy) >= 3);
  const secondCy = rest[0]?.cy ?? firstCy + 14;
  const secondRow = rest.filter((slot) => Math.abs(slot.cy - secondCy) < 3);
  const pitchRow =
    (secondRow.length >= 2 ? secondRow : firstRow).slice().sort((a, b) => a.cx - b.cx);
  const pitch =
    pitchRow.length >= 2
      ? (pitchRow[pitchRow.length - 1]!.cx - pitchRow[0]!.cx) /
        (pitchRow.length - 1)
      : 8.1;

  return {
    size,
    firstCy,
    perRow: Math.max(secondRow.length, firstRow.length, 2),
    pitch,
    rowGap: Math.max(secondCy - firstCy, 12),
  };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
