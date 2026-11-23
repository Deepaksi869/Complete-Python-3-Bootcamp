#!/usr/bin/env node
/**
 * PREPARE AN EPISODE
 *  1. Generates the procedural sound effects (if missing).
 *  2. Finds the narration (voiceover.mp3 / .wav) and optional music.
 *  3. Measures the narration's real duration and its pauses.
 *  4. Writes src/generated/<episode>.audio.json, which the timeline engine
 *     uses to sync scenes and captions to the voice.
 *
 * Usage: node scripts/prepare-episode.mjs episode01 [--require-voiceover]
 */
import fs from 'node:fs';
import {box, fail, findAudio, loadEpisode, rel, run, runCapture} from './lib/common.mjs';

const id = process.argv[2] ?? 'episode01';
const requireVo = process.argv.includes('--require-voiceover');
const ep = loadEpisode(id);

await run('node', ['scripts/generate-sfx.mjs']);

const vo = findAudio(ep, 'voiceover');
const music = findAudio(ep, 'music');

const missingVoiceoverHelp = [
  'No narration file was found. Put your ElevenLabs download here:',
  '',
  `    public/${ep.audioDir}/voiceover.mp3     (or voiceover.wav)`,
  '',
  'Then run the command again.',
];

let analysis = {
  hasVoiceover: false,
  voiceoverFile: null,
  musicFile: music ? music.publicPath : null,
  durationSec: 0,
  speechStart: 0,
  speechEnd: 0,
  silences: [],
};

if (!vo) {
  if (requireVo) fail('Narration missing', missingVoiceoverHelp);
  box('Preview mode: no narration yet', [...missingVoiceoverHelp, '', 'Timing is estimated from the script for now.']);
} else {
  // Decode to mono 16 kHz PCM and measure loudness in 10 ms windows.
  const SR = 16000;
  const r = runCapture('ffmpeg', ['-v', 'error', '-i', vo.abs, '-ac', '1', '-ar', String(SR), '-f', 's16le', 'pipe:1']);
  if (r.status !== 0 || !r.stdout?.length) {
    fail('Could not read the narration file', [vo.abs, String(r.stderr || '').slice(0, 300), 'Re-export it from ElevenLabs as MP3 or WAV and try again.']);
  }
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 2));
  const durationSec = pcm.length / SR;
  const win = SR / 100;
  const db = [];
  for (let i = 0; i + win <= pcm.length; i += win) {
    let sum = 0;
    for (let k = 0; k < win; k++) sum += (pcm[i + k] / 32768) ** 2;
    db.push(10 * Math.log10(sum / win + 1e-12));
  }
  const sorted = [...db].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const loud = sorted[Math.floor(sorted.length * 0.9)];
  const threshold = Math.max(floor + 8, Math.min(loud - 26, -38));
  const voiced = db.map((v) => v > threshold);
  // Fill tiny gaps inside words (< 60 ms)
  const silences = [];
  let i = 0;
  while (i < voiced.length) {
    if (!voiced[i]) {
      let j = i;
      while (j < voiced.length && !voiced[j]) j++;
      if (j - i >= 12) silences.push({start: i / 100, end: j / 100});
      i = j;
    } else i++;
  }
  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  if (first < 0) fail('The narration file seems to be silent', [vo.abs]);
  analysis = {
    ...analysis,
    hasVoiceover: true,
    voiceoverFile: vo.publicPath,
    durationSec: Number(durationSec.toFixed(3)),
    speechStart: Number((first / 100).toFixed(2)),
    speechEnd: Number(((last + 1) / 100).toFixed(2)),
    silences: silences.filter((s) => s.start > first / 100 && s.end < (last + 1) / 100).map((s) => ({start: +s.start.toFixed(2), end: +s.end.toFixed(2)})),
    analysedAt: new Date().toISOString(),
  };
  box('Narration found and measured', [
    `File:      public/${vo.publicPath}`,
    `Duration:  ${durationSec.toFixed(1)} s`,
    `Pauses:    ${analysis.silences.length} detected (used to sync scenes + captions)`,
    `Music:     ${music ? 'public/' + music.publicPath + ' (auto-ducked)' : 'none (optional)'}`,
  ], '\x1b[32m');
}

const out = rel(ep.analysisFile);
const next = JSON.stringify(analysis, null, 2) + '\n';
if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== next) fs.writeFileSync(out, next);
