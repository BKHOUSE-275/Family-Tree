import { CANOPY_LIMB_TIPS, VIEW, taperLimb, type Point } from "@/components/tree/treeGeometry";

const FOLIAGE = [
  "#3d4f1f",
  "#4f5d2a",
  "#5c6b2a",
  "#6b7c38",
  "#8a9a3e",
  "#c45c26",
  "#d4762c",
  "#a3441c",
];

type Limb = {
  from: Point;
  to: Point;
  startW: number;
  endW: number;
  bulge: number;
};

const PRIMARY_LIMBS: Limb[] = [
  { from: { x: 340, y: 500 }, to: CANOPY_LIMB_TIPS[0], startW: 34, endW: 11, bulge: 0.2 },
  { from: { x: 336, y: 448 }, to: CANOPY_LIMB_TIPS[1], startW: 28, endW: 10, bulge: 0.14 },
  { from: { x: 342, y: 410 }, to: CANOPY_LIMB_TIPS[2], startW: 24, endW: 9, bulge: -0.1 },
  { from: { x: 378, y: 410 }, to: CANOPY_LIMB_TIPS[3], startW: 24, endW: 9, bulge: 0.1 },
  { from: { x: 384, y: 448 }, to: CANOPY_LIMB_TIPS[4], startW: 28, endW: 10, bulge: -0.14 },
  { from: { x: 380, y: 500 }, to: CANOPY_LIMB_TIPS[5], startW: 34, endW: 11, bulge: -0.2 },
  { from: { x: 332, y: 528 }, to: CANOPY_LIMB_TIPS[6], startW: 22, endW: 10, bulge: 0.12 },
  { from: { x: 388, y: 528 }, to: CANOPY_LIMB_TIPS[7], startW: 22, endW: 10, bulge: -0.12 },
  { from: { x: 356, y: 388 }, to: { x: 360, y: 62 }, startW: 22, endW: 9, bulge: 0.05 },
  { from: { x: 326, y: 560 }, to: { x: 72, y: 430 }, startW: 18, endW: 7, bulge: 0.22 },
  { from: { x: 394, y: 560 }, to: { x: 648, y: 430 }, startW: 18, endW: 7, bulge: -0.22 },
];

const TWIGS: Limb[] = [
  { from: { x: 200, y: 230 }, to: { x: 118, y: 168 }, startW: 7, endW: 3, bulge: 0.18 },
  { from: { x: 520, y: 230 }, to: { x: 602, y: 168 }, startW: 7, endW: 3, bulge: -0.18 },
  { from: { x: 250, y: 120 }, to: { x: 198, y: 58 }, startW: 6, endW: 2.5, bulge: -0.12 },
  { from: { x: 470, y: 120 }, to: { x: 522, y: 58 }, startW: 6, endW: 2.5, bulge: 0.12 },
  { from: { x: 150, y: 360 }, to: { x: 48, y: 318 }, startW: 8, endW: 3, bulge: 0.16 },
  { from: { x: 570, y: 360 }, to: { x: 672, y: 318 }, startW: 8, endW: 3, bulge: -0.16 },
  { from: { x: 300, y: 210 }, to: { x: 248, y: 96 }, startW: 6, endW: 2.4, bulge: 0.2 },
  { from: { x: 420, y: 210 }, to: { x: 472, y: 96 }, startW: 6, endW: 2.4, bulge: -0.2 },
];

type FoliageBlob = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotate: number;
  fill: string;
  opacity: number;
};

type FoliageLeaf = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  fill: string;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function makeBlobs(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  seed: number,
  size: [number, number],
  opacity: [number, number],
  palette: string[],
): FoliageBlob[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const dist = 0.12 + rand() * 0.88;
    return {
      x: round(cx + Math.cos(angle) * rx * dist * (0.72 + rand() * 0.28)),
      y: round(cy + Math.sin(angle) * ry * dist),
      rx: round(size[0] + rand() * (size[1] - size[0])),
      ry: round(size[0] * 0.7 + rand() * (size[1] - size[0]) * 0.55),
      rotate: round(rand() * 360),
      fill: palette[Math.floor(rand() * palette.length)],
      opacity: round(opacity[0] + rand() * (opacity[1] - opacity[0]), 3),
    };
  });
}

function makeLeaves(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  seed: number,
): FoliageLeaf[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const dist = 0.2 + rand() * 0.8;
    return {
      x: round(cx + Math.cos(angle) * rx * dist * (0.7 + rand() * 0.3)),
      y: round(cy + Math.sin(angle) * ry * dist),
      rotate: round(rand() * 360),
      scale: round(0.55 + rand() * 0.85, 3),
      fill: FOLIAGE[Math.floor(rand() * FOLIAGE.length)],
    };
  });
}

const BACK_BLOBS = makeBlobs(360, 268, 318, 248, 36, 11, [42, 78], [0.45, 0.8], [
  "#3d4f1f",
  "#3a461c",
  "#4f5d2a",
  "#a3441c",
]);
const MID_BLOBS = makeBlobs(360, 258, 300, 232, 52, 23, [28, 58], [0.5, 0.88], [
  "#c45c26",
  "#d4762c",
  "#6b7c38",
  "#a3441c",
]);
const FRONT_BLOBS = makeBlobs(358, 248, 268, 210, 38, 41, [16, 36], [0.35, 0.75], [
  "#d4762c",
  "#c45c26",
  "#8a9a3e",
  "#5c6b2a",
]);
const LEAVES = makeLeaves(360, 260, 292, 220, 34, 61);

function foliageEllipse(
  blob: FoliageBlob,
  key: string,
  rxScale = 1,
  opacityScale = 1,
) {
  return (
    <ellipse
      key={key}
      cx={blob.x}
      cy={blob.y}
      rx={round(blob.rx * rxScale)}
      ry={round(blob.ry * rxScale)}
      fill={blob.fill}
      opacity={round(blob.opacity * opacityScale, 3)}
      transform={`rotate(${blob.rotate} ${blob.x} ${blob.y})`}
    />
  );
}

function OakBack() {
  return (
    <>
      <defs>
        <linearGradient id="oak-bark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f1a0e" />
          <stop offset="38%" stopColor="#6b4423" />
          <stop offset="52%" stopColor="#8d5a30" />
          <stop offset="100%" stopColor="#2c160c" />
        </linearGradient>
        <linearGradient id="oak-bark-deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2c16" />
          <stop offset="100%" stopColor="#2a160c" />
        </linearGradient>
        <radialGradient id="oak-glow" cx="50%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#d4762c" stopOpacity="0.4" />
          <stop offset="42%" stopColor="#6b7c38" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#3d4f1f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="oak-ground" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b3a1c" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6b3a1c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="360" cy="858" rx="168" ry="18" fill="url(#oak-ground)" />

      <g className="canopy-sway">
        <ellipse cx="360" cy="250" rx="300" ry="220" fill="url(#oak-glow)" />
        {BACK_BLOBS.map((blob, index) => foliageEllipse(blob, `back-${index}`))}
        {MID_BLOBS.map((blob, index) => foliageEllipse(blob, `mid-${index}`, 1, 0.85))}
        {LEAVES.map((leaf, index) => (
          <g
            key={`leaf-${index}`}
            transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
          >
            <path
              d="M0 -16 C 7 -12 14 -4 12 6 C 8 15 2 19 0 21 C -2 19 -8 15 -12 6 C -14 -4 -7 -12 0 -16 Z"
              fill={leaf.fill}
            />
          </g>
        ))}
      </g>

      <g className="grow-trunk">
        <path
          d="M298 848
            C 286 780, 298 670, 314 560
            C 322 500, 328 450, 336 400
            C 342 368, 348 348, 352 338
            L 368 338
            C 372 348, 378 368, 384 400
            C 392 450, 398 500, 406 560
            C 422 670, 434 780, 422 848
            C 400 864, 320 864, 298 848 Z"
          fill="url(#oak-bark)"
        />
        <path
          d="M328 846 C 318 750, 332 620, 342 500 C 348 430, 352 380, 356 350"
          fill="none"
          stroke="#2a160c"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M382 844 C 396 740, 392 620, 384 510 C 378 440, 372 390, 368 352"
          fill="none"
          stroke="#1c0e08"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M318 848 C 280 842, 248 836, 214 844 C 236 830, 270 824, 304 832"
          fill="url(#oak-bark-deep)"
        />
        <path
          d="M402 848 C 440 842, 472 836, 506 844 C 484 830, 450 824, 416 832"
          fill="url(#oak-bark-deep)"
        />
        {PRIMARY_LIMBS.map((limb) => (
          <path
            key={`${limb.to.x}-${limb.to.y}-${limb.startW}`}
            d={taperLimb(limb.from, limb.to, limb.startW, limb.endW, limb.bulge)}
            fill="#4a2e16"
            stroke="#2a160c"
            strokeWidth="1.1"
          />
        ))}
        {TWIGS.map((limb) => (
          <path
            key={`twig-${limb.to.x}-${limb.to.y}`}
            d={taperLimb(limb.from, limb.to, limb.startW, limb.endW, limb.bulge)}
            fill="#5c3a21"
          />
        ))}
      </g>
    </>
  );
}

function OakFront() {
  return (
    <g className="canopy-sway">
      {FRONT_BLOBS.filter((blob) => Math.hypot(blob.x - 360, blob.y - 240) > 90).map(
        (blob, index) => foliageEllipse(blob, `front-${index}`, 0.7, 0.55),
      )}
    </g>
  );
}

export function OakTree({
  className,
  layer = "full",
}: {
  className?: string;
  layer?: "full" | "back" | "front";
}) {
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMax meet"
    >
      {layer !== "front" ? <OakBack /> : null}
      {layer !== "back" ? <OakFront /> : null}
    </svg>
  );
}
