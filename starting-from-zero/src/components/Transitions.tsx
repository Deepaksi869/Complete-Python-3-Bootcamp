/**
 * TRANSITIONS — how a scene enters. The previous scene keeps playing
 * underneath for the overlap, so every transition is a true blend.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {TransitionKind} from '../lib/types';
import {ease, ramp} from '../lib/anim';

export const transitionNeedsOverlap = (kind?: TransitionKind) => kind === 'crossfade' || kind === 'whip' || kind === 'fadeBlack';

export const SceneEnter: React.FC<{kind?: TransitionKind; duration?: number; children: React.ReactNode}> = ({
  kind = 'cut',
  duration = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  if (kind === 'cut' || duration <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;

  if (kind === 'crossfade') {
    return <AbsoluteFill style={{opacity: ramp(frame, [0, duration], [0, 1], ease.inOut)}}>{children}</AbsoluteFill>;
  }

  if (kind === 'fadeBlack') {
    const half = duration / 2;
    const toBlack = ramp(frame, [0, half], [0, 1], ease.inOut);
    const fromBlack = ramp(frame, [half, duration], [1, 0], ease.inOut);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{opacity: frame >= half ? 1 : 0}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: '#000', opacity: frame < half ? toBlack : fromBlack}} />
      </AbsoluteFill>
    );
  }

  if (kind === 'flash') {
    const flash = ramp(frame, [0, duration], [1, 0], ease.out);
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#fff6e8', opacity: flash, mixBlendMode: 'screen'}} />
      </AbsoluteFill>
    );
  }

  // whip pan: new scene slides in fast with directional blur
  const p = ramp(frame, [0, duration], [0, 1], ease.inOut);
  const x = (1 - p) * 1180;
  const blur = Math.sin(p * Math.PI) * 26;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>{children}</AbsoluteFill>
  );
};

/** Fade a scene out to black over its last frames. */
export const FadeOut: React.FC<{duration: number; total: number; color?: string}> = ({duration, total, color = '#000'}) => {
  const frame = useCurrentFrame();
  const o = ramp(frame, [total - duration, total], [0, 1], ease.inOut);
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};
