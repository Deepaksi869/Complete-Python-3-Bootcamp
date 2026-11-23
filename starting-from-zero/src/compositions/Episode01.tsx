/**
 * EPISODE 01 — wires the config and the measured narration into the
 * generic episode composition.
 */
import React from 'react';
import {episode01} from '../config/episode01';
import analysis from '../generated/episode01.audio.json';
import {buildTimeline} from '../lib/timeline';
import type {AudioAnalysis} from '../lib/types';
import {EpisodeComposition} from './EpisodeComposition';

export const episode01Timeline = buildTimeline(episode01, analysis as AudioAnalysis);

export const Episode01: React.FC = () => <EpisodeComposition config={episode01} timeline={episode01Timeline} />;
