#!/usr/bin/env node
/**
 * RENDER AN EPISODE — the one command you run.
 *   node scripts/render-episode.mjs episode01          → final video (needs narration)
 *   node scripts/render-episode.mjs episode01 --draft  → visual draft without narration
 *
 * Steps: check narration → measure it → render (Remotion) → loudness-normalise
 * audio for Instagram + fast-start MP4 (ffmpeg) → verify the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import {box, browserArgs, fail, findAudio, loadEpisode, rel, run, runCapture} from './lib/common.mjs';

const id = process.argv[2] ?? 'episode01';
const draft = process.argv.includes('--draft');
const ep = loadEpisode(id);
const started = Date.now();

if (!draft && !findAudio(ep, 'voiceover')) {
  fail('Narration missing — nothing was rendered', [
    'Put your ElevenLabs narration here:',
    '',
    `    public/${ep.audioDir}/voiceover.mp3     (or voiceover.wav)`,
    '',
    `Then run:  npm run render:${id}`,
    '',
    `(To check the visuals without narration: npm run render:draft:${id})`,
  ]);
}

await run('node', ['scripts/prepare-episode.mjs', id, ...(draft ? [] : ['--require-voiceover'])]);

const finalOut = rel(draft ? ep.draftOutput : ep.output);
fs.mkdirSync(path.dirname(finalOut), {recursive: true});
const tmp = finalOut.replace(/\.mp4$/, '.tmp.mp4');

console.log(`\nRendering ${ep.compositionId} … (this takes a while; progress is shown below)\n`);
await run('npx', [
  'remotion',
  'render',
  'src/index.ts',
  ep.compositionId,
  tmp,
  '--codec=h264',
  '--audio-codec=aac',
  '--audio-bitrate=192k',
  '--crf=18',
  '--pixel-format=yuv420p',
  ...browserArgs(),
]);

// Loudness for Instagram (-14 LUFS), keep video untouched, web-optimised MP4.
const post = runCapture('ffmpeg', [
  '-y', '-v', 'error', '-i', tmp,
  '-c:v', 'copy',
  '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart',
  finalOut,
], {stdio: 'inherit'});
if (post.status === 0) fs.rmSync(tmp);
else {
  console.warn('Audio normalisation step failed; keeping the unnormalised render.');
  fs.renameSync(tmp, finalOut);
}

// Verify the result
const probe = runCapture('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate:format=duration', '-of', 'json', finalOut]);
let info = {};
try {
  info = JSON.parse(String(probe.stdout));
} catch {
  /* ignore */
}
const v = info.streams?.find((s) => s.codec_type === 'video');
const a = info.streams?.find((s) => s.codec_type === 'audio');
const dur = Number(info.format?.duration ?? 0);
const problems = [];
if (!v || v.width !== 1080 || v.height !== 1920) problems.push('Video is not 1080x1920');
if (v && v.r_frame_rate !== '30/1') problems.push(`Frame rate is ${v?.r_frame_rate}`);
if (!a) problems.push('No audio track');
box(problems.length ? 'Rendered with warnings' : '✔ Render complete', [
  `File:        ${path.relative(rel(), finalOut)}`,
  `Video:       ${v?.codec_name} ${v?.width}x${v?.height} @ ${v?.r_frame_rate} fps`,
  `Audio:       ${a ? a.codec_name : 'missing'}`,
  `Duration:    ${dur.toFixed(1)} s`,
  `Render time: ${((Date.now() - started) / 60000).toFixed(1)} min`,
  ...(draft ? ['', 'DRAFT: no narration. Add voiceover.mp3 and run render:' + id] : []),
  ...problems.map((p) => '⚠ ' + p),
], problems.length ? '\x1b[33m' : '\x1b[32m');
