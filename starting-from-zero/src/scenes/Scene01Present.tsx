/**
 * SCENE 01 — THE PRESENT
 * Cold open typography → establishing shot of the dark apartment → push-in
 * → laptop insert (job tabs, empty inbox, business project) → close-up,
 * he turns towards camera.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {cue} from '../lib/timeline';
import {Apartment, APT} from '../sets/Apartment';
import {Character, expressions, mixExpression, poses, blendPose} from '../components/Character';
import {camOn, mixCam} from '../components/Background';
import {LaptopFront} from '../components/Laptop';
import {Browser, EmptyInbox, JobBoard, ProjectBoard} from '../components/ScreenUI';
import {LocationStamp, TitleStack} from '../components/Typography';
import {Ambience, Sfx} from '../components/Sound';
import {palette} from '../theme/palette';
import {ease, keys, ramp} from '../lib/anim';

/** Face position on stage while seated in the apartment. */
export const APT_FACE = APT.toStage(-44, -236);
export const APT_CLOSE = camOn(APT_FACE, 3.0, {x: 560, y: 760});

export const Scene01Present: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const p3 = cue(scene, 'p3');
  const p4 = cue(scene, 'p4');
  const p5 = cue(scene, 'p5');
  const p6 = cue(scene, 'p6');
  const p7 = cue(scene, 'p7');

  const insertIn = p4.start - 4;
  const insertOut = p7.start - 2;
  const inInsert = frame >= insertIn && frame < insertOut;

  // Camera: wide drift → push in → (insert) → close-up
  const wideA = {...camOn({x: 560, y: 900}, 1.16), y: -150};
  const wideB = camOn({x: 540, y: 980}, 1.0);
  const push = camOn(APT_FACE, 2.0, {x: 540, y: 820});
  let cam = mixCam(wideA, wideB, ramp(frame, [0, p3.start], [0, 1], ease.camera));
  cam = mixCam(cam, push, ramp(frame, [p3.start - 6, insertIn], [0, 1], ease.camera));
  if (frame >= insertOut) {
    cam = mixCam(camOn(APT_FACE, 2.6, {x: 560, y: 780}), APT_CLOSE, ramp(frame, [insertOut, D], [0, 1], ease.soft));
  }

  // Character performance
  const typing = poses.sitTyping(frame, 0.5);
  const rest = poses.sit({lean: 4, headPitch: 6, armNear: [22, 70], armFar: [18, 74]});
  const stopTyping = ramp(frame, [p3.start - 10, p3.start + 20], [0, 1]);
  let pose = blendPose(typing, rest, stopTyping);
  const turn = ramp(frame, [p7.start + 4, p7.start + 26], [0, 0.55], ease.inOut);
  pose = {...pose, headTurn: turn, headPitch: pose.headPitch - turn * 8};
  const expr = mixExpression(
    mixExpression(expressions.focused, expressions.tired, stopTyping),
    expressions.wry,
    ramp(frame, [p7.start + 10, p7.start + 30], [0, 1]),
  );

  const character = (
    <Character
      x={APT.seat.x}
      y={0}
      pose={pose}
      expression={expr}
      lookX={turn > 0.3 ? 0 : 0.6}
      shade={0.38}
      light={{color: palette.blue, strength: 0.24, from: 'front'}}
      rim={{color: '#8fb0ff', strength: 0.3, from: 'back'}}
      groundShadow={0}
    />
  );

  // Laptop insert content
  const tab = frame < p5.start - 2 ? 0 : frame < p6.start - 2 ? 1 : 2;
  const rejections = Math.floor(ramp(frame, [p4.start, p4.end + 6], [0, 5], ease.soft));
  const statuses = (['rejected', 'pending', 'rejected', 'pending', 'rejected', 'pending'] as const).map((s, i) =>
    i < rejections ? s : 'applied',
  );
  const insertP = ramp(frame, [insertIn, insertIn + 12], [0, 1], ease.out);
  const insertOutP = ramp(frame, [insertOut - 8, insertOut], [0, 1], ease.in);

  return (
    <AbsoluteFill>
      <Apartment cam={cam} lid={1} glow={1} lamp={0} character={character} />

      {inInsert && (
        <AbsoluteFill style={{opacity: Math.min(insertP, 1 - insertOutP)}}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #18264a 0%, #070b16 70%)'}} />
          {/* bokeh city lights behind the screen */}
          {Array.from({length: 14}, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: (i * 173) % 1080,
                top: 180 + ((i * 97) % 300),
                width: 40 + (i % 4) * 22,
                height: 40 + (i % 4) * 22,
                borderRadius: '50%',
                background: i % 3 === 0 ? 'rgba(255,170,90,0.18)' : 'rgba(127,180,255,0.14)',
                filter: 'blur(6px)',
              }}
            />
          ))}
          <LaptopFront
            width={1130}
            canvas={900}
            top={keys(frame, [insertIn, insertOut], [430, 400], ease.soft)}
            tilt={keys(frame, [insertIn, insertOut], [9, 5])}
            style={{transform: `scale(${1.04 + 0.04 * ramp(frame, [insertIn, insertOut], [0, 1])})`}}
          >
            <Browser
              tabs={['Jobs in UAE', 'Inbox (0)', 'launch-plan']}
              active={tab}
              url={['jobs.example.com/my-applications', 'mail.example.com/inbox', 'docs.example.com/my-business/launch-plan'][tab]}
            >
              {tab === 0 && <JobBoard statuses={[...statuses]} highlight={Math.max(0, rejections - 1)} />}
              {tab === 1 && <EmptyInbox refresh={ramp(frame, [p5.start, p5.start + 30], [0, 1], ease.inOut)} />}
              {tab === 2 && <ProjectBoard progress={ramp(frame, [p6.start, p6.start + 40], [0.04, 0.12], ease.out)} />}
            </Browser>
          </LaptopFront>
          {/* reflection of his silhouette in the glossy screen */}
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,10,22,0) 60%, rgba(5,10,22,0.85) 100%)'}} />
        </AbsoluteFill>
      )}

      {/* Cold open */}
      <TitleStack
        lines={[
          {text: 'NO JOB.', at: 6},
          {text: 'NO GUARANTEES.', at: 30},
          {text: 'ONE MORE TRY.', at: 56, color: palette.orange},
        ]}
        out={Math.min(scene.cues.p1.start - 6, 92)}
        centerY={600}
        size={156}
      />
      <LocationStamp text="DUBAI, UAE · 2:14 AM" at={Math.min(scene.cues.p1.start, 96)} out={p3.start} />

      {/* Sound design */}
      <Ambience name="room-tone" duration={D} volume={0.35} />
      <Ambience name="city-night" duration={D} volume={0.22} />
      <Sfx name="atmosphere" at={0} duration={D} volume={0.35} fadeIn={30} fadeOut={30} loop />
      <Sfx name="impact" at={6} volume={0.75} />
      <Sfx name="impact" at={30} volume={0.8} />
      <Sfx name="impact" at={56} volume={1} />
      <Sfx name="typing" at={0} duration={p3.start} volume={0.22} fadeOut={15} loop />
      <Sfx name="whoosh" at={insertIn - 6} volume={0.5} />
      <Sfx name="hit" at={p5.start - 2} volume={0.35} />
      <Sfx name="hit" at={p6.start - 2} volume={0.35} />
      <Sfx name="notification" at={p6.start + 20} volume={0.25} />
      <Sfx name="whoosh" at={insertOut - 6} volume={0.4} />
    </AbsoluteFill>
  );
};
