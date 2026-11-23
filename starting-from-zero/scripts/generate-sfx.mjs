#!/usr/bin/env node
/**
 * PROCEDURAL SOUND DESIGN
 * Synthesises every sound effect used by the series from code (noise,
 * oscillators, filters and reverb). Nothing is downloaded, so there are no
 * licensing issues. Output: public/audio/sound-effects/*.wav (48 kHz stereo).
 *
 * Usage: node scripts/generate-sfx.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/audio/sound-effects');
const SR = 48000;
const force = process.argv.includes('--force');
const VERSION = '3';

/* ---------------- DSP toolkit ---------------- */

const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const white = (n, r) => {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = r() * 2 - 1;
  return b;
};
const pink = (n, r) => {
  const b = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    b[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return b;
};
const brown = (n, r) => {
  const b = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    last = (last + 0.02 * (r() * 2 - 1)) / 1.02;
    b[i] = last * 3.5;
  }
  return b;
};

/** RBJ biquad. freq may be a number or a function of sample index. */
const biquad = (x, type, freq, q = 0.707) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0, b1, b2, a1, a2;
  const coef = (f) => {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    let B0, B1, B2;
    const A0 = 1 + al;
    if (type === 'lp') [B0, B1, B2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (type === 'hp') [B0, B1, B2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [B0, B1, B2] = [al, 0, -al]; // band-pass
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = (-2 * cs) / A0; a2 = (1 - al) / A0;
  };
  const dyn = typeof freq === 'function';
  if (!dyn) coef(freq);
  for (let i = 0; i < x.length; i++) {
    if (dyn && i % 32 === 0) coef(freq(i));
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};

const mix = (target, src, at = 0, gain = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < target.length; i++) if (o + i >= 0) target[o + i] += src[i] * gain;
  return target;
};
const env = (n, fn) => {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = fn(i / SR, i);
  return b;
};
const mul = (a, b) => a.map((v, i) => v * (typeof b === 'function' ? b(i / SR, i) : b[i]));
const sine = (sec, f, phase = 0) => env(Math.round(sec * SR), (t) => Math.sin(2 * Math.PI * (typeof f === 'function' ? f(t) : f) * t + phase));
/** Oscillator with a time-varying frequency (proper phase accumulation). */
const osc = (sec, freqFn, shape = 'sine') => {
  const n = Math.round(sec * SR);
  const b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    ph += freqFn(i / SR) / SR;
    const p = ph % 1;
    b[i] = shape === 'sine' ? Math.sin(2 * Math.PI * p) : shape === 'saw' ? 2 * p - 1 : shape === 'tri' ? 1 - 4 * Math.abs(p - 0.5) : p < 0.5 ? 1 : -1;
  }
  return b;
};
const expDecay = (k) => (t) => Math.exp(-t * k);
const adsr = (a, d, s, r, total) => (t) => {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < total - r) return s;
  return Math.max(0, s * (1 - (t - (total - r)) / r));
};

/** Small stereo Schroeder reverb. Returns [L, R]. */
const reverb = (x, {room = 0.82, damp = 0.35, wet = 0.35, tail = 2}) => {
  const n = x.length + Math.round(tail * SR);
  const input = new Float32Array(n);
  input.set(x);
  const run = (delays, ap) => {
    const out = new Float32Array(n);
    for (const d of delays) {
      const line = new Float32Array(d);
      let idx = 0, lp = 0;
      for (let i = 0; i < n; i++) {
        const y = line[idx];
        lp = y * (1 - damp) + lp * damp;
        line[idx] = input[i] + lp * room;
        out[i] += y;
        idx = (idx + 1) % d;
      }
    }
    for (const d of ap) {
      const line = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < n; i++) {
        const b = line[idx];
        const y = -out[i] + b;
        line[idx] = out[i] + b * 0.5;
        out[i] = y;
        idx = (idx + 1) % d;
      }
    }
    return out.map((v, i) => (i < x.length ? x[i] : 0) * (1 - wet) + (v / delays.length) * wet * 3);
  };
  return [run([1557, 1617, 1491, 1422, 1277, 1356], [225, 556]), run([1580, 1640, 1514, 1445, 1300, 1379], [248, 579])];
};

const normalize = (chs, peak) => {
  let m = 0;
  for (const c of chs) for (const v of c) m = Math.max(m, Math.abs(v));
  const g = m > 0 ? peak / m : 1;
  return chs.map((c) => c.map((v) => v * g));
};
const fadeEdges = (chs, inSec = 0.005, outSec = 0.02) =>
  chs.map((c) => {
    const n = c.length;
    const fi = Math.round(inSec * SR);
    const fo = Math.round(outSec * SR);
    return c.map((v, i) => v * Math.min(1, fi ? i / fi : 1, fo ? (n - 1 - i) / fo : 1));
  });
/** Make a buffer loop seamlessly by crossfading its tail into its head. */
const loopify = (chs, xf = 1.0) =>
  chs.map((c) => {
    const k = Math.round(xf * SR);
    const n = c.length - k;
    const o = new Float32Array(n);
    for (let i = 0; i < n; i++) o[i] = c[i];
    for (let i = 0; i < k; i++) {
      const t = i / k;
      o[i] = c[i] * Math.sqrt(t) + c[n + i] * Math.sqrt(1 - t);
    }
    return o;
  });
const stereo = (mono, width = 0, r) => {
  if (!width) return [mono, mono.slice()];
  const d = Math.round(0.011 * SR);
  const R = new Float32Array(mono.length);
  for (let i = 0; i < mono.length; i++) R[i] = mono[i] * (1 - width) + (i >= d ? mono[i - d] : 0) * width;
  return [mono, R];
};

const writeWav = (file, chs) => {
  const n = chs[0].length;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const v = Math.max(-1, Math.min(1, chs[c][i] || 0));
      data.writeInt16LE(Math.round(v * 32767), i * 4 + c * 2);
    }
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
};

/* ---------------- Sound recipes ---------------- */

const recipes = {
  'room-tone': () => {
    const r = rng(1);
    const sec = 13;
    const n = sec * SR;
    const low = biquad(brown(n, r), 'lp', 180);
    const hvac = mul(biquad(pink(n, r), 'bp', 420, 0.6), (t) => 0.25 + 0.05 * Math.sin(t * 0.7));
    const hum = sine(sec, 100).map((v, i) => v * 0.04 + Math.sin((2 * Math.PI * 150 * i) / SR) * 0.015);
    const m = low.map((v, i) => v * 0.9 + hvac[i] * 0.5 + hum[i]);
    return normalize(loopify(stereo(m, 0.4)), 0.32);
  },

  'city-night': () => {
    const r = rng(2);
    const sec = 14;
    const n = sec * SR;
    const base = mul(biquad(brown(n, r), 'lp', 320), (t) => 0.6 + 0.25 * Math.sin(t * 0.45) + 0.15 * Math.sin(t * 1.3));
    const m = new Float32Array(n);
    mix(m, base, 0, 1);
    // distant car passes
    for (const [at, dur] of [[1.5, 4], [6.5, 5], [10.2, 3.5]]) {
      const car = mul(biquad(pink(Math.round(dur * SR), r), 'bp', (i) => 300 + 500 * Math.sin((Math.PI * i) / (dur * SR)), 0.8), (t) => Math.sin((Math.PI * t) / dur) ** 2);
      mix(m, car, at, 0.35);
    }
    return normalize(loopify(stereo(m, 0.6)), 0.3);
  },

  typing: () => {
    const r = rng(3);
    const sec = 7;
    const m = new Float32Array(sec * SR);
    let t = 0.05;
    while (t < sec - 0.3) {
      const space = r() < 0.12;
      const len = Math.round(0.05 * SR);
      const click = mul(biquad(white(len, r), 'hp', 1800 + r() * 1500), expDecay(space ? 120 : 220));
      const body = mul(biquad(white(len, r), 'lp', space ? 300 : 600), expDecay(70));
      const k = click.map((v, i) => v * 0.6 + body[i] * (space ? 1.2 : 0.6));
      mix(m, k, t, 0.5 + r() * 0.5);
      t += r() < 0.08 ? 0.35 + r() * 0.4 : 0.07 + r() * 0.12;
    }
    const [L, R] = reverb(m, {room: 0.5, wet: 0.12, tail: 0.3});
    return normalize(loopify([L.slice(0, m.length), R.slice(0, m.length)], 0.3), 0.6);
  },

  notification: () => {
    const sec = 1.6;
    const m = new Float32Array(sec * SR);
    const bell = (f, d) => sine(d, f).map((v, i) => (v + 0.3 * Math.sin((2 * Math.PI * f * 2.01 * i) / SR)) * Math.exp((-i / SR) * 6));
    mix(m, bell(1046.5, 1.2), 0.0, 0.6);
    mix(m, bell(1568, 1.2), 0.11, 0.5);
    return normalize(fadeEdges(reverb(m, {room: 0.78, wet: 0.3, tail: 0.6})), 0.5);
  },

  send: () => {
    const r = rng(5);
    const sec = 0.9;
    const n = sec * SR;
    const sw = mul(biquad(white(n, r), 'bp', (i) => 400 + 3200 * (i / n) ** 1.4, 2), (t) => Math.sin((Math.PI * t) / sec) ** 2);
    return normalize(fadeEdges(reverb(sw, {room: 0.6, wet: 0.2, tail: 0.3})), 0.45);
  },

  airport: () => {
    const r = rng(6);
    const sec = 14;
    const n = sec * SR;
    const m = new Float32Array(n);
    // crowd murmur: many formant-like voices with syllable rhythm
    for (let v = 0; v < 22; v++) {
      const f = 250 + r() * 900;
      const rate = 3 + r() * 3;
      const ph = r() * 10;
      const voice = mul(biquad(pink(n, r), 'bp', f, 3), (t) => Math.max(0, Math.sin(2 * Math.PI * rate * t + ph)) ** 2 * (0.5 + 0.5 * Math.sin(t * (0.3 + r() * 0.3) + ph)));
      mix(m, voice, 0, 0.5);
    }
    mix(m, biquad(brown(n, r), 'lp', 160), 0, 0.8);
    // soft PA chime
    const chime = (f) => sine(1.5, f).map((x, i) => x * Math.exp((-i / SR) * 3));
    mix(m, chime(659.3), 4, 0.25);
    mix(m, chime(523.3), 4.45, 0.25);
    mix(m, chime(392), 4.9, 0.25);
    const [L, R] = reverb(m, {room: 0.88, wet: 0.45, tail: 1});
    return normalize(loopify([L.slice(0, n), R.slice(0, n)], 1.2), 0.4);
  },

  'suitcase-roll': () => {
    const r = rng(7);
    const sec = 5;
    const n = sec * SR;
    const m = mul(biquad(brown(n, r), 'lp', 700), (t) => 0.7 + 0.3 * Math.sin(t * 40));
    for (let t = 0.1; t < sec; t += 0.42) {
      mix(m, mul(biquad(white(Math.round(0.04 * SR), r), 'lp', 900), expDecay(90)), t, 0.8);
    }
    return normalize(loopify(stereo(m, 0.2), 0.3), 0.45);
  },

  rewind: () => {
    const r = rng(8);
    const sec = 3.2;
    const n = sec * SR;
    const m = new Float32Array(n);
    // whirring motor with warble
    const motor = osc(sec, (t) => 520 + 900 * Math.min(1, t / 0.4) + 60 * Math.sin(2 * Math.PI * 13 * t), 'saw');
    mix(m, biquad(motor, 'lp', 2400).map((v, i) => v * Math.min(1, i / (0.15 * SR)) * Math.min(1, (n - i) / (0.4 * SR))), 0, 0.25);
    // reversed-speech-like chirps
    for (let t = 0.05; t < sec - 0.3; t += 0.03 + r() * 0.04) {
      const f0 = 600 + r() * 1800;
      const d = 0.03 + r() * 0.03;
      const ch = osc(d, (tt) => f0 * (1 + (tt / d) * 0.6), 'tri').map((v, i, a) => v * Math.sin((Math.PI * i) / a.length));
      mix(m, ch, t, 0.18);
    }
    const noise = mul(biquad(white(n, r), 'bp', (i) => 1500 + 1500 * Math.sin((i / SR) * 26), 1.2), (t) => 0.4 * Math.min(1, t * 4) * Math.min(1, (sec - t) * 3));
    mix(m, noise, 0, 0.6);
    return normalize(fadeEdges(reverb(m, {room: 0.6, wet: 0.2, tail: 0.4})), 0.6);
  },

  impact: () => {
    const r = rng(9);
    const sec = 2.6;
    const n = sec * SR;
    const m = new Float32Array(n);
    mix(m, osc(sec, (t) => 38 + 34 * Math.exp(-t * 9)).map((v, i) => v * Math.exp((-i / SR) * 2.2)), 0, 1);
    mix(m, mul(biquad(white(Math.round(0.12 * SR), r), 'lp', 2200), expDecay(30)), 0, 0.6);
    mix(m, mul(biquad(white(Math.round(1.2 * SR), r), 'bp', 300, 0.7), expDecay(4)), 0, 0.15);
    return normalize(fadeEdges(reverb(m, {room: 0.86, wet: 0.3, tail: 1.2})), 0.9);
  },

  hit: () => {
    const r = rng(10);
    const m = new Float32Array(Math.round(0.9 * SR));
    mix(m, osc(0.6, (t) => 140 + 120 * Math.exp(-t * 30)).map((v, i) => v * Math.exp((-i / SR) * 9)), 0, 0.8);
    mix(m, mul(biquad(white(Math.round(0.03 * SR), r), 'hp', 2500), expDecay(150)), 0, 0.4);
    return normalize(fadeEdges(reverb(m, {room: 0.7, wet: 0.25, tail: 0.5})), 0.6);
  },

  whoosh: () => {
    const r = rng(11);
    const sec = 1.3;
    const n = sec * SR;
    const w = mul(biquad(pink(n, r), 'bp', (i) => 300 + 2600 * Math.sin((Math.PI * i) / n) ** 2, 1.4), (t) => Math.sin((Math.PI * t) / sec) ** 3);
    const L = w.map((v, i) => v * (1 - (i / n) * 0.7));
    const R = w.map((v, i) => v * (0.3 + (i / n) * 0.7));
    return normalize(fadeEdges([L, R]), 0.55);
  },

  riser: () => {
    const r = rng(12);
    const sec = 3;
    const n = sec * SR;
    const m = new Float32Array(n);
    mix(m, mul(biquad(white(n, r), 'bp', (i) => 300 + 4000 * (i / n) ** 2, 2), (t) => (t / sec) ** 2), 0, 0.6);
    mix(m, osc(sec, (t) => 180 + 500 * (t / sec) ** 2).map((v, i) => v * (i / n) ** 2 * (0.6 + 0.4 * Math.sin((i / SR) * 2 * Math.PI * 8))), 0, 0.2);
    return normalize(fadeEdges(reverb(m, {room: 0.8, wet: 0.3, tail: 0.6}), 0.01, 0.2), 0.5);
  },

  'door-open': () => {
    const r = rng(13);
    const sec = 1.4;
    const n = sec * SR;
    const m = mul(biquad(pink(n, r), 'bp', 900, 0.8), (t) => Math.sin((Math.PI * t) / sec) * 0.6);
    mix(m, mul(osc(sec, () => 110, 'saw'), (t) => 0.05 * Math.sin((Math.PI * t) / sec)), 0, 1);
    return normalize(fadeEdges(reverb(biquad(m, 'lp', 3000), {room: 0.6, wet: 0.2, tail: 0.3})), 0.4);
  },

  'door-close': () => {
    const r = rng(14);
    const sec = 2;
    const m = new Float32Array(sec * SR);
    mix(m, mul(biquad(pink(Math.round(0.6 * SR), r), 'bp', 800, 0.8), (t) => Math.sin((Math.PI * t) / 0.6) * 0.5), 0, 1);
    mix(m, osc(0.8, (t) => 70 + 40 * Math.exp(-t * 20)).map((v, i) => v * Math.exp((-i / SR) * 7)), 0.55, 1);
    mix(m, mul(biquad(white(Math.round(0.04 * SR), r), 'hp', 2000), expDecay(120)), 0.57, 0.5);
    return normalize(fadeEdges(reverb(m, {room: 0.82, wet: 0.35, tail: 1})), 0.85);
  },

  atmosphere: () => {
    // Soft cinematic pad (Dm9 voicing), slow swells, wide stereo, long reverb
    const sec = 18;
    const n = sec * SR;
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    const notes = [73.42, 146.83, 220, 349.23, 523.25, 659.25];
    notes.forEach((f, k) => {
      for (const [ch, det] of [[L, 0.997], [R, 1.003]]) {
        const v = osc(sec, (t) => f * det * (1 + 0.002 * Math.sin(t * 0.3 + k)), 'saw');
        const filt = biquad(v, 'lp', 600 + k * 120);
        const e = (t) => (0.55 + 0.45 * Math.sin((2 * Math.PI * t) / sec * 2 + k * 1.3)) * (k === 0 ? 0.9 : 0.5 / (1 + k * 0.25));
        mix(ch, mul(filt, e), 0, 0.3);
      }
    });
    const [l] = reverb(L, {room: 0.9, wet: 0.55, tail: 2});
    const [, r2] = reverb(R, {room: 0.9, wet: 0.55, tail: 2});
    return normalize(loopify([l.slice(0, n), r2.slice(0, n)], 2), 0.4);
  },

  office: () => {
    const r = rng(16);
    const sec = 14;
    const n = sec * SR;
    const m = biquad(pink(n, r), 'lp', 500).map((v) => v * 0.6);
    for (let v = 0; v < 8; v++) {
      const f = 300 + r() * 600;
      const rate = 3 + r() * 2;
      mix(m, mul(biquad(pink(n, r), 'bp', f, 3), (t) => Math.max(0, Math.sin(2 * Math.PI * rate * t + v)) ** 2 * 0.4), 0, 0.3);
    }
    for (let t = 0.5; t < sec - 0.5; t += 0.12 + r() * 0.5) {
      mix(m, mul(biquad(white(Math.round(0.03 * SR), r), 'hp', 2500), expDecay(200)), t, 0.08);
    }
    const [L, R] = reverb(m, {room: 0.75, wet: 0.3, tail: 0.6});
    return normalize(loopify([L.slice(0, n), R.slice(0, n)], 1), 0.32);
  },

  dawn: () => {
    const r = rng(17);
    const sec = 16;
    const n = sec * SR;
    const m = mul(biquad(pink(n, r), 'bp', (i) => 500 + 300 * Math.sin((i / SR) * 0.35), 0.5), (t) => 0.35 + 0.25 * Math.sin(t * 0.4));
    mix(m, biquad(brown(n, r), 'lp', 200), 0, 0.5);
    for (let t = 1; t < sec - 1; t += 1.2 + r() * 2.5) {
      const base = 2600 + r() * 1800;
      const chirps = 2 + Math.floor(r() * 3);
      for (let c = 0; c < chirps; c++) {
        const d = 0.06 + r() * 0.05;
        mix(m, osc(d, (tt) => base * (1 + 0.25 * Math.sin((Math.PI * tt) / d))).map((v, i, a) => v * Math.sin((Math.PI * i) / a.length)), t + c * 0.11, 0.05);
      }
    }
    const [L, R] = reverb(m, {room: 0.85, wet: 0.35, tail: 1});
    return normalize(loopify([L.slice(0, n), R.slice(0, n)], 1.2), 0.3);
  },

  ending: () => {
    const sec = 7;
    const m = new Float32Array(sec * SR);
    mix(m, osc(3, (t) => 45 + 20 * Math.exp(-t * 4)).map((v, i) => v * Math.exp((-i / SR) * 1.4)), 0, 0.7);
    [440, 554.37, 659.25, 880, 1108.73].forEach((f, k) => {
      const b = sine(6, f).map((v, i) => v * Math.exp((-i / SR) * (0.6 + k * 0.1)) * Math.min(1, i / (0.02 * SR)));
      mix(m, b, 0.15 + k * 0.09, 0.22);
    });
    return normalize(fadeEdges(reverb(m, {room: 0.92, wet: 0.5, tail: 2.5}), 0.005, 1.5), 0.7);
  },

  'page-flip': () => {
    const r = rng(19);
    const sec = 0.35;
    const n = Math.round(sec * SR);
    const m = mul(biquad(white(n, r), 'bp', (i) => 2500 + 2000 * (i / n), 0.9), (t) => Math.sin((Math.PI * t) / sec) ** 2 * (0.6 + 0.4 * (r() > 0.5 ? 1 : 0.5)));
    return normalize(fadeEdges(stereo(m, 0.3)), 0.45);
  },

  shimmer: () => {
    const r = rng(20);
    const sec = 2.8;
    const m = new Float32Array(sec * SR);
    for (let k = 0; k < 14; k++) {
      const f = 1800 + r() * 3500;
      mix(m, sine(1.4, f).map((v, i) => v * Math.exp((-i / SR) * 4) * Math.min(1, i / 200)), r() * 1.2, 0.12);
    }
    return normalize(fadeEdges(reverb(m, {room: 0.9, wet: 0.5, tail: 1})), 0.35);
  },

  'phone-buzz': () => {
    const sec = 1.0;
    const m = osc(sec, () => 165, 'square').map((v, i) => {
      const t = i / SR;
      const on = (t < 0.35 || (t > 0.5 && t < 0.85)) ? 1 : 0;
      return v * on * 0.4;
    });
    return normalize(fadeEdges(stereo(biquad(m, 'lp', 900))), 0.4);
  },
};

/* ---------------- Main ---------------- */

fs.mkdirSync(OUT, {recursive: true});
const stamp = path.join(OUT, '.version');
const upToDate = !force && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === VERSION;
let made = 0;
for (const [name, fn] of Object.entries(recipes)) {
  const file = path.join(OUT, `${name}.wav`);
  if (upToDate && fs.existsSync(file)) continue;
  writeWav(file, fn());
  made++;
}
fs.writeFileSync(stamp, VERSION);
console.log(made ? `Sound effects: generated ${made} file(s) in public/audio/sound-effects/` : 'Sound effects: up to date.');
