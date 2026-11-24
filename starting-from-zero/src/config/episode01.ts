/**
 * EPISODE 01 — THE BEGINNING ISN'T WHAT I EXPECTED
 * ---------------------------------------------------------------
 * This file is the only thing you need to touch to change what is said.
 *
 *  - `text`      : the exact narration (also becomes the captions).
 *                  Keep it identical to what you paste into ElevenLabs.
 *  - `id`        : animation beats are synced to these ids — don't rename
 *                  them unless you also update the scene that uses them.
 *  - `caption`   : set to false to hide a line from the captions.
 *  - `holdAfter` : extra seconds of silence after a line.
 *
 * Scene length is calculated automatically from the narration file.
 */
import type {EpisodeConfig} from '../lib/types';

export const episode01: EpisodeConfig = {
  id: 'episode01',
  compositionId: 'Episode01',
  seriesTitle: 'STARTING FROM ZERO',
  episodeNumber: 1,
  title: "The Beginning Isn't What I Expected",
  endSubtitle: 'This is only the beginning.',
  fps: 30,
  width: 1080,
  height: 1920,
  narration: {
    estimatedWordsPerSecond: 2.6,
    estimatedGap: 0.4,
    previewTargetSeconds: 55,
    maxDurationSeconds: 60,
  },
  mix: {
    voice: 1,
    music: 0.32,
    musicDucked: 0.085,
    sfx: 0.85,
    duckAttack: 0.35,
    duckRelease: 0.8,
  },
  // Order: present → rewind → India → arrival → job search & setback → building → title
  scenes: [
    {
      id: 'present',
      component: 'Scene01Present',
      leadIn: 1.9, // "NO JOB / NO GUARANTEES / ONE MORE TRY" lands before the voice
      tail: 0.5,
      lines: [
        {id: 'p1', text: 'I came to the UAE thinking this was my fresh start.'},
        {id: 'p2', text: 'A new country. New opportunities. A better future.'},
        {id: 'p3', text: "But here's where I am now: work isn't settled, income isn't guaranteed, and I'm trying to build something of my own."},
      ],
    },
    {
      id: 'rewind',
      component: 'Scene02Rewind',
      leadIn: 0,
      tail: 0,
      minDuration: 2.3,
      transitionIn: {kind: 'cut', duration: 0},
      lines: [],
    },
    {
      id: 'past-career',
      component: 'Scene04PastCareer',
      leadIn: 0.35,
      tail: 1.0,
      minDuration: 4.4,
      transitionIn: {kind: 'flash', duration: 10},
      lines: [{id: 'c1', text: 'Before the UAE, I had a job and a life in India.'}],
    },
    {
      id: 'arrival',
      component: 'Scene03Arrival',
      leadIn: 0.3,
      tail: 1.9,
      minDuration: 4.6,
      transitionIn: {kind: 'whip', duration: 12},
      lines: [{id: 'a1', text: 'Then I took a chance and moved.'}],
    },
    {
      id: 'reality',
      component: 'Scene05JobSearch',
      leadIn: 0.3,
      tail: 0.9,
      transitionIn: {kind: 'crossfade', duration: 12},
      lines: [
        {id: 'j1', text: 'I applied for jobs, met people, tried opportunities.'},
        {id: 'j2', text: "For a while, I thought I'd found my place."},
        {id: 'j3', text: 'Then that chapter ended, and I had to begin again.'},
      ],
    },
    {
      id: 'building',
      component: 'Scene06BuildingAgain',
      leadIn: 0.5,
      tail: 1.3,
      transitionIn: {kind: 'fadeBlack', duration: 12},
      lines: [{id: 'b1', text: 'This time, I brought experience, ideas, and a plan.'}],
    },
    {
      id: 'finale',
      component: 'Scene07Finale',
      leadIn: 0.4,
      tail: 2.8,
      transitionIn: {kind: 'crossfade', duration: 18},
      lines: [
        {id: 'f1', text: "I don't know where this journey will take me."},
        {id: 'f2', text: "But I'm going to document it honestly, one step at a time."},
        {id: 'f3', text: 'This is Starting From Zero.', caption: false},
      ],
    },
  ],
};
