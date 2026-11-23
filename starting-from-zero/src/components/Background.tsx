/**
 * ENVIRONMENT TOOLKIT
 * Camera + parallax layers, skies, the procedural city skyline and the
 * cinematic finishing layers (grain, vignette, grade, haze, light).
 */
import React, {createContext, useContext, useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {palette} from '../theme/palette';
import {noise1} from '../lib/anim';

/* ------------------------------------------------------------------ */
/* Camera & parallax                                                   */
/* ------------------------------------------------------------------ */

export type Cam = {x: number; y: number; zoom: number; rot?: number; shake?: number};
const CamCtx = createContext<Cam>({x: 0, y: 0, zoom: 1});
const C = {x: 540, y: 960};

/** Wrap a scene's layers. Everything inside reacts to the camera. */
export const Camera: React.FC<{cam: Cam; children: React.ReactNode; background?: string}> = ({cam, children, background}) => {
  const frame = useCurrentFrame();
  const shake = cam.shake ?? 0;
  const sx = shake ? noise1('shx', frame / 3) * shake : 0;
  const sy = shake ? noise1('shy', frame / 3 + 9) * shake : 0;
  return (
    <CamCtx.Provider value={{...cam, x: cam.x + sx, y: cam.y + sy}}>
      <AbsoluteFill style={{overflow: 'hidden', background: background ?? palette.navy950}}>{children}</AbsoluteFill>
    </CamCtx.Provider>
  );
};

/**
 * A parallax layer. depth 0 = infinitely far (doesn't move),
 * 1 = the subject plane, > 1 = foreground (moves faster than the subject).
 */
export const Layer: React.FC<{
  depth: number;
  children: React.ReactNode;
  blur?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({depth, children, blur = 0, opacity = 1, style}) => {
  const cam = useContext(CamCtx);
  const s = 1 + (cam.zoom - 1) * depth;
  const rot = (cam.rot ?? 0) * Math.min(1, depth);
  return (
    <AbsoluteFill
      style={{
        transformOrigin: '0 0',
        transform: `translate(${C.x}px, ${C.y}px) rotate(${rot}deg) scale(${s}) translate(${-C.x - cam.x * depth}px, ${-C.y - cam.y * depth}px)`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        opacity,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Full-frame SVG canvas in scene coordinates (1080 x 1920), allowed to draw outside. */
export const Stage: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Sky                                                                 */
/* ------------------------------------------------------------------ */

export const Sky: React.FC<{
  stops: readonly string[];
  id: string;
  top?: number;
  bottom?: number;
  x?: number;
  width?: number;
}> = ({stops, id, top = -600, bottom = 1500, x = -1200, width = 3480}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map((c, i) => (
          <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
    <rect x={x} y={top} width={width} height={bottom - top} fill={`url(#${id})`} />
  </g>
);

export const Glow: React.FC<{cx: number; cy: number; r: number; color: string; opacity?: number; id: string}> = ({
  cx,
  cy,
  r,
  color,
  opacity = 1,
  id,
}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={opacity} />
        <stop offset="0.35" stopColor={color} stopOpacity={opacity * 0.45} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </g>
);

export const Stars: React.FC<{count?: number; seed?: string; area?: [number, number, number, number]; opacity?: number}> = ({
  count = 60,
  seed = 'stars',
  area = [-400, -400, 1880, 600],
  opacity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () =>
      Array.from({length: count}, (_, i) => ({
        x: area[0] + random(`${seed}x${i}`) * (area[2] - area[0]),
        y: area[1] + random(`${seed}y${i}`) * (area[3] - area[1]),
        r: 0.8 + random(`${seed}r${i}`) * 1.6,
        p: random(`${seed}p${i}`) * 10,
      })),
    [count, seed, area],
  );
  return (
    <g>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#dfe8ff" opacity={opacity * (0.5 + 0.5 * Math.sin(frame / 18 + s.p))} />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Procedural skyline                                                  */
/* ------------------------------------------------------------------ */

export type SkylineTime = 'night' | 'sunrise' | 'golden' | 'dusk' | 'day';

type Building = {
  x: number;
  w: number;
  h: number;
  kind: 'block' | 'stepped' | 'spire' | 'crown' | 'twist' | 'super' | 'round';
  seed: number;
};

const skylineColors = (time: SkylineTime, layer: number) => {
  // layer 0 = far, 1 = mid, 2 = near
  const sets: Record<SkylineTime, string[]> = {
    night: ['#1b2a52', '#121e3d', '#0b142b'],
    dusk: ['#3d3a66', '#272a50', '#171a36'],
    sunrise: ['#5a4e78', '#33355f', '#1c2144'],
    golden: ['#9a7f86', '#6a5d75', '#3c3d5c'],
    day: ['#b9b3b0', '#8e8b94', '#5f6276'],
  };
  return sets[time][layer];
};

export const Skyline: React.FC<{
  seed: string;
  baseY: number;
  x0?: number;
  x1?: number;
  scale?: number;
  layer?: 0 | 1 | 2;
  time?: SkylineTime;
  lights?: number;
  /** x position of the landmark supertall tower (omit for none). */
  superX?: number;
  maxH?: number;
}> = ({seed, baseY, x0 = -500, x1 = 1580, scale = 1, layer = 1, time = 'night', lights = 1, superX, maxH = 520}) => {
  const frame = useCurrentFrame();
  const buildings = useMemo(() => {
    const out: Building[] = [];
    let x = x0;
    let i = 0;
    while (x < x1) {
      const r = (k: string) => random(`${seed}-${k}-${i}`);
      const w = (36 + r('w') * 80) * scale;
      const tall = r('t') > 0.78;
      const h = (tall ? 0.55 + r('h') * 0.45 : 0.16 + r('h') * 0.42) * maxH * scale;
      const kinds: Building['kind'][] = ['block', 'block', 'stepped', 'spire', 'crown', 'twist', 'round'];
      const kind = tall ? kinds[1 + Math.floor(r('k') * 6)] : kinds[Math.floor(r('k') * 3)];
      if (superX === undefined || Math.abs(x + w / 2 - superX) > 70 * scale) out.push({x, w, h, kind, seed: i});
      x += w + (r('g') > 0.7 ? r('g2') * 24 * scale : -4 * scale);
      i++;
    }
    if (superX !== undefined) out.push({x: superX - 40 * scale, w: 80 * scale, h: maxH * 2.15 * scale, kind: 'super', seed: 999});
    // draw shorter ones in front
    return out.sort((a, b) => b.h - a.h);
  }, [seed, x0, x1, scale, superX, maxH]);

  const fill = skylineColors(time, layer);
  const patId = `win-${seed}`;
  const gradId = `bg-${seed}`;
  const warm = time === 'night' || time === 'dusk';
  const winA = warm ? '#ffcf8a' : '#ffe3b8';
  const winB = warm ? '#9cc4ff' : '#cfe0ff';

  const shape = (b: Building): string => {
    const {x, w, h, kind} = b;
    const top = baseY - h;
    const r = (k: string) => random(`${seed}-${k}-${b.seed}`);
    switch (kind) {
      case 'stepped': {
        const s1 = w * 0.18;
        return `M${x},${baseY}V${top + h * 0.22}H${x + s1}V${top + h * 0.08}H${x + s1 * 2}V${top}H${x + w - s1 * 2}V${top + h * 0.08}H${x + w - s1}V${top + h * 0.22}H${x + w}V${baseY}Z`;
      }
      case 'spire':
        return `M${x},${baseY}V${top + 30 * scale}L${x + w / 2},${top - h * 0.18}L${x + w},${top + 30 * scale}V${baseY}Z`;
      case 'crown':
        return `M${x},${baseY}V${top + w * 0.5}L${x + w * (r('c') > 0.5 ? 0 : 1)},${top}L${x + w * (r('c') > 0.5 ? 1 : 0)},${top + w * 0.5}V${baseY}Z`;
      case 'twist': {
        const k = w * 0.22;
        return `M${x},${baseY}L${x + k},${top + h * 0.5}L${x},${top}H${x + w}L${x + w - k},${top + h * 0.5}L${x + w},${baseY}Z`;
      }
      case 'round':
        return `M${x},${baseY}V${top + w / 2}A${w / 2},${w / 2} 0 0 1 ${x + w},${top + w / 2}V${baseY}Z`;
      case 'super': {
        // Generic tiered supertall with a needle
        const cx = x + w / 2;
        const half = w / 2;
        const widths = [1, 0.8, 0.62, 0.46, 0.33, 0.22];
        const tops = [0.22, 0.4, 0.55, 0.68, 0.8, 0.88];
        let d = `M${cx - half},${baseY}`;
        widths.forEach((tw, i) => {
          d += `V${baseY - h * tops[i]}H${cx - half * (widths[i + 1] ?? 0.06)}`;
        });
        d += `L${cx},${baseY - h}L${cx + half * 0.06},${baseY - h * 0.88}`;
        for (let i = widths.length - 1; i >= 0; i--) {
          d += `H${cx + half * widths[i]}V${baseY - h * (i === 0 ? 0 : tops[i - 1])}`;
        }
        return d + 'Z';
      }
      default:
        return `M${x},${baseY}V${top}H${x + w}V${baseY}Z`;
    }
  };

  return (
    <g>
      <defs>
        <pattern id={patId} width={14 * scale} height={18 * scale} patternUnits="userSpaceOnUse">
          <rect x={3 * scale} y={4 * scale} width={6 * scale} height={8 * scale} fill={winA} opacity={0.55} />
        </pattern>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fill} />
          <stop offset="1" stopColor={time === 'night' ? '#060b1a' : fill} stopOpacity={1} />
        </linearGradient>
      </defs>
      {buildings.map((b, i) => {
        const d = shape(b);
        const rr = (k: string) => random(`${seed}-${k}-${b.seed}`);
        const litFrac = rr('lit');
        const top = baseY - b.h;
        return (
          <g key={i}>
            <path d={d} fill={`url(#${gradId})`} />
            {lights > 0 && litFrac > 0.25 && (
              <g opacity={lights * (warm ? 0.45 + 0.5 * litFrac : 0.18)}>
                <clipPath id={`clip-${seed}-${i}`}>
                  <path d={d} />
                </clipPath>
                <rect
                  x={b.x + 4}
                  y={top + 18 * scale}
                  width={Math.max(0, b.w - 8)}
                  height={Math.max(0, b.h - 24 * scale)}
                  fill={`url(#${patId})`}
                  clipPath={`url(#clip-${seed}-${i})`}
                  opacity={rr('o') > 0.5 ? 1 : 0.55}
                />
                {/* a few brighter / cooler windows */}
                {Array.from({length: 3}, (_, k) => (
                  <rect
                    key={k}
                    x={b.x + 6 + rr(`wx${k}`) * Math.max(1, b.w - 16)}
                    y={top + 24 * scale + rr(`wy${k}`) * Math.max(1, b.h - 50 * scale)}
                    width={6 * scale}
                    height={8 * scale}
                    fill={k === 0 ? winB : winA}
                    opacity={0.5 + 0.5 * Math.sin(frame / (30 + k * 11) + b.seed)}
                  />
                ))}
              </g>
            )}
            {/* aviation warning lights on tall towers */}
            {lights > 0 && b.h > maxH * 0.6 * scale && (
              <circle
                cx={b.kind === 'super' || b.kind === 'spire' ? b.x + b.w / 2 : b.x + b.w * 0.5}
                cy={b.kind === 'super' ? baseY - b.h : b.kind === 'spire' ? top - b.h * 0.18 : top}
                r={3.2 * scale}
                fill="#ff5a4a"
                opacity={((frame + b.seed * 7) % 60) < 30 ? 0.95 * lights : 0.15 * lights}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Atmosphere & finishing                                              */
/* ------------------------------------------------------------------ */

/** Horizontal haze band (city glow, morning mist). */
export const Haze: React.FC<{y: number; height: number; color: string; opacity?: number; id: string}> = ({
  y,
  height,
  color,
  opacity = 0.6,
  id,
}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={0} />
        <stop offset="0.55" stopColor={color} stopOpacity={opacity} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-1500} y={y - height / 2} width={4080} height={height} fill={`url(#${id})`} />
  </g>
);

/** Soft volumetric beam (window light, laptop glow cone). */
export const LightBeam: React.FC<{
  points: [number, number][];
  color: string;
  opacity?: number;
  id: string;
  from: [number, number];
  to: [number, number];
}> = ({points, color, opacity = 0.35, id, from, to}) => (
  <g style={{mixBlendMode: 'screen'}}>
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
        <stop offset="0" stopColor={color} stopOpacity={opacity} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    <polygon points={points.map((p) => p.join(',')).join(' ')} fill={`url(#${id})`} />
  </g>
);

/** Dust motes drifting slowly inside a region (used only inside light beams). */
export const Dust: React.FC<{area: [number, number, number, number]; count?: number; seed?: string; color?: string; opacity?: number}> = ({
  area,
  count = 26,
  seed = 'dust',
  color = '#ffe6c4',
  opacity = 0.5,
}) => {
  const frame = useCurrentFrame();
  const [x0, y0, x1, y1] = area;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {Array.from({length: count}, (_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const x = x0 + ((r('x') * (x1 - x0) + frame * (0.15 + r('s') * 0.35)) % (x1 - x0));
        const y = y0 + ((r('y') * (y1 - y0) - frame * (0.1 + r('v') * 0.2) + (y1 - y0) * 10) % (y1 - y0));
        return <circle key={i} cx={x} cy={y} r={0.8 + r('r') * 2.2} fill={color} opacity={opacity * (0.3 + 0.7 * Math.abs(Math.sin(frame / 25 + i)))} />;
      })}
    </g>
  );
};

/** Animated film grain. */
export const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.11}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width={1080} height={1920} viewBox="0 0 540 960" preserveAspectRatio="none">
        <filter id={`grain-${seed}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={540} height={960} filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.7, color = '0,0,0'}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 85% 70% at 50% 46%, rgba(${color},0) 50%, rgba(${color},${strength * 0.55}) 82%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/** Gentle colour grade: warm highlights, cool shadows. */
export const Grade: React.FC<{warm?: number; cool?: number}> = ({warm = 0.12, cool = 0.16}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      mixBlendMode: 'soft-light',
      background: `linear-gradient(180deg, rgba(255,170,100,${warm}) 0%, rgba(0,0,0,0) 45%, rgba(40,70,160,${cool}) 100%)`,
    }}
  />
);

/** Warm light leak sweeping across the frame. */
export const LightLeak: React.FC<{progress: number; opacity?: number; color?: string}> = ({progress, opacity = 0.55, color = '255,150,70'}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      mixBlendMode: 'screen',
      opacity,
      background: `radial-gradient(circle at ${-20 + progress * 140}% ${30 + progress * 30}%, rgba(${color},0.9) 0%, rgba(${color},0.35) 22%, rgba(${color},0) 50%)`,
    }}
  />
);

/** Lens flare-ish sun glint. */
export const SunGlint: React.FC<{x: number; y: number; intensity?: number}> = ({x, y, intensity = 1}) => {
  const {width} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: intensity}}>
      <div
        style={{
          position: 'absolute',
          left: x - 420,
          top: y - 420,
          width: 840,
          height: 840,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,226,170,0.85) 0%, rgba(255,170,90,0.35) 18%, rgba(255,140,60,0) 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: y - 2,
          width,
          height: 4,
          background: 'linear-gradient(90deg, rgba(255,190,120,0), rgba(255,210,160,0.55), rgba(255,190,120,0))',
          filter: 'blur(2px)',
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Camera that puts stage point `target` at screen position `screen` with the
 * given zoom (for the depth-1 subject plane).
 */
export const camOn = (target: {x: number; y: number}, zoom: number, screen = {x: 540, y: 960}): Cam => ({
  x: target.x - C.x - (screen.x - C.x) / zoom,
  y: target.y - C.y - (screen.y - C.y) / zoom,
  zoom,
});

export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  zoom: a.zoom + (b.zoom - a.zoom) * t,
  rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * t,
  shake: (a.shake ?? 0) + ((b.shake ?? 0) - (a.shake ?? 0)) * t,
});
