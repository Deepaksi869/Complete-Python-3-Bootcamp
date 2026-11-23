/**
 * PHONE — front-facing insert. Children render on a 390 x 844 screen canvas.
 */
import React from 'react';

export const PhoneFront: React.FC<{
  x: number;
  y: number;
  width?: number;
  rotate?: number;
  glow?: number;
  children: React.ReactNode;
}> = ({x, y, width = 420, rotate = 0, glow = 1, children}) => {
  const scale = (width - 28) / 390;
  const h = 844 * scale + 28;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - h / 2,
        width,
        height: h,
        borderRadius: 64 * scale,
        background: '#0b0e15',
        border: '3px solid #2b3245',
        padding: 14,
        transform: `rotate(${rotate}deg)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 ${90 * glow}px rgba(120,170,255,${0.3 * glow})`,
      }}
    >
      <div style={{position: 'relative', width: width - 28 - 6, height: h - 28 - 6, borderRadius: 52 * scale, overflow: 'hidden'}}>
        <div style={{position: 'absolute', width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: '0 0'}}>{children}</div>
        <div style={{position: 'absolute', top: 10 * scale, left: '50%', marginLeft: -60 * scale, width: 120 * scale, height: 34 * scale, borderRadius: 20 * scale, background: '#000'}} />
      </div>
    </div>
  );
};
