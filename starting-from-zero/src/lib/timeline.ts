/**
 * TIMELINE ENGINE
 * ---------------------------------------------------------------
 * Turns an episode config + measured narration into a complete,
 * frame-accurate timeline: scene lengths, narration cue points,
 * audio clip placement and word-level captions.
 *
 * - Without narration: timing is estimated from word counts so the
 *   animation can be previewed.
 * - With narration: each script line is located inside the real audio
 *   using the pauses (silences) the voice actually makes. The audio is
 *   then cut only inside those pauses and placed scene by scene.
 *   Narration is never sped up, slowed down or stretched.
 */
import type {
  AudioAnalysis,
  AudioClip,
  CaptionChunk,
  CaptionWord,
  EpisodeConfig,
  NarrationLine,
  ScheduledScene,
  Timeline,
} from './types';

type LineTiming = {line: NarrationLine; sceneIndex: number; start: number; end: number};

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Rough spoken duration of a line in seconds (preview only). */
export const estimateLineSeconds = (text: string, wps: number) => {
  const words = wordCount(text);
  const commas = (text.match(/[,;:]/g) || []).length;
  const stops = (text.match(/[.?!]/g) || []).length;
  return words / wps + commas * 0.16 + Math.max(0, stops - 1) * 0.35 + 0.15;
};

/** Pick, for every boundary between two lines, the pause in the audio that best matches it. */
const alignToSilences = (
  lines: {line: NarrationLine; sceneIndex: number}[],
  analysis: AudioAnalysis,
  cfg: EpisodeConfig,
): LineTiming[] => {
  const n = lines.length;
  const S = analysis.speechStart;
  const E = analysis.speechEnd;
  const T = Math.max(0.001, E - S);
  const est = lines.map((l) => estimateLineSeconds(l.line.text, cfg.narration.estimatedWordsPerSecond));
  const gap = cfg.narration.estimatedGap;
  const total = est.reduce((a, b) => a + b, 0) + gap * (n - 1);
  // Expected centre of each boundary (between line k and k+1)
  const expected: number[] = [];
  let acc = 0;
  for (let k = 0; k < n - 1; k++) {
    acc += est[k] + gap / 2;
    expected.push(S + (acc / total) * T);
    acc += gap / 2;
  }

  type Cand = {start: number; end: number; center: number; dur: number; virtual: boolean};
  const real: Cand[] = analysis.silences
    .filter((s) => s.start > S + 0.05 && s.end < E - 0.05 && s.end - s.start >= 0.12)
    .map((s) => ({start: s.start, end: s.end, center: (s.start + s.end) / 2, dur: s.end - s.start, virtual: false}));
  const virtuals: Cand[] = expected.map((c) => ({start: c, end: c, center: c, dur: 0, virtual: true}));
  const cands = [...real, ...virtuals].sort((a, b) => a.center - b.center);
  const m = cands.length;
  const B = n - 1;

  const cost = (k: number, j: number) => {
    const c = cands[j];
    const d = (c.center - expected[k]) / T;
    if (c.virtual) {
      // A virtual boundary is only acceptable when no real pause fits.
      return Math.abs(c.center - expected[k]) < 1e-6 ? 3.2 : 1e9;
    }
    return d * d * 900 - 2.2 * Math.min(c.dur, 1.2);
  };

  if (B === 0) {
    return [{...lines[0], start: S, end: E}];
  }

  // Dynamic programming: choose B increasing candidates minimising total cost.
  const INF = 1e18;
  const dp: number[][] = Array.from({length: B}, () => new Array(m).fill(INF));
  const prev: number[][] = Array.from({length: B}, () => new Array(m).fill(-1));
  for (let j = 0; j < m; j++) dp[0][j] = cost(0, j);
  for (let k = 1; k < B; k++) {
    let bestVal = INF;
    let bestIdx = -1;
    for (let j = 0; j < m; j++) {
      // Best predecessor strictly before j (and not overlapping in time)
      if (j - 1 >= 0 && dp[k - 1][j - 1] < bestVal) {
        bestVal = dp[k - 1][j - 1];
        bestIdx = j - 1;
      }
      if (bestIdx >= 0 && bestVal < INF) {
        dp[k][j] = bestVal + cost(k, j);
        prev[k][j] = bestIdx;
      }
    }
  }
  let end = -1;
  let endVal = INF;
  for (let j = 0; j < m; j++) {
    if (dp[B - 1][j] < endVal) {
      endVal = dp[B - 1][j];
      end = j;
    }
  }
  const chosen: Cand[] = new Array(B);
  for (let k = B - 1, j = end; k >= 0; k--) {
    chosen[k] = cands[j];
    j = prev[k][j];
  }

  return lines.map((l, i) => ({
    ...l,
    start: i === 0 ? S : chosen[i - 1].end,
    end: i === n - 1 ? E : chosen[i].start,
  }));
};

/** Fake "audio" timings for preview mode. */
const estimateTimings = (lines: {line: NarrationLine; sceneIndex: number}[], cfg: EpisodeConfig): LineTiming[] => {
  let t = 0;
  return lines.map((l) => {
    const d = estimateLineSeconds(l.line.text, cfg.narration.estimatedWordsPerSecond);
    const r = {...l, start: t, end: t + d};
    t += d + cfg.narration.estimatedGap;
    return r;
  });
};

/** Split a line into short, readable caption chunks with per-word timing. */
export const chunkCaption = (text: string, start: number, end: number): CaptionChunk[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[][] = [];
  let cur: string[] = [];
  const len = (ws: string[]) => ws.join(' ').length;
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const hardStop = /[.?!…]$/.test(w);
    const softStop = /[,;:]$/.test(w) && cur.length >= 2;
    const tooLong = next !== undefined && (cur.length >= 5 || len([...cur, next]) > 26);
    if (hardStop || softStop || tooLong || next === undefined) {
      chunks.push(cur);
      cur = [];
    }
  });
  // Avoid orphan single short words at the end of a line
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1];
    const before = chunks[chunks.length - 2];
    if (last.length === 1 && len(before) + len(last) < 30 && !/[.?!…]$/.test(before[before.length - 1])) {
      chunks.splice(chunks.length - 2, 2, [...before, ...last]);
    }
  }
  const weight = (w: string) => w.replace(/[^\w']/g, '').length + 2 + (/[,;:]$/.test(w) ? 3 : 0) + (/[.?!…]$/.test(w) ? 4 : 0);
  const totalW = words.reduce((a, w) => a + weight(w), 0);
  const dur = Math.max(0.01, end - start);
  let t = start;
  return chunks.map((ws) => {
    const cStart = t;
    const cw: CaptionWord[] = ws.map((w) => {
      const d = (weight(w) / totalW) * dur;
      const word = {text: w, start: t, end: t + d};
      t += d;
      return word;
    });
    return {text: ws.join(' '), start: cStart, end: t, words: cw};
  });
};

export const buildTimeline = (cfg: EpisodeConfig, analysis: AudioAnalysis): Timeline => {
  const fps = cfg.fps;
  const flat = cfg.scenes.flatMap((s, sceneIndex) => s.lines.map((line) => ({line, sceneIndex})));
  const useAudio = analysis.hasVoiceover && analysis.durationSec > 0 && flat.length > 0;
  const timings = useAudio ? alignToSilences(flat, analysis, cfg) : estimateTimings(flat, cfg);
  const audioDuration = useAudio
    ? analysis.durationSec
    : (timings[timings.length - 1]?.end ?? 0) + 1;

  // Safe cut points inside the pauses either side of each line.
  const cutBefore = (i: number) => {
    const s = timings[i].start;
    const prevEnd = i === 0 ? 0 : timings[i - 1].end;
    return Math.max(prevEnd + (s - prevEnd) / 2, s - 0.3, 0);
  };
  const cutAfter = (i: number) => {
    const e = timings[i].end;
    const nextStart = i === timings.length - 1 ? audioDuration : timings[i + 1].start;
    return Math.min(e + (nextStart - e) / 2, e + 0.45, audioDuration);
  };

  const scenes: ScheduledScene[] = [];
  const clips: AudioClip[] = [];
  const speech: [number, number][] = [];
  const captions: CaptionChunk[] = [];
  const f = (sec: number) => Math.round(sec * fps);

  let t = 0; // seconds, episode time
  let lineIdx = 0;
  cfg.scenes.forEach((spec, index) => {
    const sceneStart = t;
    const cues: ScheduledScene['cues'] = {};
    let cursor = sceneStart + (spec.leadIn ?? 0.4);
    let lastSpeechEnd = cursor;

    // Group lines into continuous clips (split where holdAfter asks for extra space)
    const sceneLines = spec.lines.map(() => lineIdx++);
    let g = 0;
    while (g < sceneLines.length) {
      let h = g;
      while (h < sceneLines.length - 1 && !(timings[sceneLines[h]].line.holdAfter ?? 0)) h++;
      const first = sceneLines[g];
      const last = sceneLines[h];
      const aStart = cutBefore(first);
      const aEnd = cutAfter(last);
      const clipFrom = cursor - (timings[first].start - aStart);
      clips.push({from: f(clipFrom), trimBefore: f(aStart), durationInFrames: Math.max(1, f(aEnd) - f(aStart))});
      for (let i = g; i <= h; i++) {
        const li = sceneLines[i];
        const tm = timings[li];
        const st = clipFrom + (tm.start - aStart);
        const en = clipFrom + (tm.end - aStart);
        cues[tm.line.id] = {id: tm.line.id, text: tm.line.text, start: f(st - sceneStart), end: f(en - sceneStart)};
        speech.push([f(st), f(en)]);
        if (tm.line.caption !== false) captions.push(...chunkCaption(tm.line.text, st, en));
        lastSpeechEnd = en;
      }
      const hold = timings[last].line.holdAfter ?? 0;
      const naturalGap = h < sceneLines.length - 1 ? timings[sceneLines[h + 1]].start - timings[last].end : 0;
      cursor = lastSpeechEnd + naturalGap + hold;
      g = h + 1;
    }

    const sceneEnd = Math.max(lastSpeechEnd + (spec.tail ?? 0.5), sceneStart + (spec.minDuration ?? 0));
    scenes.push({spec, index, from: f(sceneStart), durationInFrames: f(sceneEnd) - f(sceneStart), cues});
    t = sceneEnd;
  });

  // Convert caption times to frames and give each chunk a little hang time.
  const capFrames: CaptionChunk[] = captions.map((c, i) => {
    const next = captions[i + 1];
    const hang = next ? Math.min(c.end + 0.35, next.start) : c.end + 0.6;
    return {
      text: c.text,
      start: f(c.start),
      end: f(Math.max(hang, c.end)),
      words: c.words.map((w) => ({text: w.text, start: f(w.start), end: f(w.end)})),
    };
  });

  return {
    fps,
    durationInFrames: f(t),
    scenes,
    captions: capFrames,
    clips: useAudio ? clips : [],
    speech,
    estimated: !useAudio,
    voiceoverFile: useAudio ? analysis.voiceoverFile : null,
    musicFile: analysis.musicFile,
  };
};

/** Helper used by scenes: start/end frame of a narration line (relative to the scene). */
export const cue = (scene: ScheduledScene, id: string) => {
  const c = scene.cues[id];
  if (!c) throw new Error(`Scene "${scene.spec.id}" has no narration line "${id}"`);
  return c;
};

/** Music volume with automatic ducking under narration. */
export const duckedVolume = (frame: number, timeline: Timeline, cfg: EpisodeConfig) => {
  const {music, musicDucked, duckAttack, duckRelease} = cfg.mix;
  const fps = timeline.fps;
  let amount = 0;
  for (const [s, e] of timeline.speech) {
    if (frame >= s && frame <= e) {
      amount = 1;
      break;
    }
    if (frame < s) {
      const d = (s - frame) / fps;
      if (d < duckAttack) amount = Math.max(amount, 1 - d / duckAttack);
    } else {
      const d = (frame - e) / fps;
      if (d < duckRelease) amount = Math.max(amount, 1 - d / duckRelease);
    }
  }
  return music + (musicDucked - music) * amount;
};
