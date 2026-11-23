/**
 * Scene registry: maps the `component` names used in episode configs to
 * React components. Add new scenes for future episodes here.
 */
import type React from 'react';
import type {SceneProps} from '../lib/types';
import {Scene01Present} from './Scene01Present';
import {Scene02Rewind} from './Scene02Rewind';
import {Scene03Arrival} from './Scene03Arrival';
import {Scene04PastCareer} from './Scene04PastCareer';
import {Scene05JobSearch} from './Scene05JobSearch';
import {Scene06BuildingAgain} from './Scene06BuildingAgain';
import {Scene07Finale} from './Scene07Finale';

export const sceneRegistry: Record<string, React.FC<SceneProps>> = {
  Scene01Present,
  Scene02Rewind,
  Scene03Arrival,
  Scene04PastCareer,
  Scene05JobSearch,
  Scene06BuildingAgain,
  Scene07Finale,
};
