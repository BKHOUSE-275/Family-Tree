import {
  BRANCH_CENTERS,
  BRANCH_EVEN,
  BRANCH_SUBJECT,
  CANOPY_CENTERS,
  CANOPY_EVEN,
  type PctSlot,
} from "@/components/tree/treeSlots";

/** Pixel size of the heirloom tree art (`public/7a5e7b3d-93e5-43e1-8753-f2b8650c752e.png`). */
export const ART = { w: 1536, h: 1024 };

export type { PctSlot } from "@/components/tree/treeSlots";

/** Crown of the painted canopy — parent sits here when drilling into a branch. */
export const HERITAGE_SUBJECT: PctSlot = BRANCH_SUBJECT;

/**
 * Even count → paired openings.
 * Odd count → first (n − 1) pairs plus a centerline master seat,
 * so the odd child sits in the middle instead of hanging off one side.
 */
export function balancedSlots(
  evenSlots: PctSlot[],
  centers: PctSlot[],
  count: number,
): PctSlot[] {
  if (count <= 0) return [];

  if (count <= evenSlots.length) {
    if (count % 2 === 0) {
      return evenSlots.slice(0, count).map((slot) => ({ ...slot }));
    }
    const pairs = evenSlots.slice(0, count - 1).map((slot) => ({ ...slot }));
    return [...pairs, { ...pickCenter(centers, count) }];
  }

  // One past the last pair, only when odd: all pairs + a center master.
  if (count === evenSlots.length + 1 && count % 2 === 1) {
    return [
      ...evenSlots.map((slot) => ({ ...slot })),
      { ...pickCenter(centers, count) },
    ];
  }

  return evenSlots.map((slot) => ({ ...slot }));
}

/** Place children with even/odd balancing; overflow continues below. */
export function heritageChildCluster(origin: PctSlot, count: number): PctSlot[] {
  if (count === 0) return [];

  const maxWithCenter = BRANCH_EVEN.length + 1;
  if (count <= BRANCH_EVEN.length || count === maxWithCenter) {
    return balancedSlots(BRANCH_EVEN, BRANCH_CENTERS, count);
  }

  const placed = BRANCH_EVEN.map((slot) => ({ ...slot }));
  const pattern = branchRowPattern(BRANCH_EVEN);
  const lastCy = BRANCH_EVEN[BRANCH_EVEN.length - 1]?.cy ?? pattern.firstCy;
  let remaining = count - placed.length;
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

/** Hero canopy seats with the same even/odd balance rule. */
export function canopySlotsForCount(count: number): PctSlot[] {
  return balancedSlots(
    CANOPY_EVEN,
    CANOPY_CENTERS,
    Math.min(count, CANOPY_EVEN.length + 1),
  );
}

/**
 * Map odd counts to a center tier: 1/3 → top, 5/7 → mid, 9+ → lower.
 */
function pickCenter(centers: PctSlot[], oddCount: number): PctSlot {
  const fallback = centers[centers.length - 1] ?? {
    cx: 50,
    cy: 40,
    size: 7.4,
  };
  if (centers.length === 0) return fallback;

  const tier = (oddCount - 1) / 2; // 0,1,2,3,4… for counts 1,3,5,7,9…
  let index = 0;
  if (tier <= 1) index = 0;
  else if (tier <= 3) index = Math.min(1, centers.length - 1);
  else index = Math.min(2, centers.length - 1);

  return centers[index] ?? fallback;
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
