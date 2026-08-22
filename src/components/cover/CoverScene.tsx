"use client";

function Figure({
  x,
  y,
  scale = 1,
  delay = 0,
  pose = "stand",
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
  pose?: "stand" | "jump" | "pair" | "cane" | "wave";
}) {
  return (
    <g
      className="floaty"
      style={{ animationDelay: `${delay}s` }}
      transform={`translate(${x} ${y}) scale(${scale})`}
    >
      <ellipse cx="0" cy="18" rx="9" ry="3" fill="#f4b6d0" opacity="0.35" />
      {pose === "pair" ? (
        <>
          <circle cx="-6" cy="-18" r="4.2" fill="#d63d7a" />
          <path d="M-10 -12 q6 18 0 28 h-5 q-2 -16 1 -28z" fill="#d63d7a" />
          <circle cx="7" cy="-18" r="4.2" fill="#d63d7a" />
          <path d="M3 -12 q6 18 0 28 h-5 q-2 -16 1 -28z" fill="#d63d7a" />
          <path d="M-6 -8h13" stroke="#d63d7a" strokeWidth="2" />
        </>
      ) : pose === "jump" ? (
        <>
          <circle cx="0" cy="-22" r="4.4" fill="#d63d7a" />
          <path d="M0 -16 c8 4 9 16 4 26 l-4 -6 -4 6 c-5 -10 -4 -22 4 -26z" fill="#d63d7a" />
        </>
      ) : pose === "cane" ? (
        <>
          <circle cx="0" cy="-16" r="4" fill="#111" />
          <path d="M-4 -11 q5 16 1 24 h-4 q-1 -14 3 -24z" fill="#111" />
          <path d="M4 -4 l6 18" stroke="#111" strokeWidth="1.6" />
        </>
      ) : pose === "wave" ? (
        <>
          <circle cx="0" cy="-18" r="4.2" fill="#111" />
          <path d="M-4 -12 q5 16 1 26 h-4 q-1 -16 3 -26z" fill="#111" />
          <path d="M2 -8 q10 -10 8 -18" stroke="#111" strokeWidth="1.8" fill="none" />
        </>
      ) : (
        <>
          <circle cx="0" cy="-18" r="4.2" fill="#d63d7a" />
          <path d="M-6 -12 q6 20 0 30 h-4 q-2 -18 2 -30z" fill="#d63d7a" />
          <path d="M2 -12 q6 20 0 30 h-4 q-2 -18 2 -30z" fill="#d63d7a" />
        </>
      )}
    </g>
  );
}

export function CoverScene() {
  const dots = Array.from({ length: 28 }, (_, i) => ({
    cx: 210 + Math.cos(i * 1.1) * (70 + (i % 5) * 18),
    cy: 118 + Math.sin(i * 0.9) * (48 + (i % 4) * 10),
    r: 8 + (i % 4) * 3,
  }));

  return (
    <svg
      viewBox="0 0 420 520"
      className="mx-auto w-full max-w-md drop-shadow-sm"
      role="img"
      aria-label="Family tree with people as leaves"
    >
      {dots.map((dot, i) => (
        <circle key={i} className="leaf-dot" {...dot} />
      ))}
      <g className="grow-trunk">
        <path
          d="M210 500 c-8 -70 -6 -140 -2 -210 c8 -18 14 -28 14 -46 c0 18 8 30 16 48 c4 70 6 140 -2 208z"
          fill="#111"
        />
        <path d="M208 470 c-40 18 -70 28 -96 34" stroke="#111" strokeWidth="7" fill="none" />
        <path d="M212 478 c36 14 72 24 98 30" stroke="#111" strokeWidth="7" fill="none" />
        <path d="M206 488 c-28 8 -48 10 -70 10" stroke="#111" strokeWidth="5" fill="none" />
        <path d="M214 490 c30 6 58 8 78 8" stroke="#111" strokeWidth="5" fill="none" />
        <path
          d="M222 290 c40 -20 78 -8 110 8 M198 286 c-44 -18 -86 -6 -118 12 M230 250 c30 -40 70 -48 108 -38 M190 248 c-36 -38 -80 -42 -118 -28 M210 220 c-10 -70 8 -110 0 -150 M168 230 c-20 -50 -10 -90 8 -120 M252 228 c22 -48 18 -88 4 -118"
          stroke="#111"
          strokeWidth="3"
          fill="none"
        />
      </g>
      <g className="sway">
        <Figure x={168} y={210} pose="jump" delay={0.1} />
        <Figure x={210} y={168} pose="pair" delay={0.4} scale={0.92} />
        <Figure x={258} y={200} delay={0.2} />
        <Figure x={140} y={150} pose="jump" delay={0.6} scale={0.85} />
        <Figure x={280} y={145} delay={0.15} scale={0.9} />
        <Figure x={190} y={120} pose="pair" delay={0.5} scale={0.78} />
        <Figure x={240} y={112} delay={0.35} scale={0.8} />
        <Figure x={120} y={200} delay={0.8} scale={0.75} />
        <Figure x={300} y={190} pose="jump" delay={0.25} scale={0.8} />
        <Figure x={155} y={100} delay={0.9} scale={0.7} />
        <Figure x={265} y={95} pose="pair" delay={0.45} scale={0.7} />
        <Figure x={210} y={80} delay={0.7} scale={0.72} />
        <Figure x={175} y={250} delay={0.3} scale={0.7} />
        <Figure x={250} y={255} delay={0.55} scale={0.7} />
      </g>
      <Figure x={150} y={430} pose="cane" delay={0.2} />
      <Figure x={128} y={432} pose="stand" delay={0.4} scale={0.9} />
      <Figure x={270} y={428} pose="wave" delay={0.1} />
    </svg>
  );
}
