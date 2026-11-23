/**
 * PROPS LIBRARY — reusable set pieces drawn in SVG.
 * All positions are in scene coordinates (1080 x 1920 stage).
 * `y` is always the floor / surface the prop stands on.
 */
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {palette} from '../theme/palette';
import {noise1} from '../lib/anim';

/* ---------------- Furniture ---------------- */

export const Desk: React.FC<{x: number; y: number; w?: number; h?: number; top?: string; body?: string; legs?: string}> = ({
  x,
  y,
  w = 420,
  h = 150,
  top = '#5b4636',
  body = '#3b2e25',
  legs = '#241c17',
}) => (
  <g>
    <rect x={x} y={y - h} width={w} height={14} rx={3} fill={top} />
    <rect x={x} y={y - h + 12} width={w} height={4} fill="#000" opacity={0.25} />
    <rect x={x + 14} y={y - h + 14} width={10} height={h - 14} fill={legs} />
    <rect x={x + w - 24} y={y - h + 14} width={10} height={h - 14} fill={legs} />
    <rect x={x + w - 150} y={y - h + 14} width={120} height={58} rx={3} fill={body} />
    <rect x={x + w - 104} y={y - h + 38} width={28} height={4} rx={2} fill="#000" opacity={0.35} />
  </g>
);

/** Office chair in profile (back rest on the left, for a character facing right). */
export const Chair: React.FC<{x: number; y: number; color?: string; flip?: boolean}> = ({x, y, color = '#1c2233', flip}) => (
  <g transform={flip ? `translate(${2 * x},0) scale(-1,1)` : undefined}>
    <rect x={x - 46} y={y - 104} width={92} height={14} rx={7} fill={color} />
    <path d={`M${x - 40},${y - 98} Q${x - 62},${y - 170} ${x - 50},${y - 250} L${x - 34},${y - 250} Q${x - 44},${y - 170} ${x - 26},${y - 98}Z`} fill={color} />
    <rect x={x - 4} y={y - 92} width={8} height={62} fill="#2b3142" />
    <path d={`M${x - 50},${y - 22} L${x + 50},${y - 22}`} stroke="#2b3142" strokeWidth={8} strokeLinecap="round" />
    <circle cx={x - 48} cy={y - 8} r={8} fill="#11141d" />
    <circle cx={x + 48} cy={y - 8} r={8} fill="#11141d" />
  </g>
);

export const DeskLamp: React.FC<{x: number; y: number; on?: number; color?: string}> = ({x, y, on = 1, color = '#2a2f3d'}) => (
  <g>
    {on > 0 && (
      <g style={{mixBlendMode: 'screen'}} opacity={on}>
        <defs>
          <radialGradient id={`lamp-${x}-${y}`} cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor="#ffcf8f" stopOpacity={0.55} />
            <stop offset="1" stopColor="#ffcf8f" stopOpacity={0} />
          </radialGradient>
        </defs>
        <polygon points={`${x + 62},${y - 118} ${x - 40},${y} ${x + 200},${y}`} fill={`url(#lamp-${x}-${y})`} />
      </g>
    )}
    <ellipse cx={x} cy={y - 4} rx={26} ry={6} fill={color} />
    <path d={`M${x},${y - 6} L${x + 18},${y - 92} L${x + 60},${y - 126}`} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d={`M${x + 40},${y - 140} L${x + 90},${y - 110} L${x + 76},${y - 96} L${x + 34},${y - 122}Z`} fill={color} />
    <ellipse cx={x + 83} cy={y - 103} rx={9} ry={5} fill="#ffe2b0" opacity={0.3 + 0.7 * on} />
  </g>
);

export const Plant: React.FC<{x: number; y: number; scale?: number; seed?: string; pot?: string; leaf?: string}> = ({
  x,
  y,
  scale = 1,
  seed = 'plant',
  pot = '#7a5a45',
  leaf = '#2f5a48',
}) => {
  const frame = useCurrentFrame();
  const leaves = Array.from({length: 9}, (_, i) => {
    const r = (k: string) => random(`${seed}${k}${i}`);
    const ang = -70 + r('a') * 140;
    const len = (60 + r('l') * 70) * scale;
    const sway = noise1(`${seed}s${i}`, frame / 40) * 4;
    return {ang: ang + sway, len, w: (14 + r('w') * 12) * scale, shade: r('s')};
  });
  return (
    <g>
      {leaves.map((l, i) => {
        const rad = ((l.ang - 90) * Math.PI) / 180;
        const tip = {x: x + Math.cos(rad) * l.len, y: y - 70 * scale + Math.sin(rad) * l.len};
        const mid = {x: x + Math.cos(rad) * l.len * 0.55, y: y - 70 * scale + Math.sin(rad) * l.len * 0.55};
        const n = {x: -Math.sin(rad) * l.w, y: Math.cos(rad) * l.w};
        return (
          <g key={i}>
            <path
              d={`M${x},${y - 70 * scale} Q${mid.x + n.x},${mid.y + n.y} ${tip.x},${tip.y} Q${mid.x - n.x},${mid.y - n.y} ${x},${y - 70 * scale}Z`}
              fill={leaf}
              opacity={0.75 + l.shade * 0.25}
            />
            <path d={`M${x},${y - 70 * scale} Q${mid.x},${mid.y} ${tip.x},${tip.y}`} stroke="#000" strokeOpacity={0.18} strokeWidth={1.5} fill="none" />
          </g>
        );
      })}
      <path d={`M${x - 34 * scale},${y - 76 * scale} H${x + 34 * scale} L${x + 26 * scale},${y} H${x - 26 * scale}Z`} fill={pot} />
      <rect x={x - 36 * scale} y={y - 80 * scale} width={72 * scale} height={10 * scale} rx={3} fill={pot} />
    </g>
  );
};

export const Shelf: React.FC<{x: number; y: number; w?: number; seed?: string}> = ({x, y, w = 220, seed = 'shelf'}) => {
  const colors = ['#8a6f55', '#5d6b85', '#a35d3d', '#cbb48d', '#3f4c66', '#7c8b74'];
  let cx = x + 8;
  const books: React.ReactNode[] = [];
  let i = 0;
  while (cx < x + w - 30) {
    const r = (k: string) => random(`${seed}${k}${i}`);
    const bw = 10 + r('w') * 12;
    const bh = 44 + r('h') * 30;
    const lean = r('l') > 0.85 ? 8 : 0;
    books.push(<rect key={i} x={cx} y={y - bh} width={bw} height={bh} fill={colors[Math.floor(r('c') * colors.length)]} transform={lean ? `rotate(${lean} ${cx} ${y})` : undefined} />);
    cx += bw + 2 + (r('g') > 0.8 ? 14 : 0);
    i++;
  }
  return (
    <g>
      {books}
      <rect x={x} y={y} width={w} height={10} fill="#3b2e25" />
    </g>
  );
};

export const Mug: React.FC<{x: number; y: number; steam?: boolean; color?: string}> = ({x, y, steam = true, color = '#d9cbb3'}) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {steam &&
        [0, 1].map((k) => (
          <path
            key={k}
            d={`M${x + 4 + k * 8},${y - 34} q${6 + noise1('st' + k, frame / 20) * 6},-14 0,-28 q${-6},-14 0,-28`}
            stroke="#fff"
            strokeOpacity={0.12 + 0.08 * Math.sin(frame / 15 + k)}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      <rect x={x - 6} y={y - 30} width={26} height={30} rx={4} fill={color} />
      <path d={`M${x + 20},${y - 24} q12,0 12,9 q0,9 -12,9`} stroke={color} strokeWidth={4} fill="none" />
    </g>
  );
};

/* ---------------- Architecture ---------------- */

/** A window with a frame. The outside view is passed as children (clipped). */
export const WindowFrame: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
  cols?: number;
  rows?: number;
  frame?: string;
  children?: React.ReactNode;
  reflection?: number;
  blinds?: number; // 0..1 how far blinds are lowered
}> = ({x, y, w, h, id, cols = 2, rows = 1, frame = '#0c1222', children, reflection = 0.12, blinds = 0}) => (
  <g>
    <defs>
      <clipPath id={`clip-${id}`}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <linearGradient id={`refl-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.45" stopColor="#fff" stopOpacity={reflection} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.7" stopColor="#fff" stopOpacity={reflection * 0.6} />
        <stop offset="0.75" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    </defs>
    <g clipPath={`url(#clip-${id})`}>
      {children}
      <rect x={x} y={y} width={w} height={h} fill={`url(#refl-${id})`} />
      {blinds > 0 &&
        Array.from({length: Math.ceil((h * blinds) / 18)}, (_, i) => (
          <rect key={i} x={x} y={y + i * 18} width={w} height={12} fill="#141c30" opacity={0.92} />
        ))}
    </g>
    <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill="none" stroke={frame} strokeWidth={20} />
    {Array.from({length: cols - 1}, (_, i) => (
      <rect key={`c${i}`} x={x + ((i + 1) * w) / cols - 5} y={y} width={10} height={h} fill={frame} />
    ))}
    {Array.from({length: rows - 1}, (_, i) => (
      <rect key={`r${i}`} x={x} y={y + ((i + 1) * h) / rows - 5} width={w} height={10} fill={frame} />
    ))}
    <rect x={x - 24} y={y + h + 8} width={w + 48} height={14} fill={frame} />
  </g>
);

/** Wall-hanging tear-off calendar. */
export const WallCalendar: React.FC<{x: number; y: number; month: string; day: string; scale?: number; accent?: string}> = ({
  x,
  y,
  month,
  day,
  scale = 1,
  accent = palette.orange,
}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-60} y={0} width={120} height={140} rx={8} fill={palette.white} />
    <rect x={-60} y={0} width={120} height={40} rx={8} fill={accent} />
    <rect x={-60} y={28} width={120} height={12} fill={accent} />
    <text x={0} y={30} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill="#fff" letterSpacing={3}>
      {month}
    </text>
    <text x={0} y={118} textAnchor="middle" fontFamily="Bebas Neue" fontSize={78} fill={palette.navy800}>
      {day}
    </text>
  </g>
);

export const WallClock: React.FC<{x: number; y: number; r?: number; hours: number; color?: string}> = ({x, y, r = 34, hours, color = '#e9e1d3'}) => {
  const hA = ((hours % 12) / 12) * 360;
  const mA = ((hours * 60) % 60) * 6;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} stroke="#3a3a3a" strokeWidth={4} />
      {Array.from({length: 12}, (_, i) => (
        <line
          key={i}
          x1={x + Math.sin((i * Math.PI) / 6) * r * 0.78}
          y1={y - Math.cos((i * Math.PI) / 6) * r * 0.78}
          x2={x + Math.sin((i * Math.PI) / 6) * r * 0.9}
          y2={y - Math.cos((i * Math.PI) / 6) * r * 0.9}
          stroke="#555"
          strokeWidth={2}
        />
      ))}
      <line x1={x} y1={y} x2={x + Math.sin((hA * Math.PI) / 180) * r * 0.5} y2={y - Math.cos((hA * Math.PI) / 180) * r * 0.5} stroke="#222" strokeWidth={4} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + Math.sin((mA * Math.PI) / 180) * r * 0.75} y2={y - Math.cos((mA * Math.PI) / 180) * r * 0.75} stroke="#222" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** Simple anonymous passer-by silhouette (never the protagonist). */
export const Passerby: React.FC<{x: number; y: number; scale?: number; phase: number; color?: string; opacity?: number; bag?: boolean}> = ({
  x,
  y,
  scale = 1,
  phase,
  color = '#1a2340',
  opacity = 0.75,
  bag,
}) => {
  const s = Math.sin(phase);
  const leg = (a: number) => `M0,-170 l${Math.sin((a * Math.PI) / 180) * 170},${Math.cos((a * Math.PI) / 180) * 170}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <path d={leg(18 * s)} stroke={color} strokeWidth={26} strokeLinecap="round" />
      <path d={leg(-18 * s)} stroke={color} strokeWidth={26} strokeLinecap="round" />
      <rect x={-24} y={-300} width={48} height={140} rx={22} fill={color} />
      <circle cx={2} cy={-330} r={26} fill={color} />
      <path d={`M0,-285 l${Math.sin((-14 * s * Math.PI) / 180) * 120},120`} stroke={color} strokeWidth={18} strokeLinecap="round" />
      {bag && <rect x={-60} y={-110} width={44} height={70} rx={8} fill={color} />}
    </g>
  );
};

/** Commercial airliner silhouette (generic, unbranded). */
export const Plane: React.FC<{x: number; y: number; scale?: number; color?: string; lights?: boolean}> = ({x, y, scale = 1, color = '#1e2742', lights = true}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M-260,0 Q-270,-18 -230,-22 L200,-22 Q260,-20 280,0 Q260,14 200,14 L-230,14 Q-262,14 -260,0Z" fill={color} />
      <path d="M-200,-20 L-250,-110 L-215,-110 L-150,-20Z" fill={color} />
      <path d="M-20,4 L-110,70 L-60,70 L60,4Z" fill={color} opacity={0.9} />
      <ellipse cx={-30} cy={34} rx={34} ry={14} fill={color} />
      {Array.from({length: 16}, (_, i) => (
        <rect key={i} x={-170 + i * 22} y={-10} width={8} height={7} rx={2} fill="#ffd9a0" opacity={0.55} />
      ))}
      {lights && <circle cx={-250} cy={-108} r={4} fill="#ff5a4a" opacity={frame % 40 < 20 ? 1 : 0.2} />}
    </g>
  );
};

/* ---------------- Rooftop ---------------- */

export const Railing: React.FC<{x0: number; x1: number; y: number; h?: number; color?: string}> = ({x0, x1, y, h = 150, color = '#0b1124'}) => (
  <g>
    <rect x={x0} y={y - h} width={x1 - x0} height={10} rx={5} fill={color} />
    <rect x={x0} y={y - h * 0.5} width={x1 - x0} height={6} fill={color} />
    {Array.from({length: Math.floor((x1 - x0) / 120) + 1}, (_, i) => (
      <rect key={i} x={x0 + i * 120} y={y - h} width={8} height={h} fill={color} />
    ))}
    <rect x={x0} y={y - 8} width={x1 - x0} height={300} fill={color} />
  </g>
);

export const RooftopUnits: React.FC<{x: number; y: number; color?: string}> = ({x, y, color = '#0e152b'}) => (
  <g>
    <rect x={x} y={y - 90} width={150} height={90} rx={6} fill={color} />
    <circle cx={x + 75} cy={y - 45} r={30} fill="none" stroke="#1a2440" strokeWidth={6} />
    <rect x={x + 180} y={y - 210} width={110} height={210} rx={50} fill={color} />
    <rect x={x + 230} y={y - 330} width={6} height={120} fill={color} />
    <rect x={x + 200} y={y - 300} width={70} height={5} fill={color} />
  </g>
);

/** Desktop monitor in profile, screen facing LEFT (towards a seated user). */
export const DesktopMonitor: React.FC<{x: number; y: number; glow?: number; glowColor?: string}> = ({x, y, glow = 1, glowColor = '#cfe1ff'}) => (
  <g>
    <ellipse cx={x + 40} cy={y - 3} rx={42} ry={6} fill="#2b2f3a" />
    <rect x={x + 36} y={y - 96} width={9} height={94} fill="#3a3f4c" />
    <path d={`M${x + 18},${y - 250} L${x + 34},${y - 250} L${x + 40},${y - 96} L${x + 24},${y - 96}Z`} fill="#22262f" />
    <path d={`M${x + 16},${y - 248} L${x + 20},${y - 98}`} stroke={glowColor} strokeWidth={3} opacity={0.4 + 0.6 * glow} />
    <rect x={x - 70} y={y - 8} width={80} height={8} rx={3} fill="#3a3f4c" />
  </g>
);

/** Ceiling fan seen slightly from below; blades rotate with the frame. */
export const CeilingFan: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const a = frame * 0.55;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-3} y={-120} width={6} height={110} fill="#6b5a48" />
      {[0, 1, 2].map((k) => {
        const ang = a + (k * Math.PI * 2) / 3;
        const len = 150 * Math.cos(ang);
        return <ellipse key={k} cx={len / 2} cy={0} rx={Math.abs(len) / 2 + 4} ry={7} fill="#7a6650" opacity={0.85} />;
      })}
      <ellipse cx={0} cy={0} rx={22} ry={12} fill="#5b4a3a" />
    </g>
  );
};
