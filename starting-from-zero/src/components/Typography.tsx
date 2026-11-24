/**
 * KINETIC TYPOGRAPHY — the big statements, location stamps and end title.
 * Placed in the upper-middle of the frame, clear of captions and IG UI.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {palette} from '../theme/palette';
import {fonts} from '../theme/typography';
import {ANCHORS} from '../theme/layout';
import {clamp, ease, ramp} from '../lib/anim';

export type TitleLine = {
  text: string;
  /** Frame (scene-relative) the line lands. */
  at: number;
  color?: string;
  size?: number;
};

type Style = 'slam' | 'rise' | 'track';

const lineAnim = (frame: number, at: number, out: number, style: Style) => {
  const f = frame - at;
  const inP = ramp(f, [0, style === 'slam' ? 9 : 16], [0, 1], ease.out);
  const outP = ramp(frame, [out, out + 12], [0, 1], ease.in);
  const scale = style === 'slam' ? 1.28 - 0.28 * inP : 1;
  const blur = style === 'slam' ? (1 - inP) * 14 + outP * 12 : outP * 10;
  const y = style === 'rise' ? (1 - inP) * 70 : 0;
  const tracking = style === 'track' ? 40 * (1 - inP) : 0;
  return {opacity: Math.min(inP, 1 - outP), scale, blur, y: y - outP * 30, tracking, visible: f >= 0};
};

/** Stack of short statements that land one after another. */
export const TitleStack: React.FC<{
  lines: TitleLine[];
  out: number;
  centerY?: number;
  style?: Style;
  align?: 'center' | 'left';
  size?: number;
  shadow?: boolean;
}> = ({lines, out, centerY = ANCHORS.headlineCenterY, style = 'slam', align = 'center', size = 150, shadow = true}) => {
  const frame = useCurrentFrame();
  const first = Math.min(...lines.map((l) => l.at));
  const scrim = ramp(frame, [first - 4, first + 8], [0, 1]) * ramp(frame, [out, out + 12], [1, 0]);
  const blockH = lines.reduce((a, l) => a + (l.size ?? size) * 0.95, 0);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* soft dark scrim so titles stay readable over any background */}
      {shadow && scrim > 0 && (
        <div
          style={{
            position: 'absolute',
            left: -100,
            right: -100,
            top: centerY - blockH / 2 - 160,
            height: blockH + 320,
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(5,8,20,0.55) 0%, rgba(5,8,20,0.25) 55%, rgba(5,8,20,0) 100%)',
            opacity: scrim,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: centerY,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: align === 'center' ? 'center' : 'flex-start',
          gap: 6,
        }}
      >
        {lines.map((l, i) => {
          const a = lineAnim(frame, l.at, out, style);
          if (!a.visible) return <div key={i} style={{height: (l.size ?? size) * 0.92}} />;
          return (
            <div
              key={i}
              style={{
                fontFamily: fonts.display,
                fontSize: l.size ?? size,
                lineHeight: 0.92,
                letterSpacing: 4 + a.tracking,
                color: l.color ?? palette.white,
                opacity: a.opacity,
                transform: `translateY(${a.y}px) scale(${a.scale})`,
                filter: a.blur > 0.2 ? `blur(${a.blur}px)` : undefined,
                textShadow: shadow ? '0 8px 40px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.5)' : undefined,
                whiteSpace: 'nowrap',
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Documentary-style location / time stamp, typed on. */
export const LocationStamp: React.FC<{text: string; at?: number; out: number; y?: number; color?: string}> = ({
  text,
  at = 8,
  out,
  y = ANCHORS.stampY,
  color = palette.beigeLight,
}) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(clamp((frame - at) / 1.4, 0, text.length));
  const lineW = ramp(frame, [at - 6, at + 10], [0, 70], ease.out);
  const opacity = ramp(frame, [out, out + 12], [1, 0]);
  if (frame < at - 6) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      <div style={{position: 'absolute', left: 90, top: y, display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: lineW, height: 3, background: palette.orange}} />
        <div
          style={{
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 7,
            color,
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}
        >
          {text.slice(0, chars)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Series end title. */
export const EndTitle: React.FC<{
  title: string;
  subtitle: string;
  episodeLabel: string;
  titleAt: number;
  episodeAt: number;
  subtitleAt: number;
  centerY?: number;
}> = ({title, subtitle, episodeLabel, titleAt, episodeAt, subtitleAt, centerY = 700}) => {
  const frame = useCurrentFrame();
  const words = title.split(' ');
  const sub = ramp(frame - subtitleAt, [0, 24], [0, 1], ease.out);
  const ep = ramp(frame - episodeAt, [0, 18], [0, 1], ease.out);
  const rule = ramp(frame - titleAt, [10, 40], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: centerY, transform: 'translateY(-50%)', textAlign: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {words.map((w, i) => {
            const p = ramp(frame - titleAt - i * 6, [0, 22], [0, 1], ease.out);
            return (
              <div
                key={i}
                style={{
                  fontFamily: fonts.display,
                  fontSize: 210,
                  lineHeight: 0.86,
                  letterSpacing: 10 + (1 - p) * 30,
                  color: i === words.length - 1 ? palette.orange : palette.white,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 40}px)`,
                  filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
                  textShadow: '0 10px 50px rgba(0,0,0,0.45)',
                }}
              >
                {w}
              </div>
            );
          })}
        </div>
        <div style={{margin: '34px auto 0', width: 420 * rule, height: 3, background: palette.beigeLight, opacity: 0.8}} />
        <div
          style={{
            marginTop: 26,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: 12,
            color: palette.amber,
            textShadow: '0 2px 14px rgba(0,0,0,0.6)',
            opacity: ep,
          }}
        >
          {episodeLabel}
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.body,
            fontWeight: 500,
            fontSize: 50,
            color: palette.white,
            textShadow: '0 2px 18px rgba(0,0,0,0.7)',
            opacity: sub,
            transform: `translateY(${(1 - sub) * 16}px)`,
            fontStyle: 'italic',
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
