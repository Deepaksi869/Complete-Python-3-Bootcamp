/**
 * THE PROTAGONIST
 * ---------------------------------------------------------------
 * One character, built once, reused in every scene of every episode.
 *
 * - Body: a 2D skeletal rig (torso, arms, legs) posed with joint angles.
 * - Head: a pseudo-3D head. The silhouette, hair, beard, ears and facial
 *   features are projected from a simple 3D head shape, so the head can
 *   turn smoothly from profile (headTurn = 0) to facing camera (1).
 * - Look: all colours and proportions come from src/theme/character.ts.
 *
 * Render inside an <svg>. Ground contact (feet) is at (x, y).
 */
import React, {useId} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {characterDesign as D} from '../theme/character';
import {clamp, lerp, noise1, smoothstep} from '../lib/anim';

/* ------------------------------------------------------------------ */
/* Pose & expression types                                             */
/* ------------------------------------------------------------------ */

export type Pose = {
  /** Torso lean in degrees (+ = forward). */
  lean: number;
  /** Hip position relative to the feet anchor. */
  hipX: number;
  hipY: number;
  /** Head pitch in degrees (+ = looking down). */
  headPitch: number;
  /** 0 = profile, 1 = facing camera. */
  headTurn: number;
  /** [upper-arm angle, elbow bend] in degrees. 0 = hanging down, + = forward. */
  armNear: [number, number];
  armFar: [number, number];
  /** [thigh angle, knee bend] in degrees. */
  legNear: [number, number];
  legFar: [number, number];
  /** Foot angle (+ = toe up). */
  footNear: number;
  footFar: number;
};

export type Expression = {
  brow: number; // raise (-1..1)
  furrow: number; // 0..1
  smile: number; // -1..1
  lid: number; // 0..1 upper lid drop
  asym: number; // -1..1 one-sided smile/brow (wry)
};

export const expressions: Record<string, Expression> = {
  neutral: {brow: 0, furrow: 0.05, smile: 0, lid: 0.12, asym: 0},
  hopeful: {brow: 0.55, furrow: 0, smile: 0.55, lid: 0, asym: 0},
  smile: {brow: 0.3, furrow: 0, smile: 0.85, lid: 0.15, asym: 0},
  tired: {brow: -0.15, furrow: 0.45, smile: -0.25, lid: 0.45, asym: 0},
  focused: {brow: -0.3, furrow: 0.55, smile: 0, lid: 0.25, asym: 0},
  determined: {brow: -0.15, furrow: 0.35, smile: 0.2, lid: 0.15, asym: 0},
  wry: {brow: 0.35, furrow: 0.1, smile: 0.35, lid: 0.22, asym: 0.8},
  sad: {brow: 0.15, furrow: 0.6, smile: -0.4, lid: 0.35, asym: 0},
};

export const mixExpression = (a: Expression, b: Expression, t: number): Expression => ({
  brow: lerp(a.brow, b.brow, t),
  furrow: lerp(a.furrow, b.furrow, t),
  smile: lerp(a.smile, b.smile, t),
  lid: lerp(a.lid, b.lid, t),
  asym: lerp(a.asym, b.asym, t),
});

/* ------------------------------------------------------------------ */
/* Pose library                                                        */
/* ------------------------------------------------------------------ */

const base: Pose = {
  lean: 2,
  hipX: 0,
  hipY: D.hipY,
  headPitch: 0,
  headTurn: 0,
  armNear: [4, 10],
  armFar: [-3, 12],
  legNear: [3, 4],
  legFar: [-3, 3],
  footNear: 0,
  footFar: 0,
};

const SEAT = 96;

export const poses = {
  stand: (o: Partial<Pose> = {}): Pose => ({...base, ...o}),

  /** Standing at a window / railing, hands relaxed. */
  standWindow: (o: Partial<Pose> = {}): Pose => ({
    ...base,
    lean: 0,
    headPitch: -3,
    armNear: [-2, 28],
    armFar: [-6, 22],
    legNear: [5, 3],
    legFar: [-4, 2],
    ...o,
  }),

  /** Hands resting on a railing in front of him. */
  leanRailing: (o: Partial<Pose> = {}): Pose => ({
    ...base,
    lean: 6,
    headPitch: -2,
    armNear: [28, 48],
    armFar: [24, 52],
    legNear: [4, 3],
    legFar: [-5, 2],
    ...o,
  }),

  sit: (o: Partial<Pose> = {}): Pose => ({
    ...base,
    lean: 6,
    hipY: -SEAT,
    hipX: 0,
    armNear: [14, 40],
    armFar: [10, 44],
    legNear: [86, 84],
    legFar: [82, 80],
    footNear: 0,
    footFar: 0,
    ...o,
  }),

  /** Sitting, hands on a keyboard. `frame` drives subtle finger/arm motion. */
  sitTyping: (frame: number, intensity = 1, o: Partial<Pose> = {}): Pose => {
    const n1 = noise1('typeN', frame / 2.2) * 3.5 * intensity;
    const n2 = noise1('typeF', frame / 2.0 + 7) * 3.5 * intensity;
    return {
      ...base,
      lean: 13,
      hipY: -SEAT,
      headPitch: 9,
      armNear: [26 + n1 * 0.4, 66 + n1],
      armFar: [22 + n2 * 0.4, 70 + n2],
      legNear: [86, 84],
      legFar: [82, 80],
      footNear: 0,
      footFar: 0,
      ...o,
    };
  },

  /** Sitting, holding a phone up in front of the chest. */
  sitPhone: (o: Partial<Pose> = {}): Pose => ({
    ...poses.sit(),
    lean: 10,
    headPitch: 16,
    armNear: [16, 112],
    armFar: [12, 70],
    ...o,
  }),

  /** Standing, holding the phone up as if recording. */
  standRecord: (o: Partial<Pose> = {}): Pose => ({
    ...base,
    lean: 1,
    headPitch: -2,
    armNear: [62, 58],
    armFar: [-6, 22],
    ...o,
  }),

  /**
   * Walk cycle. `phase` in radians (advance 2π per two steps).
   * Use `walkStride(scale)` to know how far the character travels per cycle.
   */
  walk: (phase: number, o: {energy?: number; carry?: boolean} & Partial<Pose> = {}): Pose => {
    const {energy = 1, carry = false, ...rest} = o;
    const A = 22 * energy;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const sF = Math.sin(phase + Math.PI);
    const cF = Math.cos(phase + Math.PI);
    const knee = (cc: number) => 6 + 40 * Math.pow(Math.max(0, cc), 1.4);
    const foot = (ss: number) => (ss > 0 ? 8 * ss : 22 * ss);
    return {
      ...base,
      lean: 5 * energy,
      hipY: D.hipY + 3.2 * -Math.cos(2 * phase) * energy - 2,
      headPitch: -2 + 1.2 * Math.cos(2 * phase),
      armNear: [-16 * s * energy + 2, 14 + 10 * Math.max(0, -s)],
      armFar: carry ? [-24, 6] : [-16 * sF * energy + 2, 14 + 10 * Math.max(0, -sF)],
      legNear: [A * s, knee(c)],
      legFar: [A * sF, knee(cF)],
      footNear: foot(s),
      footFar: foot(sF),
      ...rest,
    };
  },
};

/** Approximate distance (character units) travelled per walk cycle. */
export const WALK_STRIDE = 2 * 2 * (D.thigh + D.shin) * Math.sin((22 * Math.PI) / 180);

export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const L = (x: number, y: number) => lerp(x, y, t);
  const P = (x: [number, number], y: [number, number]): [number, number] => [L(x[0], y[0]), L(x[1], y[1])];
  return {
    lean: L(a.lean, b.lean),
    hipX: L(a.hipX, b.hipX),
    hipY: L(a.hipY, b.hipY),
    headPitch: L(a.headPitch, b.headPitch),
    headTurn: L(a.headTurn, b.headTurn),
    armNear: P(a.armNear, b.armNear),
    armFar: P(a.armFar, b.armFar),
    legNear: P(a.legNear, b.legNear),
    legFar: P(a.legFar, b.legFar),
    footNear: L(a.footNear, b.footNear),
    footFar: L(a.footFar, b.footFar),
  };
};

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

type V = {x: number; y: number};
const rad = (d: number) => (d * Math.PI) / 180;
/** Direction for an angle measured from "straight down", + rotating toward +x. */
const dirDown = (deg: number): V => ({x: Math.sin(rad(deg)), y: Math.cos(rad(deg))});
const add = (a: V, b: V, k = 1): V => ({x: a.x + b.x * k, y: a.y + b.y * k});
const f1 = (n: number) => n.toFixed(1);

/** Smooth closed/open path through points (Catmull-Rom → cubic Bézier). */
const smoothPath = (pts: V[], closed = true, tension = 0.5): string => {
  if (pts.length < 2) return '';
  const p = pts;
  const n = p.length;
  const get = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(p[0].x)},${f1(p[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const t = tension / 3;
    const c1 = {x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t};
    const c2 = {x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t};
    d += `C${f1(c1.x)},${f1(c1.y)} ${f1(c2.x)},${f1(c2.y)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return closed ? d + 'Z' : d;
};

const circlePath = (c: V, r: number) =>
  `M${f1(c.x - r)},${f1(c.y)}a${r},${r} 0 1,0 ${f1(2 * r)},0a${r},${r} 0 1,0 ${f1(-2 * r)},0Z`;

/** Piecewise-linear lookup table on |t| (degrees). */
const table = (tbl: [number, number][], v: number) => {
  const a = Math.abs(v);
  for (let i = 0; i < tbl.length - 1; i++) {
    if (a <= tbl[i + 1][0]) {
      const [x0, y0] = tbl[i];
      const [x1, y1] = tbl[i + 1];
      return lerp(y0, y1, (a - x0) / (x1 - x0));
    }
  }
  return tbl[tbl.length - 1][1];
};

/* ------------------------------------------------------------------ */
/* Pseudo-3D head                                                      */
/* ------------------------------------------------------------------ */

const bump = (y: number, c: number, w: number) => Math.max(0, 1 - ((y - c) / w) ** 2);

const ring = (y: number) => {
  const HW = D.headHalfWidth;
  const HD = D.headHalfDepth;
  if (y <= 0) {
    const s = Math.sqrt(Math.max(0, 1 - (y / 35) ** 2));
    return {b: HW * s, aF: HD * s, aB: HD * s * 1.04, zc: -1.5};
  }
  const k = y / 30;
  return {
    b: HW * (1 - 0.5 * k * k),
    aF: HD * (1 - 0.22 * k * k),
    aB: y <= 8 ? HD * 1.04 : Math.max(5, HD * 1.04 - (y - 8) * 1.05),
    zc: -1.5 + Math.max(0, y - 14) * 0.25,
  };
};

const protrusion = (t: number, y: number) => {
  const g = (sig: number) => Math.exp(-((t / sig) ** 2));
  const nose = y < -4 || y > 12.5 ? 0 : y <= 9 ? ((y + 4) / 13) * D.noseLength : D.noseLength * (1 - (y - 9) / 3.5);
  return 1.6 * bump(y, -8, 4) * g(45) + nose * g(11) + 2.2 * bump(y, 16, 4) * g(24) + 2 * bump(y, 26, 5) * g(32);
};

type Proj = {x: number; y: number; depth: number; facing: number};

const makeProjector = (phiDeg: number) => {
  const phi = rad(phiDeg);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  return (tDeg: number, y: number, scale = 1, extraZ = 0): Proj => {
    const t = rad(tDeg);
    const r = ring(y);
    const x3 = r.b * Math.sin(t) * scale;
    const a = Math.cos(t) >= 0 ? r.aF : r.aB;
    const z3 = (r.zc + a * Math.cos(t)) * scale + protrusion(tDeg, y) + extraZ;
    return {x: x3 * cp + z3 * sp, y, depth: -x3 * sp + z3 * cp, facing: Math.cos(t + phi)};
  };
};

const T_STEPS: number[] = (() => {
  const s: number[] = [];
  for (let t = -180; t < 180; t += 6) s.push(t);
  for (let t = -14; t <= 14; t += 2) s.push(t);
  return Array.from(new Set(s)).sort((a, b) => a - b);
})();

// Short, natural cut: hairline at the forehead, tidy temples, short sides
// above the ears and a short nape (no long mass at the back).
const hairline: [number, number][] = [
  [0, -23],
  [22, -22.5],
  [42, -19.5],
  [62, -14.5],
  [80, -9.5],
  [96, -7.5],
  [108, -3],
  [122, 5],
  [145, 10.5],
  [180, 12],
];
// Neatly trimmed beard: follows the jaw closely, cheeks stay clear.
const beardTop: [number, number][] = [
  [0, 11.8],
  [14, 13.6],
  [26, 16],
  [45, 16.8],
  [70, 13],
  [88, 6],
  [100, 0],
  [106, -6.5],
];
const beardBottom: [number, number][] = [
  [0, 29.6],
  [30, 28.6],
  [60, 24.6],
  [85, 18.2],
  [100, 11],
  [106, 4],
];

type HeadGeometry = {
  beardHalo: string;
  skin: string;
  hairBack: string;
  hairFront: string[];
  beard: string;
  phi: number;
  proj: ReturnType<typeof makeProjector>;
};

const headGeometry = (turn: number): HeadGeometry => {
  const phi = 90 * (1 - clamp(turn, -0.2, 1));
  const proj = makeProjector(phi);
  const hv = D.hairVolume;

  // Silhouette of the skin head
  const levels: number[] = [];
  for (let y = -34; y <= 30; y += 2) levels.push(y);
  const ext = (y: number, scale: number, extra = 0, filter?: (t: number) => boolean) => {
    let mn = Infinity;
    let mx = -Infinity;
    for (const t of T_STEPS) {
      if (filter && !filter(t)) continue;
      const p = proj(t, y, scale, extra);
      mn = Math.min(mn, p.x);
      mx = Math.max(mx, p.x);
    }
    return {mn, mx};
  };
  const outline = (ys: number[], scale: (y: number) => number, extra: (y: number) => number, top: number) => {
    const right: V[] = [];
    const left: V[] = [];
    for (const y of ys) {
      const e = ext(y, scale(y), extra(y));
      right.push({x: e.mx, y});
      left.push({x: e.mn, y});
    }
    const t0 = ext(ys[0], scale(ys[0]), extra(ys[0]));
    return [{x: (t0.mn + t0.mx) / 2, y: top}, ...right, ...left.reverse()];
  };
  const skinPts = outline(levels, () => 1, () => 0, -35.2);

  // Hair volume: bigger towards the top, swept slightly forward
  const hairScale = (y: number) => 1.035 + hv * 0.04 * smoothstep(-22, -34, y);
  const hairForward = (y: number) => hv * 3.4 * smoothstep(-24, -36, y);

  // Back hair: every point that has hair, drawn behind the face
  const backLevels: number[] = [];
  for (let y = -34; y <= 15; y += 2) backLevels.push(y);
  const backR: V[] = [];
  const backL: V[] = [];
  for (const y of backLevels) {
    let mn = Infinity;
    let mx = -Infinity;
    for (const t of T_STEPS) {
      if (y >= table(hairline, t)) continue;
      const p = proj(t, y, hairScale(y), hairForward(y));
      mn = Math.min(mn, p.x);
      mx = Math.max(mx, p.x);
    }
    if (mn < Infinity) {
      backR.push({x: mx, y});
      backL.push({x: mn, y});
    }
  }
  const topY = -36 - hv * 4;
  const top0 = backR.length ? (backR[0].x + backL[0].x) / 2 : 0;
  const hairBackPts = [{x: top0 + hv * 2, y: topY}, ...backR, ...backL.reverse()];

  // Front hair: for every level, the visible surface that is above the hairline.
  // Hair on each side of the face is traced separately (so temples work in any view).
  const tMin = Math.max(-180, -90 - phi);
  const tMax = Math.min(180, 90 - phi);
  const Tof = (y: number) => {
    for (let a = 0; a <= 180; a += 2) if (table(hairline, a) > y) return a;
    return 181;
  };
  const hairFront: string[] = [];
  for (const side of [-1, 1] as const) {
    const right: V[] = [];
    const left: V[] = [];
    for (let y = -36; y <= 15; y += 1.5) {
      const T = Tof(y);
      const lo = side < 0 ? tMin : Math.max(T, tMin);
      const hi = side < 0 ? Math.min(-T, tMax) : tMax;
      if (hi - lo < 0.5) continue;
      let mn = Infinity;
      let mx = -Infinity;
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        const tt = lo + ((hi - lo) * k) / steps;
        const edge = k === 0 || k === steps;
        const sc = y < -22 ? hairScale(y) : 1.03;
        const p = proj(tt, y, edge && (tt === -T || tt === T) ? 1.02 : sc, y < -22 ? hairForward(y) : 0.3);
        mn = Math.min(mn, p.x);
        mx = Math.max(mx, p.x);
      }
      right.push({x: mx, y});
      left.push({x: mn, y});
    }
    if (right.length > 1) {
      const top = {x: (right[0].x + left[0].x) / 2 + hv * 2.5, y: Math.min(right[0].y - 1.5, topY + 1)};
      hairFront.push(smoothPath([top, ...right, ...left.reverse()], true, 0.45));
    }
  }

  // Textured tufts along the top outline so it clearly reads as hair
  // (breaks the smooth dome silhouette).
  const arcL: V[] = [];
  const arcR: V[] = [];
  for (let y = -24; y >= -36; y -= 1.5) {
    let mn = Infinity;
    let mx = -Infinity;
    for (let t = tMin; t <= tMax; t += 5) {
      const p = proj(t, y, hairScale(y), hairForward(y));
      mn = Math.min(mn, p.x);
      mx = Math.max(mx, p.x);
    }
    arcL.push({x: mn, y});
    arcR.push({x: mx, y});
  }
  const arc = [...arcL, ...[...arcR].reverse()];
  const cx = (arcL[0].x + arcR[0].x) / 2;
  const fwd = Math.sin(rad(phi)); // forward sweep is strongest in profile
  const tufts: string[] = [];
  arc.forEach((p, i) => {
    if (i % 2 === 1 && i !== arc.length - 1) return;
    const r1 = Math.sin(i * 12.9898) * 0.5 + 0.5;
    let nx = p.x - cx;
    let ny = p.y + 12;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const dx = nx * 0.7 + fwd * 0.85;
    const dy = ny * 0.9 - 0.35;
    const dl = Math.hypot(dx, dy) || 1;
    const L = (2.4 + r1 * 2.2) * (0.6 + 0.4 * hv);
    const tip = {x: p.x + (dx / dl) * L, y: p.y + (dy / dl) * L};
    const px = -dy / dl;
    const py = dx / dl;
    const w = 3.8 + r1 * 1.4;
    const b1 = {x: p.x + px * w - (dx / dl) * 2.5, y: p.y + py * w - (dy / dl) * 2.5};
    const b2 = {x: p.x - px * w - (dx / dl) * 2.5, y: p.y - py * w - (dy / dl) * 2.5};
    tufts.push(`M${f1(b1.x)},${f1(b1.y)}Q${f1((b1.x + tip.x) / 2 + px * 0.8)},${f1((b1.y + tip.y) / 2 + py * 0.8)} ${f1(tip.x)},${f1(tip.y)}Q${f1((b2.x + tip.x) / 2)},${f1((b2.y + tip.y) / 2)} ${f1(b2.x)},${f1(b2.y)}Z`);
  });
  // a short fringe flicking up at the front hairline
  for (let k = 0; k < 4; k++) {
    const t = -18 + k * 12;
    const p = proj(t, -23.5 + Math.abs(t) * 0.04, 1.05, 1.5);
    if (p.depth < 2) continue;
    const tip = {x: p.x + 2 + fwd * 3, y: p.y - 3.5 - (k % 2)};
    tufts.push(`M${f1(p.x - 2.8)},${f1(p.y + 1.5)}Q${f1(p.x)},${f1(p.y - 2)} ${f1(tip.x)},${f1(tip.y)}Q${f1(p.x + 1.5)},${f1(p.y)} ${f1(p.x + 2.8)},${f1(p.y + 1.8)}Z`);
  }
  hairFront.push(tufts.join(''));

  // Beard band (only the part facing the camera)
  const bMin = Math.max(-106, tMin);
  const bMax = Math.min(106, tMax);
  const lower: V[] = [];
  const upper: V[] = [];
  const fullness = D.beardFullness;
  for (let t = bMin; t <= bMax; t += 3) {
    const yl = table(beardBottom, t);
    const yu = table(beardTop, t);
    const pl = proj(t, Math.min(30, yl), 1.02 + 0.03 * fullness, 0.8 * fullness);
    lower.push({x: pl.x, y: yl});
    upper.push({x: proj(t, yu, 1.025).x, y: yu});
  }
  const beard = lower.length > 1 ? smoothPath([...lower, ...[...upper].reverse()], true, 0.35) : '';
  const halo = upper.map((p, i) => ({x: p.x, y: p.y - 1.8 + (i === 0 || i === upper.length - 1 ? 1.2 : 0)}));
  const beardHalo = lower.length > 1 ? smoothPath([...lower, ...[...halo].reverse()], true, 0.35) : '';

  return {
    beardHalo,
    skin: smoothPath(skinPts, true, 0.5),
    hairBack: smoothPath(hairBackPts, true, 0.5),
    hairFront,
    beard,
    phi,
    proj,
  };
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Light = {color: string; strength: number; from?: 'front' | 'back' | 'top'};

export type CharacterProps = {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  pose: Pose;
  expression?: Expression | keyof typeof expressions;
  /** Iris offset, -1..1 (x relative to facing direction). */
  lookX?: number;
  lookY?: number;
  /** 0..1 breathing amplitude. */
  breathe?: number;
  /** 0..1 idle head micro-movement. */
  idle?: number;
  holding?: 'none' | 'phone' | 'suitcase';
  phoneGlow?: number;
  /** Phone screen content shows a recording indicator. */
  phoneRecording?: boolean;
  /** 0..1 darken towards `shadeColor` (night scenes). */
  shade?: number;
  shadeColor?: string;
  /** Key light (e.g. laptop glow on the face). */
  light?: Light;
  /** Rim / back light. */
  rim?: Light;
  groundShadow?: number;
  seed?: string;
};

type Part = {d: string; fill?: string; stroke?: string; sw?: number; overlay?: boolean};

export const Character: React.FC<CharacterProps> = ({
  x,
  y,
  scale = 1,
  facing = 1,
  pose: inPose,
  expression = 'neutral',
  lookX = 0.3,
  lookY = 0,
  breathe = 1,
  idle = 1,
  holding = 'none',
  phoneGlow = 0,
  phoneRecording = false,
  shade = 0,
  shadeColor = '#0a1430',
  light,
  rim,
  groundShadow = 0.35,
  seed = 'hero',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const uid = useId().replace(/:/g, '');
  const t = frame / fps;

  const expr: Expression = typeof expression === 'string' ? expressions[expression] ?? expressions.neutral : expression;

  // Breathing + idle micro-motion
  const breath = Math.sin((t / 3.9) * Math.PI * 2) * breathe;
  const pose: Pose = {
    ...inPose,
    headPitch: inPose.headPitch + noise1(seed + 'hp', t * 0.55) * 1.6 * idle + breath * 0.6,
    headTurn: inPose.headTurn + noise1(seed + 'ht', t * 0.4) * 0.025 * idle,
    lean: inPose.lean + breath * 0.5,
  };

  // Blink every ~3-5 s
  const blinkPeriod = 3.6 + noise1(seed + 'bp', 0) * 0.8;
  const bPhase = (t + 1.3) % blinkPeriod;
  const blink = bPhase < 0.14 ? Math.sin((bPhase / 0.14) * Math.PI) : 0;

  /* ---------- skeleton ---------- */
  const hip: V = {x: pose.hipX, y: pose.hipY};
  const up: V = {x: Math.sin(rad(pose.lean)), y: -Math.cos(rad(pose.lean))};
  const fw: V = {x: Math.cos(rad(pose.lean)), y: Math.sin(rad(pose.lean))};
  const L = (fx: number, uy: number): V => ({x: hip.x + fw.x * fx + up.x * uy, y: hip.y + fw.y * fx + up.y * uy});
  const breathLift = breath * 1.1;
  const shoulder = L(-2, D.torsoLength - 12 + breathLift);
  const neckBase = L(3, D.torsoLength - 4 + breathLift);

  const armChain = (a: [number, number]) => {
    const elbow = add(shoulder, dirDown(a[0]), D.upperArm);
    const wrist = add(elbow, dirDown(a[0] + a[1]), D.forearm);
    const hand = add(wrist, dirDown(a[0] + a[1]), 7);
    return {elbow, wrist, hand, foreAngle: a[0] + a[1]};
  };
  const legChain = (a: [number, number], footA: number) => {
    const hipJ = L(a === pose.legNear ? 3 : -3, -2);
    const knee = add(hipJ, dirDown(a[0]), D.thigh);
    const ankle = add(knee, dirDown(a[0] - a[1]), D.shin);
    return {hipJ, knee, ankle, footA};
  };
  const armN = armChain(pose.armNear);
  const armF = armChain(pose.armFar);
  const legN = legChain(pose.legNear, pose.footNear);
  const legF = legChain(pose.legFar, pose.footFar);


  /* ---------- parts ---------- */
  const seg = (pts: V[]) => `M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}`;

  const shoe = (ankle: V, a: number): string => {
    const r = rad(-a);
    const R = (px: number, py: number): V => ({
      x: ankle.x + px * Math.cos(r) - py * Math.sin(r),
      y: ankle.y + px * Math.sin(r) + py * Math.cos(r),
    });
    return smoothPath([R(-9, -6), R(4, -8), R(18, -4), R(33, 1), R(36, 7), R(30, 10), R(-6, 10), R(-11, 4)], true, 0.45);
  };
  const sole = (ankle: V, a: number): string => {
    const r = rad(-a);
    const R = (px: number, py: number): V => ({
      x: ankle.x + px * Math.cos(r) - py * Math.sin(r),
      y: ankle.y + px * Math.sin(r) + py * Math.cos(r),
    });
    return seg([R(-10, 9), R(35, 9)]);
  };

  const legParts = (leg: ReturnType<typeof legChain>, far: boolean): Part[] => {
    const jeans = far ? D.jeansShadow : D.jeans;
    return [
      {d: seg([leg.hipJ, leg.knee]), stroke: jeans, sw: 31},
      {d: seg([leg.knee, add(leg.ankle, {x: 0, y: -4})]), stroke: jeans, sw: 26},
      {d: shoe(leg.ankle, leg.footA), fill: far ? '#c9c2b5' : D.shoes},
      {d: sole(leg.ankle, leg.footA), stroke: D.soles, sw: 3.2},
    ];
  };

  const handPath = (arm: ReturnType<typeof armChain>) => {
    const c = arm.hand;
    const d = dirDown(arm.foreAngle);
    const n = {x: -d.y, y: d.x};
    return (
      circlePath(c, 8.2) +
      ' ' +
      smoothPath(
        [add(add(c, d, -3), n, 6), add(add(c, d, 3), n, 10.5), add(add(c, d, 7), n, 8), add(add(c, d, 2), n, 4)],
        true,
        0.4,
      )
    );
  };

  const armParts = (arm: ReturnType<typeof armChain>, far: boolean): Part[] => {
    const shirt = far ? D.overshirtShadow : D.overshirt;
    const cuff = add(arm.wrist, dirDown(arm.foreAngle), -6);
    return [
      {d: seg([shoulder, arm.elbow]), stroke: shirt, sw: 25},
      {d: seg([arm.elbow, cuff]), stroke: shirt, sw: 21},
      {d: seg([cuff, add(cuff, dirDown(arm.foreAngle), 3)]), stroke: far ? '#8b785a' : D.overshirtShadow, sw: 22, overlay: false},
      {d: seg([add(cuff, dirDown(arm.foreAngle), 2), arm.wrist]), stroke: far ? D.skinShadow : D.skin, sw: 13},
      {d: handPath(arm), fill: far ? D.skinShadow : D.skin},
    ];
  };

  const torsoPts = (pts: [number, number][]) => pts.map(([a, b]) => L(a, b + (b > 60 ? breathLift : 0)));
  const teePath = smoothPath(
    torsoPts([
      [-20, -6],
      [-22, 40],
      [-20, 82],
      [-14, 104],
      [0, 111],
      [13, 106],
      [21, 88],
      [21, 54],
      [18, 14],
      [16, -6],
    ]),
    true,
    0.4,
  );
  const shirtPath = smoothPath(
    torsoPts([
      [-25, -20],
      [-26, 40],
      [-24, 84],
      [-17, 106],
      [-2, 114],
      [10, 110],
      [14, 96],
      [12, 64],
      [10, 24],
      [13, -18],
      [-6, -22],
    ]),
    true,
    0.35,
  );
  const collarPath = smoothPath(
    torsoPts([
      [-8, 108],
      [2, 117],
      [12, 112],
      [9, 100],
      [3, 107],
    ]),
    true,
    0.3,
  );
  const seamPath = seg(torsoPts([
    [-20, 60],
    [-21, 20],
  ]));
  const pelvisPath = smoothPath(
    torsoPts([
      [-20, 6],
      [-18, -16],
      [0, -22],
      [18, -14],
      [19, 6],
    ]),
    true,
    0.5,
  );
  const neckPath = smoothPath(
    [L(-5, 100), L(-5, 124), L(9, 128), L(12, 104)].map((p) => add(p, {x: 0, y: -breathLift})),
    true,
    0.4,
  );

  /* ---------- head ---------- */
  const geo = headGeometry(pose.headTurn);
  const {proj, phi} = geo;
  const headPivot = add(neckBase, {x: 0, y: -14});
  const headAngle = pose.lean * 0.6 + pose.headPitch;
  const HS = D.headScale;
  const headTransform = `translate(${f1(headPivot.x)},${f1(headPivot.y)}) rotate(${f1(headAngle)}) translate(4,-26) scale(${HS})`;

  // Ears
  const ear = (side: -1 | 1) => {
    const p = proj(side * 93, 1, 1.0);
    const vis = p.facing;
    const w = 4 + 3.2 * Math.max(0, Math.abs(Math.sin(rad(side * 93 + phi))));
    return {p, vis, w, front: p.depth > 0};
  };
  const ears = [ear(-1), ear(1)];
  const earPath = (e: ReturnType<typeof ear>) =>
    smoothPath(
      [
        {x: e.p.x - e.w * 0.4, y: -6},
        {x: e.p.x + e.w * 0.6, y: -5},
        {x: e.p.x + e.w * 0.7, y: 4},
        {x: e.p.x + e.w * 0.1, y: 9},
        {x: e.p.x - e.w * 0.5, y: 4},
      ],
      true,
      0.5,
    );

  // Eyes
  const lookShift = lookX * 1.6;
  const eye = (side: -1 | 1) => {
    const tt = side * 31;
    const p = proj(tt, -1, 1, -1.2);
    const v = p.facing;
    return {p, v, tt};
  };
  const eyes = [eye(-1), eye(1)];
  const asym = (side: number) => (side < 0 ? 1 : -1) * expr.asym;

  const brow = (side: -1 | 1) => {
    const raise = expr.brow + asym(side) * 0.35;
    const yBase = -8.2 - raise * 2.4;
    const inner = proj(side * 14, yBase + expr.furrow * 2.2, 1, 0.8);
    const mid = proj(side * 30, yBase - 1.1, 1, 0.9);
    const outer = proj(side * 46, yBase + 0.8, 1, 0.2);
    return {inner, mid, outer, v: mid.facing};
  };
  const brows = [brow(-1), brow(1)];

  // Mouth
  const smile = expr.smile;
  const mouthPts = [-11, -5, 0, 5, 11].map((tt) => {
    const side = tt === 0 ? 0 : Math.sign(tt);
    const s = smile + (side !== 0 ? asym(side) * 0.45 : 0);
    const yy = 17.6 - (Math.abs(tt) > 6 ? s * 1.8 : -s * 0.5);
    return proj(tt, yy, 1, 0.3);
  });
  const mouthVisible = mouthPts.filter((p) => p.facing > 0.05);

  // Head-local gradient direction for lighting (+x = facing side)
  const lid = clamp(expr.lid + blink, 0, 1);

  /* ---------- props ---------- */
  const phone = holding === 'phone' ? armN : null;
  const phoneAngle = phone ? phone.foreAngle - 90 : 0;

  const suitcase = holding === 'suitcase' ? armF : null;
  const caseW = 58;
  const caseH = 92;
  const caseTilt = 18;
  const wheel: V | null = suitcase ? {x: suitcase.hand.x - 70, y: -6} : null;

  /* ---------- assemble ---------- */
  const farParts: Part[] = [...armParts(armF, true), ...legParts(legF, true)];
  const bodyParts: Part[] = [
    ...legParts(legN, false),
    {d: pelvisPath, fill: D.jeans},
    {d: neckPath, fill: D.skinShadow},
    {d: teePath, fill: D.tee},
    {d: shirtPath, fill: D.overshirt},
    {d: collarPath, fill: D.overshirtShadow},
    {d: seamPath, stroke: D.overshirtShadow, sw: 1.6, overlay: false},
  ];
  const nearParts: Part[] = armParts(armN, false);

  const lightGrad = (id: string, from: Light['from'], color: string, sharp: boolean) => {
    const dir = from === 'back' ? -1 : 1;
    const vertical = from === 'top';
    return (
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1={vertical ? 0 : dir * (sharp ? 30 : 34)}
        y1={vertical ? -380 : -200}
        x2={vertical ? 0 : dir * (sharp ? 14 : -14)}
        y2={vertical ? -150 : -200}
      >
        <stop offset="0" stopColor={color} stopOpacity={1} />
        <stop offset={sharp ? '0.4' : '0.35'} stopColor={color} stopOpacity={sharp ? 0.75 : 0.55} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    );
  };

  const renderParts = (parts: Part[], override?: string) =>
    parts
      .filter((p) => !override || p.overlay !== false)
      .map((p, i) =>
        p.stroke ? (
          <path key={i} d={p.d} fill="none" stroke={override ?? p.stroke} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path key={i} d={p.d} fill={override ?? p.fill} />
        ),
      );

  const skinGradId = `skin-${uid}`;
  const headSilhouettes = (
    <g transform={headTransform}>
      <path d={geo.hairBack} />
      <path d={geo.skin} />
      {geo.hairFront.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {geo.beard && <path d={geo.beard} />}
    </g>
  );

  const silhouette = (fill: string) => (
    <g fill={fill}>
      {renderParts([...farParts, ...bodyParts, ...nearParts], fill)}
      {headSilhouettes}
    </g>
  );

  const head = (
    <g transform={headTransform}>
      <defs>
        <linearGradient id={skinGradId} gradientUnits="userSpaceOnUse" x1={-30} y1={0} x2={34} y2={0}>
          <stop offset="0" stopColor={D.skinShadow} />
          <stop offset="0.55" stopColor={D.skin} />
          <stop offset="1" stopColor={D.skinHighlight} />
        </linearGradient>
      </defs>
      {/* far ear (behind) */}
      {ears.filter((e) => !e.front).map((e, i) => (
        <path key={i} d={earPath(e)} fill={D.skinShadow} />
      ))}
      <path d={geo.hairBack} fill={D.hair} />
      <path d={geo.skin} fill={`url(#${skinGradId})`} />
      {/* eye sockets: soft shade */}
      {eyes.map((e, i) =>
        e.v > 0.05 ? (
          <ellipse key={`s${i}`} cx={e.p.x} cy={-2} rx={6.5 * (0.4 + 0.6 * e.v)} ry={4.6} fill={D.skinShadow} opacity={0.35} />
        ) : null,
      )}
      {/* eyes */}
      {eyes.map((e, i) => {
        if (e.v <= 0.04) return null;
        const k = 0.35 + 0.65 * e.v;
        const rx = 4.3 * k;
        const ry = 2.7 * (1 - lid * 0.75);
        const ix = e.p.x + lookShift * (0.6 + 0.4 * (1 - e.v)) + (1 - e.v) * 1.2;
        const iy = -1 + lookY * 1.2 + lid * 0.4;
        const clip = `eye-${uid}-${i}`;
        return (
          <g key={i} opacity={clamp(e.v * 4)}>
            <defs>
              <clipPath id={clip}>
                <ellipse cx={e.p.x} cy={-1} rx={rx} ry={Math.max(0.2, ry)} />
              </clipPath>
            </defs>
            <ellipse cx={e.p.x} cy={-1} rx={rx} ry={Math.max(0.2, ry)} fill={D.sclera} />
            <g clipPath={`url(#${clip})`}>
              <circle cx={ix} cy={iy} r={2.4} fill={D.eyes} />
              <circle cx={ix + 0.7} cy={iy - 0.8} r={0.7} fill="#fff" opacity={0.85} />
              {/* upper lid shadow */}
              <rect x={e.p.x - rx - 1} y={-1 - ry - 2} width={rx * 2 + 2} height={2 + ry * (0.25 + lid * 0.6)} fill={D.skinShadow} opacity={0.7} />
            </g>
            {/* lash line */}
            <path
              d={`M${f1(e.p.x - rx)},${f1(-1)} Q${f1(e.p.x)},${f1(-1 - ry * 1.5)} ${f1(e.p.x + rx)},${f1(-1)}`}
              stroke={D.eyes}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {/* nose: nostril wing + under-shadow */}
      {(() => {
        const tip = proj(0, 9.5);
        const wingSide = phi > 0 ? -1 : 1;
        const wing = proj(wingSide * 12, 10.5, 1, 1);
        const bridge = proj(wingSide * 8, 1, 1, 1);
        return (
          <g>
            <path
              d={`M${f1(bridge.x)},1 Q${f1(lerp(bridge.x, wing.x, 0.4) + (tip.x - wing.x) * 0.15)},7 ${f1(wing.x)},10.5`}
              stroke={D.skinShadow}
              strokeWidth={1.3}
              fill="none"
              opacity={0.55 * clamp((1 - Math.abs(phi) / 90) * 2.2)}
              strokeLinecap="round"
            />
            <path
              d={`M${f1(wing.x)},10.6 Q${f1((wing.x + tip.x) / 2)},12.4 ${f1(tip.x)},11.2`}
              stroke={D.skinShadow}
              strokeWidth={1.6}
              fill="none"
              opacity={0.75}
              strokeLinecap="round"
            />
          </g>
        );
      })()}
      {/* brows */}
      {brows.map((b, i) =>
        b.v > -0.1 ? (
          <path
            key={i}
            d={smoothPath(
              [
                {x: b.inner.x, y: b.inner.y},
                {x: b.mid.x, y: b.mid.y},
                {x: b.outer.x, y: b.outer.y},
              ],
              false,
              0.5,
            )}
            stroke={D.brows}
            strokeWidth={3.4}
            fill="none"
            strokeLinecap="round"
            opacity={clamp((b.v + 0.1) * 4)}
          />
        ) : null,
      )}
      {/* beard + moustache */}
      {geo.beardHalo && <path d={geo.beardHalo} fill={D.beard} opacity={0.32} />}
      {geo.beard && <path d={geo.beard} fill={D.beard} />}
      {/* mouth */}
      {mouthVisible.length >= 2 && (
        <>
          <path
            d={smoothPath(mouthVisible.map((p) => ({x: p.x, y: p.y})), false, 0.5)}
            stroke="#2a1a14"
            strokeWidth={1.9}
            fill="none"
            strokeLinecap="round"
          />
          {(() => {
            const lip = [-5, 0, 5].map((tt) => proj(tt, 19.6, 1, 0.4)).filter((p) => p.facing > 0.1);
            return lip.length >= 2 ? (
              <path d={smoothPath(lip, false)} stroke={D.lips} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.85} />
            ) : null;
          })()}
        </>
      )}
      {/* front hair */}
      {geo.hairFront.map((d, i) => (
        <path key={i} d={d} fill={D.hair} />
      ))}
      {/* near ear */}
      {ears.filter((e) => e.front).map((e, i) => (
        <g key={i}>
          <path d={earPath(e)} fill={D.skin} />
          <path
            d={`M${f1(e.p.x + e.w * 0.25)},-3 Q${f1(e.p.x + e.w * 0.45)},2 ${f1(e.p.x)},5`}
            stroke={D.skinShadow}
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* hair texture: short strand highlights on the visible top */}
      {[-30, -18, -6, 6, 18].map((tt, i) => {
        const t = tt - phi * 0.6;
        const a = proj(t, -27 - (i % 2) * 2, 1.08, 2);
        const b = proj(t + 6, -32 - (i % 2) * 2, 1.1, 3);
        if (a.depth < 4 || b.depth < 4) return null;
        return (
          <path
            key={i}
            d={`M${f1(a.x)},${f1(-27 - (i % 2) * 2)}L${f1(b.x + Math.sin(rad(phi)) * 2)},${f1(-32 - (i % 2) * 2)}`}
            stroke={D.hairHighlight}
            strokeWidth={1.3}
            opacity={0.7}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );

  const lightId = `light-${uid}`;
  const rimId = `rim-${uid}`;

  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${facing * scale},${scale})`}>
      <defs>
        {light && lightGrad(lightId, light.from ?? 'front', light.color, false)}
        {rim && lightGrad(rimId, rim.from ?? 'back', rim.color, true)}
      </defs>
      {groundShadow > 0 && (
        <ellipse cx={hip.x + 6} cy={2} rx={pose.hipY > -120 ? 70 : 52} ry={7} fill="#000" opacity={groundShadow} />
      )}

      {/* Suitcase (behind) */}
      {suitcase && wheel && (
        <g>
          <g transform={`translate(${f1(wheel.x)},${f1(wheel.y)}) rotate(${caseTilt})`}>
            <rect x={-caseW / 2} y={-caseH} width={caseW} height={caseH} rx={9} fill="#3d4a66" />
            <rect x={-caseW / 2 + 6} y={-caseH + 8} width={caseW - 12} height={caseH - 16} rx={5} fill="none" stroke="#2b3650" strokeWidth={3} />
            {[-14, 0, 14].map((k) => (
              <line key={k} x1={k} y1={-caseH + 10} x2={k} y2={-10} stroke="#33405c" strokeWidth={3} />
            ))}
            <rect x={-caseW / 2} y={-caseH} width={caseW} height={14} rx={7} fill="#56648a" opacity={0.6} />
            <circle cx={-caseW / 2 + 8} cy={2} r={6} fill="#111" />
            <circle cx={caseW / 2 - 8} cy={2} r={6} fill="#111" />
          </g>
          {(() => {
            const r = rad(caseTilt);
            const top = {x: wheel.x + Math.sin(r) * caseH, y: wheel.y - Math.cos(r) * caseH};
            return (
              <path
                d={`M${f1(top.x)},${f1(top.y)}L${f1(suitcase.hand.x)},${f1(suitcase.hand.y)}`}
                stroke="#9aa3b5"
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })()}
        </g>
      )}

      {renderParts(farParts)}
      {renderParts(bodyParts)}
      {head}
      {renderParts(nearParts)}

      {/* Phone in the near hand */}
      {phone && (
        <g transform={`translate(${f1(phone.hand.x)},${f1(phone.hand.y)}) rotate(${f1(phoneAngle)})`}>
          <rect x={-9} y={-28} width={18} height={34} rx={3.5} fill="#11151f" />
          <rect x={-7.5} y={-26.5} width={15} height={31} rx={2.5} fill={phoneGlow > 0 ? '#9ec4ff' : '#1a2233'} opacity={0.4 + phoneGlow * 0.6} />
          {phoneRecording && <circle cx={0} cy={-20} r={2.6} fill="#ff4a3d" opacity={0.5 + 0.5 * Math.round((Math.sin(t * 6) + 1) / 2)} />}
          <circle cx={0} cy={-2} r={8.2} fill={D.skin} />
        </g>
      )}

      {/* Shade pass: darken the whole figure uniformly (night scenes) */}
      {shade > 0 && <g opacity={clamp(shade)}>{silhouette(shadeColor)}</g>}
      {/* Key light pass */}
      {light && light.strength > 0 && (
        <g opacity={clamp(light.strength)} style={{mixBlendMode: 'screen'}}>
          {silhouette(`url(#${lightId})`)}
        </g>
      )}
      {/* Rim light pass */}
      {rim && rim.strength > 0 && (
        <g opacity={clamp(rim.strength)} style={{mixBlendMode: 'screen'}}>
          {silhouette(`url(#${rimId})`)}
        </g>
      )}
      {/* Phone glow on top of the shading so the screen stays bright */}
      {phone && phoneGlow > 0 && (
        <g transform={`translate(${f1(phone.hand.x)},${f1(phone.hand.y)}) rotate(${f1(phoneAngle)})`}>
          <rect x={-7.5} y={-26.5} width={15} height={31} rx={2.5} fill="#b9d4ff" opacity={phoneGlow * 0.7} />
          {phoneRecording && <circle cx={0} cy={-20} r={2.6} fill="#ff4a3d" />}
        </g>
      )}
    </g>
  );
};
