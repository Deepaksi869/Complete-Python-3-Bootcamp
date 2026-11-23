/**
 * SCENE 04 — BEFORE THE MOVE (India)
 * Warm office, steady work. The whiteboard timeline fills with milestones,
 * then: "I WASN'T STARTING FROM ZERO."
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {cue} from '../lib/timeline';
import {IndiaOffice, OFFICE} from '../sets/IndiaOffice';
import {Character, poses} from '../components/Character';
import {camOn, mixCam} from '../components/Background';
import {LocationStamp, TitleStack} from '../components/Typography';
import {Ambience, Sfx} from '../components/Sound';
import {palette} from '../theme/palette';
import {ease, ramp} from '../lib/anim';

export const Scene04PastCareer: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const c1 = cue(scene, 'c1');
  const c2 = cue(scene, 'c2');

  // Slow lateral dolly with a gentle push
  const face = OFFICE.toStage(-52, -236);
  const start = camOn({x: face.x - 150, y: face.y - 40}, 1.25, {x: 540, y: 900});
  const end = camOn({x: face.x + 40, y: face.y + 10}, 1.55, {x: 540, y: 860});
  const cam = mixCam(start, end, ramp(frame, [0, D], [0, 1], ease.camera));

  const timeline = ramp(frame, [c2.start - 4, c2.end - 6], [0.1, 1], ease.inOut);
  const titleAt = Math.min(D - 40, c2.end - 2);
  const look = ramp(frame, [c1.start + 30, c1.start + 50], [0, 1]) * (1 - ramp(frame, [c2.start + 10, c2.start + 30], [0, 1]));

  const pose = poses.sitTyping(frame, 0.9, {headPitch: 6 - look * 10, headTurn: look * 0.18});

  return (
    <AbsoluteFill>
      <IndiaOffice
        cam={cam}
        timeline={timeline}
        character={
          <Character
            x={OFFICE.seat.x}
            y={0}
            pose={pose}
            expression="determined"
            lookX={0.7}
            light={{color: '#ffd7a0', strength: 0.35, from: 'back'}}
            rim={{color: '#fff0d0', strength: 0.4, from: 'back'}}
            groundShadow={0}
          />
        }
      />
      <LocationStamp text="INDIA · BEFORE THE MOVE" at={10} out={c2.start} color={palette.white} />
      <TitleStack
        lines={[
          {text: "I WASN'T", at: titleAt},
          {text: 'STARTING', at: titleAt + 7},
          {text: 'FROM ZERO.', at: titleAt + 14, color: palette.orange},
        ]}
        out={D + 30}
        centerY={560}
        style="rise"
        size={160}
      />
      <Ambience name="office" duration={D} volume={0.4} />
      <Sfx name="typing" at={0} duration={D} volume={0.3} fadeIn={10} fadeOut={20} loop />
      <Sfx name="atmosphere" at={0} duration={D} volume={0.25} fadeIn={20} fadeOut={20} loop />
      {[0.25, 0.5, 0.75, 1].map((k, i) => (
        <Sfx key={i} name="hit" at={Math.round(c2.start - 4 + (c2.end - 6 - c2.start + 4) * ((k - 0.1) / 0.9))} volume={0.25} />
      ))}
      <Sfx name="impact" at={titleAt} volume={0.55} />
    </AbsoluteFill>
  );
};
