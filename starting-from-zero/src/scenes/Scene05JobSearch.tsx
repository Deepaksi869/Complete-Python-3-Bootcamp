/**
 * SCENE 05 — REALITY
 * A: laptop insert — applications submitted, emails arrive, interviews fill
 *    the calendar.
 * B: he walks into an office, hopeful. Time passes; the light fades.
 * C: the door opens again and he walks out. The door closes behind him.
 * D: alone on the plaza at dusk — back at square one.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {cue} from '../lib/timeline';
import {ENTRANCE, OfficeEntrance} from '../sets/OfficeEntrance';
import {Character, WALK_STRIDE, blendPose, expressions, mixExpression, poses} from '../components/Character';
import {camOn, mixCam} from '../components/Background';
import {LaptopFront} from '../components/Laptop';
import {ApplyDashboard} from '../components/ScreenUI';
import {TitleStack} from '../components/Typography';
import {Ambience, Sfx} from '../components/Sound';
import {palette} from '../theme/palette';
import {ease, lerp, ramp} from '../lib/anim';

const SCALE = 1.45;
const STRIDE_PX = WALK_STRIDE * SCALE;

export const Scene05JobSearch: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const j1 = cue(scene, 'j1');
  const j2 = cue(scene, 'j2');
  const j3 = cue(scene, 'j3');

  // A: applications (j1) → B: walks in, hopeful (j2) → C: walks out, door closes (j3) → D: square one
  const shotB = j1.end + 2;
  const inInsert = frame < shotB;

  /* ---------- Shot A: the application grind ---------- */
  const t = ramp(frame, [j1.start - 6, shotB - 4], [0, 1], (x) => x);
  const noteFrames = [0, 1, 2, 3].map((i) => Math.round(lerp(j1.start - 6, shotB - 4, 0.18 + i * 0.2)));
  const insertFade = ramp(frame, [shotB - 8, shotB], [1, 0]);

  /* ---------- Shots B–D: the office door ---------- */
  const G = ENTRANCE.groundY;
  const doorCenter = (ENTRANCE.door.x0 + ENTRANCE.door.x1) / 2;
  const walkInStart = shotB - 4;
  const walkInEnd = walkInStart + 60;
  const exitStart = Math.max(walkInEnd + 26, j3.start + 4);
  const exitEnd = exitStart + 66;

  let x: number;
  let facing: 1 | -1 = 1;
  let phase = 0;
  let pose;
  let expr = expressions.hopeful;
  if (frame < exitStart) {
    const p = ramp(frame, [walkInStart, walkInEnd], [0, 1], (v) => v);
    x = lerp(220, 1040, p);
    phase = ((x - 220) / STRIDE_PX) * Math.PI * 2;
    pose = poses.walk(phase, {energy: 1});
  } else {
    facing = -1;
    const p = ramp(frame, [exitStart, exitEnd], [0, 1], (v) => v);
    x = lerp(1040, 400, ease.soft(p));
    phase = ((1040 - x) / STRIDE_PX) * Math.PI * 2;
    const stop = ramp(frame, [exitEnd - 22, exitEnd], [0, 1]);
    pose = blendPose(poses.walk(phase, {energy: 0.75}), poses.stand({headPitch: 16, lean: 0, armNear: [2, 8], armFar: [-2, 8]}), stop);
    pose = {...pose, headPitch: pose.headPitch + 10};
    expr = mixExpression(expressions.sad, expressions.tired, ramp(frame, [exitEnd - 10, D], [0, 1]));
  }

  const doorOpen = Math.max(
    ramp(frame, [walkInStart + 20, walkInStart + 34], [0, 1], ease.inOut) * (1 - ramp(frame, [walkInEnd, walkInEnd + 16], [0, 1], ease.inOut)),
    ramp(frame, [exitStart - 10, exitStart + 2], [0, 1], ease.inOut) * (1 - ramp(frame, [exitStart + 36, exitStart + 48], [0, 1], ease.in)),
  );
  const dusk = Math.min(1, ramp(frame, [walkInEnd, exitStart], [0, 0.7], ease.inOut) + ramp(frame, [exitStart + 30, D], [0, 0.3]));
  const interiorOn = 1 - ramp(frame, [exitStart + 50, exitStart + 56], [0, 1]);
  const square = ramp(frame, [exitEnd - 8, exitEnd + 20], [0, 1], ease.out);

  const camB = camOn({x: doorCenter - 120, y: G - 300}, 1.05, {x: 540, y: 1000});
  const camD = {...camOn({x: 420, y: G - 250}, 0.88, {x: 540, y: 1080}), rot: 0};
  const cam = mixCam(camB, camD, ramp(frame, [exitStart + 30, D], [0, 1], ease.camera));

  const titleAt = j3.start + 2;

  return (
    <AbsoluteFill>
      {!inInsert || insertFade < 1 ? (
        <OfficeEntrance
          cam={cam}
          dusk={dusk}
          doorOpen={doorOpen}
          interiorOn={interiorOn}
          square={square}
          squareX={400}
          character={
            <Character
              x={x}
              y={G}
              scale={SCALE}
              facing={facing}
              pose={pose}
              expression={expr}
              lookX={0.4}
              lookY={facing < 0 ? 0.8 : 0}
              shade={dusk * 0.45}
              light={{color: '#ffe2b8', strength: 0.25 * (1 - dusk), from: 'front'}}
              rim={{color: dusk > 0.5 ? '#ff9a5a' : '#ffffff', strength: 0.3, from: 'back'}}
              groundShadow={0.3}
            />
          }
        />
      ) : null}

      {inInsert && (
        <AbsoluteFill style={{opacity: insertFade, background: 'radial-gradient(ellipse at 50% 40%, #1d2c50 0%, #080c18 75%)'}}>
          <LaptopFront width={1180} canvas={1000} top={ramp(frame, [0, shotB], [430, 400])} tilt={6}>
            <ApplyDashboard t={t} frame={frame} />
          </LaptopFront>
        </AbsoluteFill>
      )}

      <TitleStack
        lines={[
          {text: "THINGS DIDN'T", at: titleAt},
          {text: 'GO AS PLANNED.', at: titleAt + 8, color: palette.orange},
        ]}
        out={Math.min(D - 10, exitEnd)}
        centerY={480}
        style="slam"
        size={150}
      />

      {/* sound */}
      <Sfx name="typing" at={0} duration={shotB} volume={0.35} fadeOut={10} loop />
      {noteFrames.map((f, i) => (
        <Sfx key={i} name="notification" at={f} volume={i === 3 ? 0.55 : 0.4} />
      ))}
      {[0.08, 0.3, 0.52, 0.74].map((k, i) => (
        <Sfx key={`s${i}`} name="send" at={Math.round(lerp(j1.start, shotB, k))} volume={0.3} />
      ))}
      <Sfx name="whoosh" at={shotB - 10} volume={0.4} />
      <Ambience name="city-night" at={shotB - 6} duration={D} volume={0.3} />
      <Sfx name="door-open" at={walkInStart + 18} volume={0.5} />
      <Sfx name="door-open" at={walkInEnd} volume={0.35} />
      <Sfx name="impact" at={titleAt} volume={0.55} />
      <Sfx name="door-open" at={exitStart - 12} volume={0.45} />
      <Sfx name="door-close" at={exitStart + 32} volume={0.9} />
      <Sfx name="atmosphere" at={j2.start} duration={D - j2.start} volume={0.3} fadeIn={30} fadeOut={20} loop />
      <Sfx name="hit" at={exitEnd - 8} volume={0.3} />
    </AbsoluteFill>
  );
};
