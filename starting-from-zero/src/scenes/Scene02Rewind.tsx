/**
 * SCENE 02 — REWIND
 * The present freezes. The laptop interface plays backwards, the camera
 * rips backwards out of the room and calendar pages fly back onto the pad.
 */
import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {Apartment, APT} from '../sets/Apartment';
import {Character, expressions, poses} from '../components/Character';
import {camOn, mixCam} from '../components/Background';
import {APT_CLOSE} from './Scene01Present';
import {LaptopFront} from '../components/Laptop';
import {Browser, JobBoard} from '../components/ScreenUI';
import {TitleStack} from '../components/Typography';
import {Sfx} from '../components/Sound';
import {palette} from '../theme/palette';
import {lighting} from '../theme/lighting';
import {fonts} from '../theme/typography';
import {clamp, ease, ramp} from '../lib/anim';

const MONTHS = ['NOV', 'OCT', 'SEP', 'AUG', 'JUL', 'JUN', 'MAY', 'APR', 'MAR', 'FEB', 'JAN', 'DEC', 'NOV', 'OCT', 'SEP', 'AUG', 'JUL', 'JUN', 'MAY', 'APR'];

const VHS: React.FC<{intensity: number}> = ({intensity}) => {
  const frame = useCurrentFrame();
  const bandY = (frame * 37) % 1920;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: intensity}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: bandY, height: 70, background: 'rgba(255,255,255,0.08)', filter: 'blur(4px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: (bandY + 700) % 1920, height: 14, background: 'rgba(140,200,255,0.18)'}} />
    </AbsoluteFill>
  );
};

const Calendar: React.FC<{start: number; end: number}> = ({start, end}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  // pages per second accelerates over time
  const local = frame - start;
  const span = end - start;
  const pageFloat = Math.pow(local / span, 1.8) * (MONTHS.length - 1);
  const top = Math.min(MONTHS.length - 1, Math.floor(pageFloat));
  const flyP = pageFloat - top;
  const appear = ramp(local, [0, 10], [0, 1], ease.out);
  const leave = ramp(frame, [end, end + 10], [0, 1], ease.in);
  const Page: React.FC<{i: number; style?: React.CSSProperties}> = ({i, style}) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: palette.white,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        ...style,
      }}
    >
      <div style={{height: 110, background: palette.orange, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: fonts.body, fontWeight: 800, fontSize: 54, letterSpacing: 14, color: '#fff'}}>{MONTHS[i]}</div>
      </div>
      <div style={{fontFamily: fonts.display, fontSize: 260, color: palette.navy800, textAlign: 'center', lineHeight: 1.15}}>{String(((i * 7) % 27) + 1).padStart(2, '0')}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: appear * (1 - leave), perspective: 1400}}>
      <div
        style={{
          position: 'absolute',
          left: 540 - 190,
          top: 690,
          width: 380,
          height: 460,
          transform: `rotateX(10deg) rotateZ(-4deg) scale(${0.85 + 0.15 * appear + leave * 0.3})`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: 'translate(10px, 12px)', background: '#cfc6b6', borderRadius: 18}} />
        <Page i={top} />
        {/* the next page flying back onto the pad (reverse tear-off) */}
        {top < MONTHS.length - 1 && (
          <Page
            i={top + 1}
            style={{
              transformOrigin: '50% 0%',
              transform: `translate(${(1 - flyP) * -260}px, ${(1 - flyP) * 520}px) rotate(${(1 - flyP) * -28}deg)`,
              opacity: clamp(flyP * 3),
              filter: flyP < 0.8 ? `blur(${(1 - flyP) * 6}px)` : undefined,
            }}
          />
        )}
        {/* binding */}
        <div style={{position: 'absolute', left: 30, right: 30, top: -14, height: 28, display: 'flex', justifyContent: 'space-between'}}>
          {Array.from({length: 8}, (_, k) => (
            <div key={k} style={{width: 12, height: 28, borderRadius: 6, background: '#2b3142'}} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene02Rewind: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  // Short, punchy rewind (no narration): freeze → UI reverses → camera rips back.
  const freezeEnd = 4;
  const insertStart = 4;
  const insertEnd = 18;
  const pullStart = insertEnd;
  const pullEnd = Math.max(pullStart + 30, D - 10);
  const titleAt = pullStart + 6;

  // Camera rips backwards with a twist
  const pull = ramp(frame, [pullStart, pullEnd], [0, 1], ease.inOut);
  const wide = {...camOn({x: 540, y: 900}, 0.62), rot: 0};
  const close = {...APT_CLOSE, rot: -7};
  const cam = mixCam(close, wide, pull);
  const speed = Math.sin(pull * Math.PI);

  const character = (
    <Character
      x={APT.seat.x}
      y={0}
      pose={poses.sit({lean: 4, headPitch: 2, armNear: [22, 70], armFar: [18, 74], headTurn: 0.55})}
      expression={expressions.wry}
      lookX={0}
      {...lighting.apartmentNight}
      groundShadow={0}
    />
  );

  // Reversing laptop interface
  const rev = ramp(frame, [insertStart, insertEnd], [0, 1], ease.in);
  const statuses = Array.from({length: 6}, (_, i) => {
    const k = rev * 12 - i;
    return k > 1.4 ? ('none' as const) : k > 0.5 ? ('applied' as const) : i % 2 ? ('pending' as const) : ('rejected' as const);
  });
  const inInsert = frame >= insertStart && frame < insertEnd;

  const tc = Math.max(0, 14 * 3600 - Math.pow(frame / Math.max(1, D), 1.6) * 3600 * 24 * 400);
  const hh = Math.floor(tc / 3600) % 100;
  const mm = Math.floor(tc / 60) % 60;
  const ss = Math.floor(tc) % 60;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: speed > 0.05 ? `blur(${speed * 7}px)` : undefined}}>
        <Freeze frame={0}>
          <Apartment cam={cam} lid={1} glow={1} freeze={0.85} character={character} calendar={{month: 'NOV', day: '14'}} />
        </Freeze>
      </AbsoluteFill>

      {inInsert && (
        <AbsoluteFill style={{background: '#070b16'}}>
          <LaptopFront width={1130} canvas={900} top={400} tilt={5} style={{filter: 'saturate(0.4) hue-rotate(-12deg)', transform: `translateX(${Math.sin(frame * 2.3) * 6}px)`}}>
            <Browser tabs={['Jobs in UAE', 'Inbox (0)', 'launch-plan'].slice(0, Math.max(1, 3 - Math.floor(rev * 3)))} active={0} url="jobs.example.com/my-applications">
              <JobBoard statuses={statuses} scroll={(1 - rev) * 40} />
            </Browser>
          </LaptopFront>
        </AbsoluteFill>
      )}

      <Calendar start={pullStart} end={pullEnd - 2} />

      {/* freeze flash */}
      <AbsoluteFill style={{background: '#dfe8ff', opacity: ramp(frame, [0, 6], [0.55, 0]), mixBlendMode: 'screen', pointerEvents: 'none'}} />
      <VHS intensity={frame < freezeEnd ? 0.5 : 0.9} />

      {/* rewind HUD */}
      <AbsoluteFill style={{pointerEvents: 'none', fontFamily: fonts.body, color: '#f2f6ff'}}>
        <div style={{position: 'absolute', left: 90, top: 290, fontSize: 46, fontWeight: 800, letterSpacing: 6, opacity: Math.floor(frame / 8) % 2 ? 1 : 0.55}}>
          {frame < freezeEnd ? '❚❚  PAUSE' : '◀◀  REWIND'}
        </div>
        <div style={{position: 'absolute', right: 120, top: 300, fontSize: 30, fontWeight: 700, letterSpacing: 4, opacity: 0.85, fontVariantNumeric: 'tabular-nums'}}>
          {`-${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}
        </div>
      </AbsoluteFill>

      <TitleStack lines={[{text: "LET'S GO BACK.", at: titleAt, color: palette.white}]} out={D + 20} centerY={560} style="track" size={170} />

      {/* sound */}
      <Sfx name="hit" at={0} volume={0.6} />
      <Sfx name="rewind" at={6} volume={0.75} />
      {Array.from({length: 7}, (_, k) => (
        <Sfx key={k} name="page-flip" at={pullStart + 6 + Math.round(Math.pow(k / 7, 0.6) * (pullEnd - pullStart - 12))} volume={0.35} />
      ))}
      <Sfx name="riser" at={0} duration={D} volume={0.35} fadeOut={6} />
      <Sfx name="impact" at={titleAt} volume={0.6} />
      <Sfx name="whoosh" at={Math.max(0, D - 14)} volume={0.6} />
    </AbsoluteFill>
  );
};

