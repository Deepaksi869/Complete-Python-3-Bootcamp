/** Shared types for the episode framework. */

export type NarrationLine = {
  /** Unique id, used by scenes to sync animation beats to this line. */
  id: string;
  /** Exact narration text (also used for captions). */
  text: string;
  /** Show this line as a caption (default true). */
  caption?: boolean;
  /** Extra breathing room (seconds) after this line, inside the same scene. */
  holdAfter?: number;
};

export type TransitionKind = 'cut' | 'crossfade' | 'fadeBlack' | 'flash' | 'whip';

export type SceneSpec = {
  /** Unique id for this scene within the episode. */
  id: string;
  /** Key of the scene component in src/scenes/registry.ts */
  component: string;
  /** Narration lines spoken during this scene, in order. */
  lines: NarrationLine[];
  /** Seconds of picture before the first line starts. */
  leadIn?: number;
  /** Seconds of picture after the last line ends. */
  tail?: number;
  /** The scene is never shorter than this (seconds). */
  minDuration?: number;
  /** How this scene enters. */
  transitionIn?: {kind: TransitionKind; duration: number};
  /** Free-form per-scene settings passed to the scene component. */
  options?: Record<string, unknown>;
};

export type EpisodeConfig = {
  id: string;
  compositionId: string;
  seriesTitle: string;
  episodeNumber: number;
  title: string;
  endSubtitle: string;
  fps: number;
  width: number;
  height: number;
  narration: {
    /** Used only for previews before real narration exists. */
    estimatedWordsPerSecond: number;
    /** Estimated pause between lines (preview only). */
    estimatedGap: number;
  };
  mix: {
    voice: number;
    music: number;
    musicDucked: number;
    sfx: number;
    /** Seconds the music takes to duck down / come back up. */
    duckAttack: number;
    duckRelease: number;
  };
  scenes: SceneSpec[];
};

/** Written by scripts/prepare-episode.mjs after measuring the narration file. */
export type AudioAnalysis = {
  hasVoiceover: boolean;
  voiceoverFile: string | null;
  musicFile: string | null;
  durationSec: number;
  speechStart: number;
  speechEnd: number;
  silences: {start: number; end: number}[];
  analysedAt?: string;
};

export type Cue = {id: string; text: string; start: number; end: number};

export type CaptionWord = {text: string; start: number; end: number};
export type CaptionChunk = {text: string; start: number; end: number; words: CaptionWord[]};

export type ScheduledScene = {
  spec: SceneSpec;
  index: number;
  /** Absolute start frame in the episode. */
  from: number;
  durationInFrames: number;
  /** Narration cues, in frames relative to the scene start. */
  cues: Record<string, Cue>;
};

export type AudioClip = {from: number; trimBefore: number; durationInFrames: number};

export type Timeline = {
  fps: number;
  durationInFrames: number;
  scenes: ScheduledScene[];
  captions: CaptionChunk[];
  clips: AudioClip[];
  /** Absolute [start, end] frames where narration is audible. */
  speech: [number, number][];
  /** True when timing is estimated (no narration file yet). */
  estimated: boolean;
  voiceoverFile: string | null;
  musicFile: string | null;
};

export type SceneProps = {scene: ScheduledScene; timeline: Timeline; episode: EpisodeConfig};
