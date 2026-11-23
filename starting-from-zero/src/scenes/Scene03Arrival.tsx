/**
 * SCENE 03 — ARRIVAL (UAE)
 * Tracking shot through a golden-hour arrival hall. He walks with his
 * suitcase, slows, looks up at the skyline and turns to camera, hopeful.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {cue} from '../lib/timeline';
import {Airport, AIRPORT} from '../sets/Airport';
import {Character, WALK_STRIDE, blendPose, expressions, mixExpression, poses} from '../components/Character';
import {camOn} from '../components/Background';
import {LightLeak, SunGlint} from '../components/Background';
import {LocationStamp, TitleStack} from '../components/Typography';
import {Ambience, Sfx} from '../components/Sound';
import {palette} from '../theme/palette';
import {ease, ramp} from '../lib/anim';

const SCALE = 1.7;
const CYCLE = 34; // frames per two steps
const PX_PER_FRAME = (WALK_STRIDE * SCALE) / CYCLE;

export const Scene03Arrival: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const a1 = cue(scene, 'a1');

  const stopStart = Math.max(70, D - 110);
  const STOP = 24;
  const u = ramp(frame, [stopStart, stopStart + STOP], [0, 1], (t) => t);
  const dist = frame < stopStart ? PX_PER_FRAME * frame : PX_PER_FRAME * stopStart + PX_PER_FRAME * STOP * (u - (u * u) / 2);
  const x = 260 + dist;
  const phase = (dist / (WALK_STRIDE * SCALE)) * Math.PI * 2;

  const walk = poses.walk(phase, {carry: true, energy: 1 - u * 0.6});
  const stand = poses.stand({armFar: [-24, 6], headPitch: -10, lean: 1});
  let pose = blendPose(walk, stand, ease.inOut(u));
  const turn = ramp(frame, [stopStart + STOP + 8, stopStart + STOP + 30], [0, 0.55], ease.inOut);
  pose = {...pose, headTurn: turn, headPitch: pose.headPitch + turn * 8};
  const expr = mixExpression(expressions.hopeful, expressions.smile, turn / 0.55);

  // Camera tracks him, then settles closer when he stops
  const face = {x, y: AIRPORT.floorY - 330 * SCALE};
  const follow = camOn({x: x + 60, y: face.y + 240}, 1.0, {x: 470, y: 1000});
  const settle = camOn(face, 1.55, {x: 470, y: 820});
  const k = ramp(frame, [stopStart, D], [0, 1], ease.camera);
  const cam = {
    x: follow.x + (settle.x - follow.x) * k,
    y: follow.y + (settle.y - follow.y) * k,
    zoom: 1 + 0.55 * k,
  };

  const t1 = a1.end + 6;
  const t2 = t1 + 34;

  return (
    <AbsoluteFill>
      <Airport
        cam={cam}
        sunY={830 - frame * 0.15}
        character={
          <Character
            x={x}
            y={AIRPORT.floorY}
            scale={SCALE}
            pose={pose}
            expression={expr}
            holding="suitcase"
            lookX={turn > 0.3 ? 0 : 0.5}
            lookY={turn > 0.3 ? 0 : -0.6}
            light={{color: palette.amber, strength: 0.32, from: 'front'}}
            rim={{color: '#ffd7a0', strength: 0.35, from: 'back'}}
            groundShadow={0.3}
          />
        }
      />
      <SunGlint x={1000 - k * 200} y={760} intensity={0.55} />
      <LightLeak progress={ramp(frame, [0, D], [0, 1])} opacity={0.25} />
      <LocationStamp text="DUBAI · ARRIVAL" at={10} out={t1 - 6} color={palette.white} />
      <TitleStack
        lines={[
          {text: 'A NEW COUNTRY.', at: t1},
          {text: 'A FRESH START.', at: t2, color: palette.amber},
        ]}
        out={D - 8}
        centerY={470}
        style="rise"
        size={150}
      />
      <Ambience name="airport" duration={D} volume={0.45} />
      <Sfx name="suitcase-roll" at={0} duration={stopStart + STOP} volume={0.4} fadeIn={6} fadeOut={14} loop />
      <Sfx name="atmosphere" at={0} duration={D} volume={0.3} fadeIn={20} fadeOut={20} loop />
      <Sfx name="hit" at={t1} volume={0.35} />
      <Sfx name="shimmer" at={t2 - 4} volume={0.5} />
    </AbsoluteFill>
  );
};
