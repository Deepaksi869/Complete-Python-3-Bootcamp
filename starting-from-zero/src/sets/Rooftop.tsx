/**
 * SET: ROOFTOP AT SUNRISE (Dubai).
 * Layered skyline in morning haze, the sun rising, a glass balustrade.
 */
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {Cam, Camera, Glow, Haze, Layer, Sky, Skyline, Stage} from '../components/Background';
import {RooftopUnits} from '../components/Props';
import {palette, skies} from '../theme/palette';
import {lerp} from '../lib/anim';

export const ROOF = {floorY: 1560};

export const Rooftop: React.FC<{cam: Cam; sun: number; character?: React.ReactNode}> = ({cam, sun, character}) => {
  const frame = useCurrentFrame();
  const sunY = lerp(1260, 930, sun);
  return (
    <Camera cam={cam} background={palette.navy900}>
      <Layer depth={0.03}>
        <Stage>
          <Sky id="rt-sky" stops={skies.sunrise} top={-500} bottom={1400} />
          <Glow id="rt-sun-glow" cx={760} cy={sunY} r={760} color="#ffb070" opacity={0.75} />
          <circle cx={760} cy={sunY} r={74} fill="#ffe9c4" />
          {/* thin cloud strata */}
          {[0, 1, 2, 3].map((k) => (
            <ellipse
              key={k}
              cx={300 + k * 260 + Math.sin(frame / 200 + k) * 20}
              cy={600 + k * 70}
              rx={340}
              ry={10}
              fill="#ffc796"
              opacity={0.28}
            />
          ))}
        </Stage>
      </Layer>
      <Layer depth={0.08}>
        <Stage>
          <Haze id="rt-haze1" y={1120} height={360} color="#ffbe8a" opacity={0.6} />
          <Skyline seed="rt-far" baseY={1240} layer={0} scale={0.8} superX={470} maxH={420} time="sunrise" lights={0.25} />
        </Stage>
      </Layer>
      <Layer depth={0.18}>
        <Stage>
          <Haze id="rt-haze2" y={1260} height={240} color="#e7a27e" opacity={0.5} />
          <Skyline seed="rt-mid" baseY={1360} layer={1} scale={1} maxH={380} time="sunrise" lights={0.15} />
        </Stage>
      </Layer>
      <Layer depth={0.25}>
        <Stage>
          {/* a small flock crossing the sun */}
          {Array.from({length: 6}, (_, k) => {
            const bx = -200 + frame * 1.6 + random(`bx${k}`) * 160;
            const by = 820 + random(`by${k}`) * 120 - frame * 0.25;
            const flap = Math.sin(frame / 5 + k * 1.7) * 7;
            return <path key={k} d={`M${bx},${by} q9,${-5 - flap} 18,0 q9,${-5 - flap} 18,0`} stroke="#2a2540" strokeWidth={3} fill="none" />;
          })}
        </Stage>
      </Layer>
      <Layer depth={0.36}>
        <Stage>
          <Skyline seed="rt-near" baseY={1480} layer={2} scale={1.2} maxH={300} time="sunrise" lights={0} x0={-700} x1={1800} />
        </Stage>
      </Layer>
      <Layer depth={1}>
        <Stage>
          <defs>
            <linearGradient id="rt-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b3555" />
              <stop offset="1" stopColor="#14152a" />
            </linearGradient>
          </defs>
          {/* glass balustrade */}
          <rect x={-1200} y={1250} width={3600} height={ROOF.floorY - 1250} fill="#9fb3d8" opacity={0.12} />
          <rect x={-1200} y={1242} width={3600} height={12} rx={6} fill="#141a30" />
          {Array.from({length: 14}, (_, i) => (
            <rect key={i} x={-1200 + i * 280} y={1250} width={8} height={ROOF.floorY - 1250} fill="#141a30" />
          ))}
          <rect x={-1200} y={ROOF.floorY} width={3600} height={900} fill="url(#rt-floor)" />
          <rect x={-1200} y={ROOF.floorY} width={3600} height={6} fill="#ffb37a" opacity={0.35} />
          <RooftopUnits x={-640} y={ROOF.floorY} color="#151a30" />
          {character}
        </Stage>
      </Layer>
      <Layer depth={1.5} blur={10}>
        <Stage>
          <rect x={940} y={1100} width={26} height={1200} fill="#0a0d1a" />
          <rect x={-300} y={1850} width={1700} height={300} fill="#0a0d1a" />
        </Stage>
      </Layer>
    </Camera>
  );
};
