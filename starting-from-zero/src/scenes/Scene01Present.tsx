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
import {lighting} from '../theme/lighting';
import {ease, keys, ramp} from '../lib/anim';

/** Face position on stage while seated in the apartment. */
export const APT_FACE = APT.toStage(-44, -236);
export const APT_CLOSE = camOn(APT_FACE, 3.0, {x: 560, y: 760});

export const Scene01Present: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const p1 = cue(scene, 'p1');
  const p2 = cue(scene, 'p2');
  const p3 = cue(scene, 'p3');
  const p3len = p3.end - p3.start;

  // p3: "work isn't settled, / income isn't guaranteed, / and I'm trying to build something of my own."
  const insertIn = p3.start + 4;
  const insertOut = Math.round(p3.start + p3len * 0.74);
  const tab1At = Math.round(p3.start + p3len * 0.36);
  const tab2At = Math.round(p3.start + p3len * 0.58);
  const inInsert = frame >= insertIn && frame < insertOut;

  // Camera: slow handheld drift on the wide → push in → (insert) → close-up
  const wideA = {...camOn({x: 560, y: 900}, 1.16), y: -150, shake: 1.5};
  const wideB = {...camOn({x: 540, y: 980}, 1.0), shake: 1.5};
  const push = {...camOn(APT_FACE, 2.0, {x: 540, y: 820}), shake: 0.6};
  let cam = mixCam(wideA, wideB, ramp(frame, [0, p2.start], [0, 1], ease.camera));
  cam = mixCam(cam, push, ramp(frame, [p2.start, insertIn], [0, 1], ease.camera));
  if (frame >= insertOut) {
    cam = mixCam(camOn(APT_FACE, 2.5, {x: 560, y: 780}), APT_CLOSE, ramp(frame, [insertOut, D], [0, 1], ease.soft));
  }

  // Character performance: typing → stops, sits back → turns to camera
  const typing = poses.sitTyping(frame, 0.5);
  const rest = poses.sit({lean: 4, headPitch: 6, armNear: [22, 70], armFar: [18, 74]});
  const stopTyping = ramp(frame, [p2.start, p2.start + 24], [0, 1]);
  let pose = blendPose(typing, rest, stopTyping);
  const turn = ramp(frame, [insertOut + 2, insertOut + 22], [0, 0.55], ease.inOut);
  pose = {...pose, headTurn: turn, headPitch: pose.headPitch - turn * 8};
  const expr = mixExpression(
    mixExpression(expressions.focused, expressions.tired, stopTyping),
    expressions.determined,
    ramp(frame, [insertOut + 8, insertOut + 26], [0, 1]),
  );

  const character = (
    <Character
      x={APT.seat.x}
      y={0}
      pose={pose}
      expression={expr}
      lookX={turn > 0.3 ? 0 : 0.6}
      {...lighting.apartmentNight}
      groundShadow={0}
    />
  );

  // Laptop insert content
  const tab = frame < tab1At ? 0 : frame < tab2At ? 1 : 2;
  const rejections = Math.floor(ramp(frame, [insertIn, tab1At], [0, 5], ease.soft));
  const statuses = (['rejected', 'pending', 'rejected', 'pending', 'rejected', 'pending'] as const).map((s, i) =>
    i < rejections ? s : 'applied',
  );
  const insertP = ramp(frame, [insertIn, insertIn + 10], [0, 1], ease.out);
  const insertOutP = ramp(frame, [insertOut - 6, insertOut], [0, 1], ease.in);

  return (
    <AbsoluteFill>
      <Apartment cam={cam} lid={1} glow={1} lamp={0} character={character} />

      {inInsert && (
        <AbsoluteFill style={{opacity: Math.min(insertP, 1 - insertOutP)}}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #18264a 0%, #070b16 70%)'}} />
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
            style={{transform: `scale(${1.04 + 0.05 * ramp(frame, [insertIn, insertOut], [0, 1])})`}}
          >
            <Browser
              tabs={['Jobs in UAE', 'Inbox (0)', 'launch-plan']}
              active={tab}
              url={['jobs.example.com/my-applications', 'mail.example.com/inbox', 'docs.example.com/my-business/launch-plan'][tab]}
            >
              {tab === 0 && <JobBoard statuses={[...statuses]} highlight={Math.max(0, rejections - 1)} />}
              {tab === 1 && <EmptyInbox refresh={ramp(frame, [tab1At, tab1At + 24], [0, 1], ease.inOut)} />}
              {tab === 2 && <ProjectBoard progress={ramp(frame, [tab2At, tab2At + 30], [0.04, 0.12], ease.out)} />}
            </Browser>
          </LaptopFront>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,10,22,0) 60%, rgba(5,10,22,0.85) 100%)'}} />
        </AbsoluteFill>
      )}

      {/* Cold open: lands in the first 1.3 seconds */}
      <TitleStack
        lines={[
          {text: 'NO JOB.', at: 2},
          {text: 'NO GUARANTEES.', at: 16},
          {text: 'ONE MORE TRY.', at: 30, color: palette.orange},
        ]}
        out={p1.start + 6}
        centerY={600}
        size={156}
      />
      <LocationStamp text="DUBAI, UAE · 2:14 AM" at={p1.start + 14} out={p2.end} />

      {/* Sound design */}
      <Ambience name="room-tone" duration={D} volume={0.35} />
      <Ambience name="city-night" duration={D} volume={0.22} />
      <Sfx name="atmosphere" at={0} duration={D} volume={0.35} fadeIn={20} fadeOut={20} loop />
      <Sfx name="impact" at={2} volume={0.75} />
      <Sfx name="impact" at={16} volume={0.8} />
      <Sfx name="impact" at={30} volume={1} />
      <Sfx name="typing" at={0} duration={p2.start + 20} volume={0.22} fadeOut={15} loop />
      <Sfx name="whoosh" at={insertIn - 6} volume={0.5} />
      <Sfx name="hit" at={tab1At - 2} volume={0.35} />
      <Sfx name="hit" at={tab2At - 2} volume={0.35} />
      <Sfx name="whoosh" at={insertOut - 6} volume={0.4} />
    </AbsoluteFill>
  );
};
