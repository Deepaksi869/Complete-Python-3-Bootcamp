/**
 * SET: AIRPORT ARRIVAL HALL (golden hour).
 * A long, wide set for tracking shots. World coordinates extend to the right
 * (x up to ~3600) so the camera can follow a walking character.
 */
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Cam, Camera, Glow, Haze, Layer, Sky, Skyline, Stage} from '../components/Background';
import {Passerby, Plane} from '../components/Props';
import {palette, skies} from '../theme/palette';
import {fonts} from '../theme/typography';

export const AIRPORT = {floorY: 1580, glassBottom: 1330, ceilingY: 330};

const Sign: React.FC<{x: number; y: number; text: string; arrow?: boolean}> = ({x, y, text, arrow}) => (
  <g>
    <rect x={x + 60} y={y - 260} width={6} height={260} fill="#1b2134" />
    <rect x={x + 220} y={y - 260} width={6} height={260} fill="#1b2134" />
    <rect x={x} y={y} width={300} height={92} rx={10} fill="#141a2b" />
    <rect x={x + 8} y={y + 8} width={84} height={76} rx={8} fill={palette.amber} />
    <path d={`M${x + 30},${y + 46} h36 m-14,-14 l14,14 l-14,14`} stroke="#141a2b" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={arrow ? 1 : 0} />
    {!arrow && <path d={`M${x + 28},${y + 40} q22,-26 44,0 l-6,18 h-32z`} fill="#141a2b" />}
    <text x={x + 112} y={y + 60} fontFamily={fonts.body} fontWeight={800} fontSize={34} fill="#f4efe6" letterSpacing={3}>
      {text}
    </text>
  </g>
);

export const Airport: React.FC<{cam: Cam; character?: React.ReactNode; sunY?: number}> = ({cam, character, sunY = 820}) => {
  const frame = useCurrentFrame();
  const mullions = Array.from({length: 18}, (_, i) => -600 + i * 280);
  // anonymous travellers in the hall (never the protagonist)
  const people = [
    {x0: 300, v: 2.6, s: 1.05, c: '#2a3150', bag: true},
    {x0: 1500, v: -2.2, s: 0.95, c: '#3a3656', bag: false},
    {x0: 2100, v: 2.0, s: 1.0, c: '#2d3a55', bag: true},
    {x0: 900, v: -1.6, s: 0.9, c: '#34384f', bag: false},
    {x0: 2700, v: -2.4, s: 1.0, c: '#2a3150', bag: true},
  ];
  return (
    <Camera cam={cam} background="#2a2340">
      <Layer depth={0.04}>
        <Stage>
          <Sky id="ap-sky" stops={skies.goldenHour} top={-200} bottom={1400} x={-1500} width={6000} />
          <Glow id="ap-sun" cx={1300} cy={sunY} r={520} color="#ffd59a" opacity={0.9} />
          <circle cx={1300} cy={sunY} r={70} fill="#fff1d0" />
        </Stage>
      </Layer>
      <Layer depth={0.1}>
        <Stage>
          <Haze id="ap-haze" y={1060} height={300} color="#ffc48a" opacity={0.55} />
          <Skyline seed="ap-far" baseY={1180} x0={-900} x1={3200} layer={0} scale={0.75} superX={1150} maxH={430} time="golden" lights={0} />
        </Stage>
      </Layer>
      <Layer depth={0.3}>
        <Stage>
          <rect x={-1500} y={1200} width={6000} height={400} fill="#6e5a6a" />
          <rect x={-1500} y={1196} width={6000} height={8} fill="#c99a7f" opacity={0.6} />
          <Plane x={200 + frame * 0.4} y={1215} scale={0.85} color="#3f3550" />
          <Plane x={1700} y={1225} scale={1.05} color="#3a3049" />
          {/* departing plane climbing in the distance */}
          <g transform={`translate(${2200 + frame * 3}, ${900 - frame * 0.9}) rotate(-8)`}>
            <Plane x={0} y={0} scale={0.35} color="#4a3d55" lights={false} />
          </g>
        </Stage>
      </Layer>
      {/* glass curtain wall, ceiling and floor */}
      <Layer depth={0.8}>
        <Stage>
          <defs>
            <linearGradient id="ap-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4c3f55" />
              <stop offset="1" stopColor="#1d1a2c" />
            </linearGradient>
            <linearGradient id="ap-ceiling" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#12162a" />
              <stop offset="1" stopColor="#262a44" />
            </linearGradient>
          </defs>
          {/* ceiling with a sweeping roof structure */}
          <path d={`M-1500,-600 H4500 V${AIRPORT.ceilingY} Q1500,${AIRPORT.ceilingY + 90} -1500,${AIRPORT.ceilingY}Z`} fill="url(#ap-ceiling)" />
          {mullions.map((x, i) => (
            <g key={i}>
              <path d={`M${x},${AIRPORT.ceilingY + 40} Q${x + 140},${AIRPORT.ceilingY - 80} ${x + 280},${AIRPORT.ceilingY + 40}`} stroke="#2e3452" strokeWidth={10} fill="none" />
              <rect x={x - 7} y={AIRPORT.ceilingY} width={14} height={AIRPORT.glassBottom - AIRPORT.ceilingY} fill="#1a1d31" />
            </g>
          ))}
          <rect x={-1500} y={760} width={6000} height={8} fill="#1a1d31" />
          <rect x={-1500} y={AIRPORT.glassBottom} width={6000} height={30} fill="#1a1d31" />
          {/* floor with window reflections */}
          <rect x={-1500} y={AIRPORT.glassBottom + 30} width={6000} height={1200} fill="url(#ap-floor)" />
          {mullions.map((x, i) => (
            <polygon
              key={`r${i}`}
              points={`${x + 20},${AIRPORT.glassBottom + 40} ${x + 260},${AIRPORT.glassBottom + 40} ${x + 360},2000 ${x + 60},2000`}
              fill="#ffcf9a"
              opacity={0.1}
            />
          ))}
          <Sign x={980} y={440} text="ARRIVALS" arrow />
          <Sign x={2300} y={440} text="WELCOME" />
        </Stage>
      </Layer>
      <Layer depth={0.9} blur={1.5}>
        <Stage>
          {people.map((p, i) => (
            <Passerby
              key={i}
              x={p.x0 + frame * p.v}
              y={AIRPORT.floorY - 40}
              scale={p.s * 0.95}
              phase={(frame * Math.abs(p.v)) / 22 + i}
              color={p.c}
              opacity={0.7}
              bag={p.bag}
            />
          ))}
        </Stage>
      </Layer>
      <Layer depth={1}>
        <Stage>{character}</Stage>
      </Layer>
      {/* foreground columns passing by */}
      <Layer depth={1.6} blur={10}>
        <Stage>
          {[-200, 1100, 2400, 3700].map((x) => (
            <g key={x}>
              <rect x={x} y={-400} width={150} height={2600} fill="#0d0f1c" />
              <rect x={x + 120} y={-400} width={30} height={2600} fill="#ffb877" opacity={0.25} />
            </g>
          ))}
        </Stage>
      </Layer>
    </Camera>
  );
};
