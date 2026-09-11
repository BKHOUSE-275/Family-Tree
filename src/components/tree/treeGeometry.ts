import { BRANCH_CHILDREN, BRANCH_SUBJECT, type PctSlot } from "@/components/tree/treeSlots";

export type Point = { x: number; y: number };

export function taperLimb(
  from: Point,
  to: Point,
  startW: number,
  endW: number,
  bulge = 0,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = bulge * len;
  const c1x = from.x + dx * 0.32 + nx * bow;
  const c1y = from.y + dy * 0.32 + ny * bow;
  const c2x = from.x + dx * 0.68 + nx * bow * 0.5;
  const c2y = from.y + dy * 0.68 + ny * bow * 0.5;
  const s0 = startW / 2;
  const s1 = endW / 2;
  const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;

  const fl = { x: from.x + nx * s0, y: from.y + ny * s0 };
  const fr = { x: from.x - nx * s0, y: from.y - ny * s0 };
  const tl = { x: to.x + nx * s1, y: to.y + ny * s1 };
  const tr = { x: to.x - nx * s1, y: to.y - ny * s1 };
  const cl1 = { x: c1x + nx * mix(s0, s1, 0.3), y: c1y + ny * mix(s0, s1, 0.3) };
  const cl2 = { x: c2x + nx * mix(s0, s1, 0.75), y: c2y + ny * mix(s0, s1, 0.75) };
  const cr1 = { x: c2x - nx * mix(s0, s1, 0.75), y: c2y - ny * mix(s0, s1, 0.75) };
  const cr2 = { x: c1x - nx * mix(s0, s1, 0.3), y: c1y - ny * mix(s0, s1, 0.3) };

  return `M ${n(fl.x)} ${n(fl.y)} C ${n(cl1.x)} ${n(cl1.y)}, ${n(cl2.x)} ${n(cl2.y)}, ${n(tl.x)} ${n(tl.y)} L ${n(tr.x)} ${n(tr.y)} C ${n(cr1.x)} ${n(cr1.y)}, ${n(cr2.x)} ${n(cr2.y)}, ${n(fr.x)} ${n(fr.y)} Z`;
}

function n(value: number) {
  return value.toFixed(1);
}

/** Pixel size of the heirloom tree art (`public/tree-art.png`). */
export const ART = { w: 1536, h: 1024 };

export type { PctSlot } from "@/components/tree/treeSlots";

/** Crown of the painted canopy — parent sits here when drilling into a branch. */
export const HERITAGE_SUBJECT: PctSlot = BRANCH_SUBJECT;

export function heritageChildCluster(origin: PctSlot, count: number): PctSlot[] {
  if (count === 0) return [];
  return layoutCenteredChildren(origin.cx, count);
}

/**
 * Lay out children in the branch pattern: first row up to 4, then rows of 6.
 * Each row is evenly spaced and centered under the parent.
 */
function layoutCenteredChildren(centerCx: number, count: number): PctSlot[] {
  const pattern = branchRowPattern(BRANCH_CHILDREN);
  const rowCounts = splitChildRows(count, pattern.firstRowMax, pattern.perRow);
  const slots: PctSlot[] = [];

  rowCounts.forEach((rowCount, row) => {
    const cy =
      row === 0
        ? pattern.firstCy
        : Math.min(pattern.firstCy + row * pattern.rowGap, 88);
    const start = centerCx - ((rowCount - 1) * pattern.pitch) / 2;
    for (let col = 0; col < rowCount; col += 1) {
      slots.push({
        cx: round1(clamp(start + col * pattern.pitch, 8, 92)),
        cy: round1(cy),
        size: pattern.size,
      });
    }
  });

  return slots;
}

function splitChildRows(
  count: number,
  firstRowMax: number,
  perRow: number,
): number[] {
  if (count <= firstRowMax) return [count];
  const rows = [firstRowMax];
  let remaining = count - firstRowMax;
  while (remaining > 0) {
    const take = Math.min(perRow, remaining);
    rows.push(take);
    remaining -= take;
  }
  return rows;
}

function branchRowPattern(placed: PctSlot[]) {
  const size = placed[0]?.size ?? 7.4;
  const firstCy = avgCy(placed.slice(0, 4)) || placed[0]?.cy || 32;
  const firstRow = placed.filter((slot) => Math.abs(slot.cy - firstCy) < 2.5);
  const rest = placed.slice(firstRow.length);
  const secondCy = avgCy(rest) || firstCy + 14;
  const secondRow = rest.filter((slot) => Math.abs(slot.cy - secondCy) < 2.5);
  const pitchRow = secondRow.length >= 2 ? secondRow : firstRow;
  const pitch =
    pitchRow.length >= 2
      ? (pitchRow[pitchRow.length - 1]!.cx - pitchRow[0]!.cx) /
        (pitchRow.length - 1)
      : 8.1;

  return {
    size,
    firstCy,
    firstRowMax: firstRow.length || 4,
    perRow: Math.max(secondRow.length, firstRow.length, 6),
    pitch,
    rowGap: Math.max(secondCy - firstCy, 12),
  };
}

function avgCy(slots: PctSlot[]) {
  if (slots.length === 0) return 0;
  return slots.reduce((sum, slot) => sum + slot.cy, 0) / slots.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pctToArt(slot: PctSlot) {
  return {
    x: (slot.cx / 100) * ART.w,
    y: (slot.cy / 100) * ART.h,
    d: (slot.size / 100) * ART.w,
  };
}

export function heritageForkPaths(
  origin: PctSlot,
  children: PctSlot[],
  childIds: string[] = [],
): { id: string; d: string }[] {
  if (children.length === 0) return [];
  const o = pctToArt(origin);
  const parentBottom: Point = { x: o.x, y: o.y + o.d / 2 - 4 };
  const crotch: Point = { x: o.x, y: parentBottom.y + 36 };
  const paths: { id: string; d: string }[] = [
    {
      id: "parent-stem",
      d: taperLimb(parentBottom, crotch, 22, 16, 0.04),
    },
  ];

  children.forEach((child, index) => {
    const c = pctToArt(child);
    const childTop: Point = { x: c.x, y: c.y - c.d / 2 + 8 };
    const dx = childTop.x - crotch.x;
    const start: Point = {
      x: crotch.x + dx * 0.22,
      y: crotch.y + 6 + Math.abs(dx) * 0.03,
    };
    const bulge = Math.max(-0.6, Math.min(0.6, (dx / ART.w) * 1.8));
    const startW = children.length > 6 ? 12 : 15;
    paths.push({
      id: childIds[index] ? `child-limb-${childIds[index]}` : `child-limb-${index}`,
      d: taperLimb(start, childTop, startW, 6, bulge),
    });
  });

  return paths;
}
