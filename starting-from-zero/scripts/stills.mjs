#!/usr/bin/env node
/**
 * QUALITY CHECK: renders a contact sheet (one frame every 1.5 s) to
 * renders/<episode>-contact-sheet-N.png so you can eyeball the whole episode.
 */
import fs from 'node:fs';
import {browserArgs, loadEpisode, rel, run, runCapture} from './lib/common.mjs';

const id = process.argv[2] ?? 'episode01';
const ep = loadEpisode(id);
await run('node', ['scripts/prepare-episode.mjs', id]);
const low = rel('renders', `${id}-qa-lowres.mp4`);
await run('npx', ['remotion', 'render', 'src/index.ts', ep.compositionId, low, '--scale=0.25', '--muted', ...browserArgs()]);
runCapture('ffmpeg', ['-y', '-v', 'error', '-i', low, '-vf', "select='not(mod(n\\,45))',tile=9x4", '-vsync', 'vfr', rel('renders', `${id}-contact-sheet-%d.png`)], {stdio: 'inherit'});
fs.rmSync(low);
console.log('Contact sheets written to renders/');
