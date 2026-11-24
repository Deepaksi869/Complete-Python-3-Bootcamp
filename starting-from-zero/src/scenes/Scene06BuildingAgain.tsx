/**
 * SCENE 06 — BUILDING AGAIN
 * Back in the apartment, lamp on. He opens the laptop. A blank workspace
 * fills with experience, ideas, then a website, code and a plan.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {cue} from '../lib/timeline';
import {Apartment, APT} from '../sets/Apartment';
import {Character, blendPose, expressions, mixExpression, poses} from '../components/Character';
import {camOn, mixCam} from '../components/Background';
import {LaptopFront} from '../components/Laptop';
import {Workspace} from '../components/ScreenUI';
import {TitleStack} from '../components/Typography';
import {Ambience, Sfx} from '../components/Sound';
import {APT_FACE} from './Scene01Present';
import {palette} from '../theme/palette';
import {lighting} from '../theme/lighting';
import {ease, ramp} from '../lib/anim';

export const Scene06BuildingAgain: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const b1 = cue(scene, 'b1');
  const L = b1.end - b1.start;
  // "This time, I brought | experience, | ideas, | and a plan."
  const expAt = Math.round(b1.start + L * 0.38);
  const ideasAt = Math.round(b1.start + L * 0.58);
  const planAt = Math.round(b1.start + L * 0.72);

  const lidStart = 10;
  const insertIn = lidStart + 24;
  const insertOut = Math.min(D - 26, b1.end + 18);
  const inInsert = frame >= insertIn && frame < insertOut;

  // Shot A + C: apartment, lamp on
  const lamp = ramp(frame, [4, 10], [0, 1]);
  const lid = ramp(frame, [lidStart, lidStart + 22], [0, 1], ease.inOut);
  const reach = ramp(frame, [lidStart - 14, lidStart], [0, 1], ease.inOut) * (1 - ramp(frame, [lidStart + 18, lidStart + 30], [0, 1]));
  const openPose = poses.sit({lean: 10, headPitch: 8, armNear: [48, 44], armFar: [20, 70]});
  const typing = poses.sitTyping(frame, 1.1);
  let pose = blendPose(poses.sit({lean: 6, headPitch: 6, armNear: [22, 70], armFar: [18, 74]}), openPose, reach);
  if (frame > lidStart + 26) pose = blendPose(pose, typing, ramp(frame, [lidStart + 26, lidStart + 40], [0, 1]));
  if (frame >= insertOut) pose = typing;
  const expr = mixExpression(expressions.determined, expressions.focused, ramp(frame, [insertOut, insertOut + 20], [0, 1]));

  const camA0 = camOn(APT_FACE, 1.45, {x: 600, y: 860});
  const camA1 = camOn(APT_FACE, 1.85, {x: 580, y: 820});
  const camC0 = camOn(APT_FACE, 2.3, {x: 600, y: 800});
  const camC1 = camOn(APT_FACE, 2.7, {x: 600, y: 780});
  const cam = frame < insertOut ? mixCam(camA0, camA1, ramp(frame, [0, insertIn], [0, 1], ease.camera)) : mixCam(camC0, camC1, ramp(frame, [insertOut, D], [0, 1], ease.soft));

  // Workspace build-up
  const experience = ramp(frame, [expAt - 4, expAt + 14], [0, 1], ease.out);
  const ideas = ramp(frame, [ideasAt - 4, ideasAt + 14], [0, 1], ease.out);
  const build = ramp(frame, [planAt - 2, insertOut - 4], [0, 1], ease.inOut);
  const insertP = ramp(frame, [insertIn, insertIn + 10], [0, 1], ease.out) * ramp(frame, [insertOut - 8, insertOut], [1, 0]);
  const titleAt = planAt;

  return (
    <AbsoluteFill>
      <Apartment
        cam={cam}
        lid={lid}
        glow={lid}
        lamp={lamp}
        calendar={{month: 'NOV', day: '14'}}
        character={
          <Character
            x={APT.seat.x}
            y={0}
            pose={pose}
            expression={expr}
            lookX={0.7}
            {...lighting.apartmentLamp}
            groundShadow={0}
          />
        }
      />
      {inInsert && (
        <AbsoluteFill style={{opacity: insertP, background: 'radial-gradient(ellipse at 50% 45%, #2a2a3c 0%, #0a0c16 75%)'}}>
          <LaptopFront width={1180} canvas={1150} top={ramp(frame, [insertIn, insertOut], [560, 520])} tilt={5}>
            <Workspace experience={experience} ideas={ideas} build={build} frame={frame} />
          </LaptopFront>
        </AbsoluteFill>
      )}
      <TitleStack
        lines={[
          {text: 'SO I DECIDED TO', at: titleAt, size: 110},
          {text: 'BUILD SOMETHING.', at: titleAt + 10, color: palette.orange, size: 150},
        ]}
        out={insertOut - 10}
        centerY={340}
        style="rise"
      />
      <Ambience name="room-tone" duration={D} volume={0.35} />
      <Ambience name="city-night" duration={D} volume={0.18} />
      <Sfx name="atmosphere" at={0} duration={D} volume={0.35} fadeIn={20} fadeOut={20} loop />
      <Sfx name="hit" at={4} volume={0.25} />
      <Sfx name="send" at={lidStart} volume={0.3} />
      <Sfx name="typing" at={lidStart + 30} duration={D - lidStart - 30} volume={0.32} fadeIn={8} fadeOut={10} loop />
      <Sfx name="whoosh" at={insertIn - 6} volume={0.35} />
      <Sfx name="hit" at={expAt} volume={0.25} />
      <Sfx name="hit" at={ideasAt} volume={0.25} />
      <Sfx name="riser" at={Math.max(0, planAt - 60)} volume={0.35} />
      <Sfx name="impact" at={titleAt} volume={0.45} />
      <Sfx name="shimmer" at={insertOut - 30} volume={0.5} />
    </AbsoluteFill>
  );
};
