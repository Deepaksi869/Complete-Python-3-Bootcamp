/**
 * CAPTIONS — word-by-word highlighted subtitles generated from the script
 * and the measured narration timing. Large, high-contrast and kept inside
 * Instagram's safe area (above the bottom UI, away from the right buttons).
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {Timeline} from '../lib/types';
import {palette} from '../theme/palette';
import {fonts} from '../theme/typography';
import {ANCHORS} from '../theme/layout';
import {ease, ramp} from '../lib/anim';

export const Captions: React.FC<{timeline: Timeline}> = ({timeline}) => {
  const frame = useCurrentFrame();
  const chunk = timeline.captions.find((c) => frame >= c.start && frame < c.end);
  if (!chunk) return null;
  const local = frame - chunk.start;
  const pop = ramp(local, [0, 6], [0, 1], ease.out);
  const out = ramp(frame, [chunk.end - 4, chunk.end], [1, 0]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 100,
          right: 100,
          bottom: 1920 - ANCHORS.captionBottomY,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontWeight: 800,
            fontSize: 60,
            lineHeight: 1.16,
            textAlign: 'center',
            color: palette.white,
            opacity: Math.min(pop, out),
            transform: `translateY(${(1 - pop) * 14}px) scale(${0.96 + 0.04 * pop})`,
            textShadow: '0 3px 0 rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.65), 0 0 6px rgba(0,0,0,0.8)',
            maxWidth: 880,
            padding: '10px 26px 14px',
            borderRadius: 22,
            background: 'rgba(5,8,20,0.32)',
          }}
        >
          {chunk.words.map((w, i) => {
            const active = frame >= w.start && frame < w.end + 2;
            const spoken = frame >= w.start;
            return (
              <span
                key={i}
                style={{
                  color: active ? palette.orange : spoken ? palette.white : 'rgba(246,241,232,0.78)',
                  display: 'inline-block',
                  transform: active ? 'scale(1.06)' : undefined,
                  marginRight: i < chunk.words.length - 1 ? '0.26em' : 0,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
