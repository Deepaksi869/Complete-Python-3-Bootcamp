#!/usr/bin/env node
/** PREVIEW: measure narration (if present) and open Remotion Studio. */
import {loadEpisode, run, browserArgs} from './lib/common.mjs';

const id = process.argv[2] ?? 'episode01';
loadEpisode(id);
await run('node', ['scripts/prepare-episode.mjs', id]);
await run('npx', ['remotion', 'studio', 'src/index.ts', ...browserArgs()]);
