/** Shared helpers for the production scripts. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const rel = (...p) => path.join(ROOT, ...p);

export const loadEpisode = (id) => {
  const all = JSON.parse(fs.readFileSync(rel('src/config/episodes.json'), 'utf8'));
  const ep = all[id];
  if (!ep) {
    fail(`Unknown episode "${id}". Known episodes: ${Object.keys(all).join(', ')}`);
  }
  return {id, ...ep};
};

export const box = (title, lines, color = '\x1b[33m') => {
  const reset = '\x1b[0m';
  const width = Math.max(title.length, ...lines.map((l) => l.length)) + 4;
  const bar = '─'.repeat(width);
  console.log(`\n${color}┌${bar}┐`);
  console.log(`│  ${title.padEnd(width - 2)}│`);
  console.log(`├${bar}┤`);
  for (const l of lines) console.log(`│  ${l.padEnd(width - 2)}│`);
  console.log(`└${bar}┘${reset}\n`);
};

export const fail = (msg, lines = []) => {
  box(`✖ ${msg}`, lines, '\x1b[31m');
  process.exit(1);
};

/** Find a voiceover / music file in the episode's audio folder. */
export const findAudio = (ep, base) => {
  for (const ext of ['mp3', 'wav', 'm4a']) {
    const p = rel('public', ep.audioDir, `${base}.${ext}`);
    if (fs.existsSync(p)) return {abs: p, publicPath: `${ep.audioDir}/${base}.${ext}`};
  }
  return null;
};

const which = (cmd) => spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]).status === 0;

/** ffmpeg/ffprobe: system binaries if present, otherwise the ones bundled with Remotion. */
export const tool = (name) => (which(name) ? {cmd: name, pre: []} : {cmd: 'npx', pre: ['remotion', name]});

export const runCapture = (name, args, opts = {}) => {
  const t = tool(name);
  const r = spawnSync(t.cmd, [...t.pre, ...args], {cwd: ROOT, maxBuffer: 1024 * 1024 * 512, shell: process.platform === 'win32', ...opts});
  return r;
};

export const run = (cmd, args, env = {}) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env: {...process.env, ...env}});
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))));
  });

export const browserArgs = () =>
  process.env.REMOTION_BROWSER_EXECUTABLE ? [`--browser-executable=${process.env.REMOTION_BROWSER_EXECUTABLE}`] : [];
