import {Easing, interpolate, random} from 'remotion';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a || 1));

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  camera: Easing.bezier(0.45, 0.05, 0.25, 1),
};

/** Interpolate with clamping and an easing curve. */
export const ramp = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing: (t: number) => number = ease.inOut,
) =>
  interpolate(frame, input, output, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Multi-keyframe interpolation with clamping. */
export const keys = (
  frame: number,
  input: number[],
  output: number[],
  easing: (t: number) => number = ease.inOut,
) =>
  interpolate(frame, input, output, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Smooth deterministic 1D noise (value noise with cosine interpolation), range -1..1. */
export const noise1 = (seed: string | number, t: number) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const u = (1 - Math.cos(f * Math.PI)) / 2;
  return a + (b - a) * u;
};

/** Fade in at the start and out at the end of a span. */
export const fadeInOut = (frame: number, duration: number, inF = 12, outF = 12) =>
  Math.min(ramp(frame, [0, inF], [0, 1]), ramp(frame, [duration - outF, duration], [1, 0]));

export const smoothstep = (a: number, b: number, v: number) => {
  const t = invLerp(a, b, v);
  return t * t * (3 - 2 * t);
};

export const seeded = (seed: string | number) => random(seed);
