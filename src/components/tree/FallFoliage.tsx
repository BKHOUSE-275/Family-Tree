const FALL_COLORS = ["#3d4f1f", "#5c6b2a", "#c45c26", "#d4762c", "#8a9a3e", "#a3441c", "#6b7c38"];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type FoliageLeaf = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  fill: string;
};

export function makeFoliage(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  seed = 7,
): FoliageLeaf[] {
  const rand = mulberry32(seed);
  const leaves: FoliageLeaf[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2;
    const dist = 0.18 + rand() * 0.82;
    leaves.push({
      x: cx + Math.cos(angle) * rx * dist * (0.7 + rand() * 0.3),
      y: cy + Math.sin(angle) * ry * dist,
      rotate: rand() * 360,
      scale: 0.55 + rand() * 0.9,
      fill: FALL_COLORS[Math.floor(rand() * FALL_COLORS.length)],
    });
  }
  return leaves;
}

export function LeafShape({
  x,
  y,
  rotate,
  scale,
  fill,
  className,
  delay = 0,
}: FoliageLeaf & { className?: string; delay?: number }) {
  return (
    <g
      className={className}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
    >
      <path
        d="M0 -16 C 7 -12 14 -4 12 6 C 8 15 2 19 0 21 C -2 19 -8 15 -12 6 C -14 -4 -7 -12 0 -16 Z"
        fill={fill}
      />
      <path
        d="M0 -12 C 0.4 2 0 16"
        fill="none"
        stroke="rgba(42,24,16,0.22)"
        strokeWidth="0.8"
      />
    </g>
  );
}

export function FallTrunk({
  originX,
  groundY,
  height,
}: {
  originX: number;
  groundY: number;
  height: number;
}) {
  const top = groundY - height;
  const flare = height * 0.08;
  return (
    <g className="grow-trunk">
      <ellipse
        cx={originX}
        cy={groundY + 8}
        rx={height * 0.42}
        ry={height * 0.028}
        fill="#6b3a1c"
        opacity="0.35"
      />
      <path
        d={`M${originX - flare} ${groundY}
          C ${originX - flare * 0.7} ${groundY - height * 0.25}, ${originX - flare * 0.45} ${groundY - height * 0.55}, ${originX - 8} ${top + 40}
          C ${originX - 4} ${top + 10}, ${originX + 4} ${top + 10}, ${originX + 8} ${top + 40}
          C ${originX + flare * 0.45} ${groundY - height * 0.55}, ${originX + flare * 0.7} ${groundY - height * 0.25}, ${originX + flare} ${groundY}
          Z`}
        fill="#5c3a21"
      />
      <path
        d={`M${originX - 4} ${groundY - 8}
          C ${originX - 10} ${groundY - height * 0.4}, ${originX - 2} ${groundY - height * 0.7}, ${originX - 1} ${top + 50}`}
        fill="none"
        stroke="#3d2414"
        strokeWidth="3"
        opacity="0.45"
      />
      <path
        d={`M${originX + 6} ${groundY - height * 0.12}
          C ${originX + 14} ${groundY - height * 0.22}, ${originX + 70} ${groundY - height * 0.18}, ${originX + 110} ${groundY - height * 0.08}`}
        fill="none"
        stroke="#5c3a21"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={`M${originX - 6} ${groundY - height * 0.14}
          C ${originX - 18} ${groundY - height * 0.24}, ${originX - 80} ${groundY - height * 0.2}, ${originX - 118} ${groundY - height * 0.1}`}
        fill="none"
        stroke="#5c3a21"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={`M${originX + 4} ${top + 70}
          C ${originX + 40} ${top + 40}, ${originX + 90} ${top + 48}, ${originX + 130} ${top + 70}`}
        fill="none"
        stroke="#6b4423"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={`M${originX - 4} ${top + 66}
          C ${originX - 44} ${top + 36}, ${originX - 96} ${top + 44}, ${originX - 136} ${top + 68}`}
        fill="none"
        stroke="#6b4423"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={`M${originX} ${top + 48}
          C ${originX - 8} ${top + 10}, ${originX + 10} ${top - 30}, ${originX + 4} ${top - 55}`}
        fill="none"
        stroke="#5c3a21"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={`M${originX - 2} ${top + 52}
          C ${originX - 30} ${top + 8}, ${originX - 48} ${top - 18}, ${originX - 70} ${top - 28}`}
        fill="none"
        stroke="#6b4423"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d={`M${originX + 2} ${top + 52}
          C ${originX + 32} ${top + 6}, ${originX + 52} ${top - 16}, ${originX + 76} ${top - 26}`}
        fill="none"
        stroke="#6b4423"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}
