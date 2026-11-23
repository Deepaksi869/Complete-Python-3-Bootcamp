/**
 * SCENE 07 — THE BEGINNING
 * Sunrise over Dubai from a rooftop. He raises his phone to document the
 * journey, turns to camera, and the series title lands.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../lib/types';
import {cue} from '../lib/timeline';
import {ROOF, Rooftop} from '../sets/Rooftop';
import {Character, blendPose, expressions, mixExpression, poses} from '../components/Character';
import {camOn, mixCam, SunGlint, LightLeak} from '../components/Background';
import {EndTitle} from '../components/Typography';
import {FadeOut} from '../components/Transitions';
import {Ambience, Sfx} from '../components/Sound';
import {ease, ramp} from '../lib/anim';

const SCALE = 1.55;
const X = 400;

export const Scene07Finale: React.FC<SceneProps> = ({scene, episode}) => {
  const frame = useCurrentFrame();
  const D = scene.durationInFrames;
  const f3 = cue(scene, 'f3');
  const f4 = cue(scene, 'f4');
  const f5 = cue(scene, 'f5');

  const raise = ramp(frame, [f3.start - 12, f3.start + 12], [0, 1], ease.inOut) * (1 - ramp(frame, [f4.start - 16, f4.start + 4], [0, 1], ease.inOut));
  let pose = blendPose(poses.standWindow({headPitch: -4}), poses.standRecord(), raise);
  const turn = ramp(frame, [f4.start + 2, f4.start + 26], [0, 0.62], ease.inOut);
  pose = {...pose, headTurn: turn, headPitch: pose.headPitch + turn * 4};
  const expr = mixExpression(
    mixExpression(expressions.neutral, expressions.determined, raise),
    expressions.smile,
    ramp(frame, [f4.start + 10, f4.start + 34], [0, 1]),
  );

  const face = {x: X, y: ROOF.floorY - 330 * SCALE};
  const close = camOn(face, 1.75, {x: 430, y: 980});
  const wide = camOn({x: X + 120, y: ROOF.floorY - 330}, 0.98, {x: 540, y: 1280});
  const wider = camOn({x: X + 120, y: ROOF.floorY - 360}, 0.88, {x: 540, y: 1320});
  let cam = mixCam(close, wide, ramp(frame, [0, f4.start], [0, 1], ease.camera));
  cam = mixCam(cam, wider, ramp(frame, [f4.start, D], [0, 1], ease.soft));

  const sun = ramp(frame, [0, D], [0.15, 1], ease.soft);

  return (
    <AbsoluteFill>
      <Rooftop
        cam={cam}
        sun={sun}
        character={
          <Character
            x={X}
            y={ROOF.floorY}
            scale={SCALE}
            pose={pose}
            expression={expr}
            holding={raise > 0.2 ? 'phone' : 'none'}
            phoneGlow={raise}
            phoneRecording
            lookX={turn > 0.3 ? 0 : 0.5}
            lookY={turn > 0.3 ? 0 : -0.3}
            shade={0.35}
            light={{color: '#ffb27a', strength: 0.45, from: 'front'}}
            rim={{color: '#ffd29a', strength: 0.5, from: 'front'}}
            groundShadow={0.25}
          />
        }
      />
      <SunGlint x={760} y={1000 - sun * 200} intensity={0.45 + sun * 0.25} />
      <LightLeak progress={ramp(frame, [f4.start - 20, D], [0, 1])} opacity={0.3} />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          opacity: ramp(frame, [f4.start - 10, f4.start + 20], [0, 1]),
          background: 'linear-gradient(180deg, rgba(8,12,30,0.7) 0%, rgba(8,12,30,0.55) 40%, rgba(8,12,30,0) 62%)',
        }}
      />
      <EndTitle
        title={episode.seriesTitle}
        subtitle={episode.endSubtitle}
        episodeLabel={`EPISODE ${String(episode.episodeNumber).padStart(2, '0')}`}
        titleAt={f4.start}
        episodeAt={f5.start + 2}
        subtitleAt={Math.min(D - 70, f5.end + 10)}
        centerY={560}
      />
      <FadeOut duration={26} total={D} />
      <Ambience name="dawn" duration={D} volume={0.45} />
      <Sfx name="atmosphere" at={0} duration={D} volume={0.4} fadeIn={30} fadeOut={40} loop />
      <Sfx name="phone-buzz" at={f3.start} volume={0.15} />
      <Sfx name="riser" at={Math.max(0, f4.start - 80)} volume={0.3} />
      <Sfx name="ending" at={f4.start} volume={0.8} />
      <Sfx name="shimmer" at={f5.start} volume={0.4} />
      <Sfx name="hit" at={Math.min(D - 70, f5.end + 10)} volume={0.25} />
      <Sfx name="ending" at={Math.max(0, D - 60)} volume={0.35} />
    </AbsoluteFill>
  );
};
