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

const TREE_AXIS = 50.9;
const CENTER_TOL = 6;
const ROW_TOL = 5;
/** Original painted pair seats; extras are only used after these 8 are filled. */
const PRIMARY_EVEN_COUNT = 8;

type SlotPair = [PctSlot, PctSlot];

/**
 * Even count → complete left/right pairs, so the canopy stays symmetrical.
 * Odd count → those pairs plus one centerline seat.
 * The original 8 painted holes fill first; extra authored seats are used
 * only after those 8 are taken. Returned seats are ordered top-to-bottom,
 * then left-to-right, for children sorted by birthday (oldest first).
 */
export function balancedSlots(
  evenSlots: PctSlot[],
  centers: PctSlot[],
  count: number,
): PctSlot[] {
  if (count <= 0) return [];

  const layout = classifySlots(evenSlots, centers);
  const evenCount = count % 2 === 0 ? count : count - 1;
  const pairCount = Math.min(evenCount / 2, layout.pairs.length);
  const placed: PctSlot[] = [];

  for (let i = 0; i < pairCount; i += 1) {
    const [left, right] = layout.pairs[i]!;
    placed.push({ ...left }, { ...right });
  }

  if (count % 2 === 1) {
    placed.push({ ...pickCenter(layout.centers, count) });
  }

  return sortSlotsForBirthOrder(placed);
}

/** Place children with even/odd balancing; overflow continues below. */
export function heritageChildCluster(origin: PctSlot, count: number): PctSlot[] {
  if (count === 0) return [];

  const layout = classifySlots(BRANCH_EVEN, BRANCH_CENTERS);
  const authoredEven = layout.pairs.length * 2;
  const fitsAuthored =
    count <= authoredEven ||
    (count % 2 === 1 && count <= authoredEven + 1);

  if (fitsAuthored) {
    return balancedSlots(BRANCH_EVEN, BRANCH_CENTERS, count);
  }

  const placed = layout.pairs.flatMap(([left, right]) => [
    { ...left },
    { ...right },
  ]);
  let remaining = count - placed.length;

  if (remaining % 2 === 1 && layout.centers.length > 0) {
    placed.push({ ...pickCenter(layout.centers, count) });
    remaining -= 1;
  }

  const pattern = branchRowPattern([
    ...BRANCH_EVEN,
    ...BRANCH_CENTERS,
    ...placed,
  ]);
  const lastCy = Math.max(...placed.map((slot) => slot.cy), pattern.firstCy);
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

  return sortSlotsForBirthOrder(placed);
}

/** Hero canopy seats with the same even/odd balance rule. */
export function canopySlotsForCount(count: number): PctSlot[] {
  const layout = classifySlots(CANOPY_EVEN, CANOPY_CENTERS);
  const authoredEven = layout.pairs.length * 2;
  const capped =
    count % 2 === 0
      ? Math.min(count, authoredEven)
      : Math.min(count, authoredEven + 1);
  return balancedSlots(CANOPY_EVEN, CANOPY_CENTERS, capped);
}

function classifySlots(evenSlots: PctSlot[], centerSlots: PctSlot[]) {
  const primaryEven = evenSlots.slice(0, PRIMARY_EVEN_COUNT);
  const extraEven = evenSlots.slice(PRIMARY_EVEN_COUNT);
  const centers: PctSlot[] = [];
  const extraSides: PctSlot[] = [];

  for (const slot of centerSlots) {
    if (Math.abs(slot.cx - TREE_AXIS) <= CENTER_TOL) centers.push(slot);
    else extraSides.push(slot);
  }

  const primary = pairGroup(primaryEven, primaryEven);
  const extra = [
    ...pairGroup(extraEven, extraEven).pairs,
    ...pairGroup(extraSides, extraSides).pairs,
  ];
  centers.push(...primary.leftover);
  centers.sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  return { pairs: [...primary.pairs, ...extra], centers };
}

function pairGroup(slots: PctSlot[], authoredOrder: PctSlot[]) {
  const sides = slots.filter((slot) => Math.abs(slot.cx - TREE_AXIS) > CENTER_TOL);
  const leftover = slots.filter((slot) => Math.abs(slot.cx - TREE_AXIS) <= CENTER_TOL);
  const rows = clusterRows(sides);
  rows.sort((a, b) => {
    const byAuthored = rowAuthoredIndex(a, authoredOrder) - rowAuthoredIndex(b, authoredOrder);
    if (byAuthored !== 0) return byAuthored;
    return meanCy(a) - meanCy(b);
  });

  const pairs: SlotPair[] = [];
  for (const row of rows) {
    const grouped = pairRow(row);
    pairs.push(...grouped.pairs);
    leftover.push(...grouped.leftover);
  }

  return { pairs, leftover };
}

function rowAuthoredIndex(row: PctSlot[], authoredOrder: PctSlot[]) {
  let min = Infinity;
  for (const slot of row) {
    const index = authoredOrder.indexOf(slot);
    if (index !== -1 && index < min) min = index;
  }
  return min;
}

function clusterRows(slots: PctSlot[]) {
  const sorted = [...slots].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const rows: PctSlot[][] = [];

  for (const slot of sorted) {
    const row = rows.find((group) => Math.abs(meanCy(group) - slot.cy) <= ROW_TOL);
    if (row) row.push(slot);
    else rows.push([slot]);
  }

  return rows;
}

function pairRow(row: PctSlot[]) {
  const byCx = [...row].sort((a, b) => a.cx - b.cx);
  const outerFirst: SlotPair[] = [];

  while (byCx.length >= 2) {
    const left = byCx.shift()!;
    const right = byCx.pop()!;
    outerFirst.push([left, right]);
  }

  return {
    // Inner pair first so a 6-count uses the centered lower holes, not the wings.
    pairs: outerFirst.reverse(),
    leftover: byCx,
  };
}

/** Highest row first, then left to right within a row. */
function sortSlotsForBirthOrder(slots: PctSlot[]) {
  const rows = clusterRows(slots);
  rows.sort((a, b) => meanCy(a) - meanCy(b));
  return rows.flatMap((row) => [...row].sort((a, b) => a.cx - b.cx));
}

/**
 * Map odd counts to a center tier: 1/3 → top, 5/7 → mid, 9+ → lower.
 */
function pickCenter(centers: PctSlot[], oddCount: number): PctSlot {
  const ranked = [...centers].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const fallback = ranked[ranked.length - 1] ?? {
    cx: TREE_AXIS,
    cy: 40,
    size: 7.4,
  };
  if (ranked.length === 0) return fallback;

  const tier = (oddCount - 1) / 2; // 0,1,2,3,4… for counts 1,3,5,7,9…
  let index = 0;
  if (tier <= 1) index = 0;
  else if (tier <= 3) index = Math.min(1, ranked.length - 1);
  else index = Math.min(2, ranked.length - 1);

  return ranked[index] ?? fallback;
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
    perRow: 2,
    pitch,
    rowGap: Math.max(secondCy - firstCy, 12),
  };
}

function meanCy(slots: PctSlot[]) {
  return slots.reduce((sum, slot) => sum + slot.cy, 0) / slots.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
