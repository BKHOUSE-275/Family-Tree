export const VIEW = { w: 720, h: 920 };

export type Point = { x: number; y: number };
export type Slot = Point & { rotate: number };

export const SUBJECT_SLOT: Slot = { x: 360, y: 122, rotate: 0 };

export const ROOT_FATHER_POS = { x: 188, y: 808 };
export const ROOT_MOTHER_POS = { x: 532, y: 808 };

export const TRUNK_CROTCH: Point = { x: 360, y: 438 };

export const CANOPY_EIGHT: Slot[] = [
  { x: 88, y: 272, rotate: -16 },
  { x: 164, y: 138, rotate: -10 },
  { x: 266, y: 64, rotate: -4 },
  { x: 454, y: 64, rotate: 4 },
  { x: 556, y: 138, rotate: 10 },
  { x: 632, y: 272, rotate: 16 },
  { x: 214, y: 368, rotate: -7 },
  { x: 506, y: 368, rotate: 7 },
];

export const CANOPY_LIMB_TIPS: Point[] = [
  { x: 122, y: 308 },
  { x: 194, y: 170 },
  { x: 288, y: 98 },
  { x: 432, y: 98 },
  { x: 526, y: 170 },
  { x: 598, y: 308 },
  { x: 250, y: 396 },
  { x: 470, y: 396 },
];

const SUBJECT_LEAF_H = 72;
const CHILD_LEAF_W = 88;

export function canopySlots(count: number): Slot[] {
  if (count === 8) return CANOPY_EIGHT;
  if (count === 0) return [];
  const cx = VIEW.w / 2;
  const cy = VIEW.h * 0.28;
  const rx = VIEW.w * 0.4;
  const ry = VIEW.h * 0.2;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = Math.PI * (0.92 - t * 0.84);
    return {
      x: cx + Math.cos(angle) * rx,
      y: cy - Math.sin(angle) * ry,
      rotate: (t - 0.5) * 28,
    };
  });
}

export function limbTipForSlot(slot: Slot, index: number, count: number): Point {
  if (count === 8 && CANOPY_LIMB_TIPS[index]) return CANOPY_LIMB_TIPS[index];
  return toward(slot, TRUNK_CROTCH, 36);
}

export function toward(from: Point, to: Point, dist: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mag = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / mag) * dist, y: from.y + (dy / mag) * dist };
}

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

export function childCluster(origin: Point, count: number): Slot[] {
  if (count === 0) return [];
  const gap = 8;
  const hang = 168;
  const rowDy = 102;
  const rows = count <= 5 ? [count] : [Math.ceil(count / 2), Math.floor(count / 2)];
  const prefer =
    origin.x < VIEW.w * 0.35 ? "right" : origin.x > VIEW.w * 0.65 ? "left" : "center";
  const points: Slot[] = [];

  rows.forEach((rowCount, row) => {
    const width = rowCount * CHILD_LEAF_W + (rowCount - 1) * gap;
    let start = origin.x - width / 2 + CHILD_LEAF_W / 2;
    if (prefer === "right") start = origin.x + 12;
    if (prefer === "left") start = origin.x - width - 12 + CHILD_LEAF_W;
    start = Math.max(52, Math.min(start, VIEW.w - 52 - (width - CHILD_LEAF_W)));
    const y = origin.y + hang + row * rowDy;
    for (let c = 0; c < rowCount; c += 1) {
      const t = rowCount === 1 ? 0.5 : c / (rowCount - 1);
      points.push({
        x: start + c * (CHILD_LEAF_W + gap),
        y,
        rotate: (t - 0.5) * 12,
      });
    }
  });

  return points;
}

export function childForkPaths(
  origin: Slot,
  children: Slot[],
  childIds: string[] = [],
): { id: string; d: string }[] {
  if (children.length === 0) return [];
  const parentBottom: Point = { x: origin.x, y: origin.y + SUBJECT_LEAF_H };
  const crotch: Point = { x: origin.x, y: parentBottom.y + 38 };
  const paths: { id: string; d: string }[] = [
    {
      id: "parent-stem",
      d: taperLimb(parentBottom, crotch, 10, 8, 0.02),
    },
  ];

  children.forEach((child, index) => {
    const dx = child.x - crotch.x;
    const start: Point = {
      x: crotch.x + dx * 0.38,
      y: crotch.y + 6 + Math.abs(dx) * 0.05 + (child.y - crotch.y) * 0.06,
    };
    const bulge = Math.max(-0.45, Math.min(0.45, (dx / VIEW.w) * 1.35));
    const startW = children.length > 6 ? 6 : 7.5;
    paths.push({
      id: childIds[index] ? `child-limb-${childIds[index]}` : `child-limb-${index}`,
      d: taperLimb(start, { x: child.x, y: child.y + 6 }, startW, 3, bulge),
    });
  });

  return paths;
}

export function petiolePath(tip: Point, leaf: Point): string {
  return taperLimb(tip, { x: leaf.x, y: leaf.y + 4 }, 10, 4, 0.1);
}

function n(value: number) {
  return value.toFixed(1);
}
