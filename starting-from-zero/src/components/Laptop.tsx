/**
 * LAPTOP — profile view (sits on a desk next to the character) and
 * front "insert" view (fills the frame, shows a live screen UI).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {palette} from '../theme/palette';

/**
 * Laptop in profile. The screen faces LEFT (towards a character sitting on
 * the left, facing right). `lid` 0 = closed, 1 = open.
 */
export const LaptopSide: React.FC<{
  x: number;
  y: number;
  lid?: number;
  glow?: number;
  glowColor?: string;
  scale?: number;
  /** Draw the light cone towards the user. */
  cone?: boolean;
}> = ({x, y, lid = 1, glow = 1, glowColor = palette.blueSoft, scale = 1, cone = true}) => {
  const L = 118;
  const theta = (lid * 104 * Math.PI) / 180;
  const hinge = {x: x + 132, y: y - 8};
  const end = {x: hinge.x - Math.cos(theta) * L, y: hinge.y - Math.sin(theta) * L};
  const nx = Math.sin(theta);
  const ny = -Math.cos(theta);
  // screen face normal points to the left/up when open
  const face = {x: -nx, y: -ny};
  const mid = {x: (hinge.x + end.x) / 2, y: (hinge.y + end.y) / 2};
  const id = `lap-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={scale !== 1 ? `translate(${x},${y}) scale(${scale}) translate(${-x},${-y})` : undefined}>
      {cone && glow > 0 && lid > 0.3 && (
        <g style={{mixBlendMode: 'screen'}} opacity={glow * Math.min(1, (lid - 0.3) * 2)}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={mid.x} y1={mid.y} x2={mid.x + face.x * 360} y2={mid.y + face.y * 360}>
              <stop offset="0" stopColor={glowColor} stopOpacity={0.2} />
              <stop offset="1" stopColor={glowColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`${hinge.x},${hinge.y} ${end.x},${end.y} ${end.x + face.x * 380 - 40},${end.y + face.y * 380 - 160} ${hinge.x + face.x * 380 - 40},${hinge.y + face.y * 380 + 120}`}
            fill={`url(#${id})`}
          />
        </g>
      )}
      {/* base */}
      <path d={`M${x},${y} L${x + 140},${y} L${x + 138},${y - 9} L${x + 4},${y - 9}Z`} fill="#8e96a8" />
      <rect x={x + 4} y={y - 2} width={134} height={2} fill="#5c6375" />
      {/* lid */}
      <line x1={hinge.x} y1={hinge.y} x2={end.x} y2={end.y} stroke="#a5adbd" strokeWidth={7} strokeLinecap="round" />
      {glow > 0 && lid > 0.3 && (
        <line
          x1={hinge.x + face.x * 3}
          y1={hinge.y + face.y * 3}
          x2={end.x + face.x * 3}
          y2={end.y + face.y * 3}
          stroke={glowColor}
          strokeWidth={3}
          opacity={glow}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

/** Front-facing laptop that fills the frame. Children = screen content (1280 x 800 canvas). */
export const LaptopFront: React.FC<{
  children: React.ReactNode;
  width?: number;
  top?: number;
  tilt?: number;
  glow?: number;
  style?: React.CSSProperties;
  /** Width of the UI canvas (height is canvas * 0.625). Smaller = bigger UI. */
  canvas?: number;
}> = ({children, width = 980, top = 560, tilt = 6, glow = 1, style, canvas = 1280}) => {
  const screenW = width - 44;
  const screenH = screenW * (800 / 1280);
  const scale = screenW / canvas;
  return (
    <AbsoluteFill style={{perspective: 1600, ...style}}>
      <div
        style={{
          position: 'absolute',
          left: (1080 - width) / 2,
          top,
          width,
          transform: `rotateX(${tilt}deg)`,
          transformOrigin: '50% 100%',
        }}
      >
        <div
          style={{
            background: '#0d1018',
            borderRadius: 26,
            padding: 22,
            boxShadow: `0 0 ${120 * glow}px rgba(110,160,255,${0.35 * glow}), 0 40px 80px rgba(0,0,0,0.6)`,
            border: '2px solid #2a3042',
          }}
        >
          <div style={{width: screenW, height: screenH, overflow: 'hidden', borderRadius: 6, position: 'relative', background: '#0b1220'}}>
            <div style={{width: canvas, height: canvas * 0.625, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute'}}>{children}</div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(125deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            margin: '0 auto',
            width: width + 80,
            marginLeft: -40,
            height: 26,
            background: 'linear-gradient(180deg, #a9b0bf 0%, #6c7385 100%)',
            borderRadius: '0 0 30px 30px',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
