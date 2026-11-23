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
    estimatedWordsPerSecond: 2.75,
    estimatedGap: 0.45,
  },
  mix: {
    voice: 1,
    music: 0.32,
    musicDucked: 0.085,
    sfx: 0.85,
    duckAttack: 0.35,
    duckRelease: 0.8,
  },
  scenes: [
    {
      id: 'present',
      component: 'Scene01Present',
      leadIn: 3.1, // cold-open typography plays before the voice starts
      tail: 1.0,
      lines: [
        {id: 'p1', text: 'I came to the UAE thinking this was going to be the beginning of something big.'},
        {id: 'p2', text: 'A new country. New opportunities. A fresh start.'},
        {id: 'p3', text: "But here's where I am today."},
        {id: 'p4', text: 'No stable job.'},
        {id: 'p5', text: 'No guaranteed income.'},
        {id: 'p6', text: "And a business I'm still trying to get off the ground."},
        {id: 'p7', text: "Sounds exciting, doesn't it?"},
      ],
    },
    {
      id: 'rewind',
      component: 'Scene02Rewind',
      leadIn: 0.5,
      tail: 1.4,
      minDuration: 4.6,
      transitionIn: {kind: 'cut', duration: 0},
      lines: [{id: 'r1', text: "It wasn't always like this."}],
    },
    {
      id: 'past-career',
      component: 'Scene04PastCareer',
      leadIn: 0.6,
      tail: 1.6,
      minDuration: 8,
      transitionIn: {kind: 'flash', duration: 12},
      lines: [
        {id: 'c1', text: 'Before Dubai, I had a career in India.'},
        {id: 'c2', text: 'I had work experience, responsibilities, and a fairly predictable life.'},
      ],
    },
    {
      id: 'arrival',
      component: 'Scene03Arrival',
      leadIn: 0.5,
      tail: 5.2, // the walk + "A NEW COUNTRY / A FRESH START" breathe here
      minDuration: 8,
      transitionIn: {kind: 'whip', duration: 14},
      lines: [{id: 'a1', text: 'Then I decided to take a chance.'}],
    },
    {
      id: 'reality',
      component: 'Scene05JobSearch',
      leadIn: 0.4,
      tail: 1.4,
      transitionIn: {kind: 'crossfade', duration: 14},
      lines: [
        {
          id: 'j1',
          text: "I moved to the UAE, started applying for jobs, met people, tried opportunities, and even thought I'd finally found my place.",
        },
        {id: 'j2', text: "But things didn't go exactly as planned."},
        {id: 'j3', text: 'One opportunity ended almost as quickly as it began.'},
        {id: 'j4', text: 'And suddenly, I was back at square one.'},
      ],
    },
    {
      id: 'building',
      component: 'Scene06BuildingAgain',
      leadIn: 0.7,
      tail: 1.8,
      transitionIn: {kind: 'fadeBlack', duration: 18},
      lines: [
        {id: 'b1', text: "Except this time, I wasn't starting with nothing."},
        {id: 'b2', text: 'I had experience.'},
        {id: 'b3', text: 'I had ideas.'},
        {id: 'b4', text: 'And I had one more thing to try.'},
        {id: 'b5', text: 'Building something of my own.'},
      ],
    },
    {
      id: 'finale',
      component: 'Scene07Finale',
      leadIn: 0.8,
      tail: 4.2,
      transitionIn: {kind: 'crossfade', duration: 22},
      lines: [
        {id: 'f1', text: "I don't know where this journey will end."},
        {id: 'f2', text: "But I figured, instead of pretending I've made it..."},
        {id: 'f3', text: 'Why not document what it actually takes to get there?'},
        {id: 'f4', text: 'This is Starting From Zero.', caption: false},
        {id: 'f5', text: 'And this is episode one.', caption: false},
      ],
    },
  ],
};
