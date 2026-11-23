/**
 * SET: OFFICE IN INDIA (daytime, warm).
 * Layered: warm sky → low-rise city with water tanks and trees → office
 * interior (whiteboard timeline, fan, desks) → foreground partition.
 */
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {Cam, Camera, Dust, Glow, Haze, Layer, LightBeam, Sky, Stage} from '../components/Background';
import {CeilingFan, Chair, Desk, DesktopMonitor, Mug, Plant, WallClock} from '../components/Props';
import {palette, skies} from '../theme/palette';
import {clamp} from '../lib/anim';

export const OFFICE = {
  scale: 1.75,
  origin: {x: 540, y: 1520},
  seat: {x: -70, y: 0},
  toStage: (x: number, y: number) => ({x: 540 + x * 1.75, y: 1520 + y * 1.75}),
};

const IndianCity: React.FC = () => {
  const frame = useCurrentFrame();
  const blocks = Array.from({length: 26}, (_, i) => {
    const r = (k: string) => random(`ind${k}${i}`);
    return {x: -300 + i * 70 + r('x') * 20, w: 60 + r('w') * 50, h: 90 + r('h') * 170, c: ['#d9b896', '#cfa27f', '#e4c9a6', '#bf9473', '#e8d3b5'][Math.floor(r('c') * 5)], tank: r('t') > 0.45};
  });
  return (
    <g>
      {/* distant towers in haze */}
      {Array.from({length: 9}, (_, i) => (
        <rect key={i} x={-100 + i * 150} y={760 - (80 + random(`it${i}`) * 140)} width={46 + random(`iw${i}`) * 30} height={400} fill="#d6b494" opacity={0.55} />
      ))}
      <Haze id="ind-haze" y={760} height={220} color="#f6d2a6" opacity={0.7} />
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={900 - b.h} width={b.w} height={b.h + 200} fill={b.c} />
          {Array.from({length: Math.floor(b.h / 40)}, (_, k) => (
            <rect key={k} x={b.x + 10} y={900 - b.h + 18 + k * 40} width={b.w - 20} height={10} fill="#8a6a52" opacity={0.35} />
          ))}
          {b.tank && <rect x={b.x + b.w * 0.55} y={900 - b.h - 26} width={22} height={26} rx={4} fill="#2d2a2a" />}
        </g>
      ))}
      {/* trees */}
      {Array.from({length: 12}, (_, i) => {
        const x = -250 + i * 140 + random(`tr${i}`) * 50;
        const s = 0.8 + random(`ts${i}`) * 0.6;
        const sway = Math.sin(frame / 30 + i) * 2;
        return (
          <g key={i} transform={`translate(${x + sway},${930}) scale(${s})`}>
            <rect x={-5} y={-40} width={10} height={60} fill="#5a4030" />
            <circle cx={-22} cy={-58} r={34} fill="#5f7a45" />
            <circle cx={18} cy={-66} r={38} fill="#6d8a4e" />
            <circle cx={0} cy={-92} r={32} fill="#7a965a" />
          </g>
        );
      })}
      {/* power lines */}
      <path d="M-400,700 Q300,760 1500,690" stroke="#3a2f2a" strokeWidth={2} fill="none" opacity={0.6} />
      <path d="M-400,720 Q300,790 1500,715" stroke="#3a2f2a" strokeWidth={2} fill="none" opacity={0.5} />
      {/* a few birds */}
      {[0, 1, 2].map((k) => {
        const bx = ((frame * (1.2 + k * 0.3) + k * 300) % 1700) - 300;
        const flap = Math.sin(frame / 4 + k) * 6;
        return <path key={k} d={`M${bx},${520 + k * 30} q10,${-6 - flap} 20,0 q10,${-6 - flap} 20,0`} stroke="#4a3a30" strokeWidth={3} fill="none" />;
      })}
    </g>
  );
};

/** Whiteboard with a project timeline. `progress` 0..1 lights the milestones. */
const Whiteboard: React.FC<{x: number; y: number; progress: number}> = ({x, y, progress}) => {
  const nodes = 5;
  return (
    <g>
      <rect x={x} y={y} width={300} height={190} rx={6} fill="#f7f3ea" stroke="#9c8f7c" strokeWidth={6} />
      <line x1={x + 30} y1={y + 120} x2={x + 270} y2={y + 120} stroke="#c9bfae" strokeWidth={5} strokeLinecap="round" />
      <line x1={x + 30} y1={y + 120} x2={x + 30 + 240 * clamp(progress)} y2={y + 120} stroke={palette.orange} strokeWidth={6} strokeLinecap="round" />
      {Array.from({length: nodes}, (_, i) => {
        const nx = x + 30 + (240 * i) / (nodes - 1);
        const on = progress >= i / (nodes - 1) - 0.001;
        const barH = 18 + i * 12;
        return (
          <g key={i}>
            <rect x={nx - 9} y={y + 96 - barH} width={18} height={barH} rx={3} fill={on ? palette.navy600 : '#e1d9ca'} />
            <circle cx={nx} cy={y + 120} r={on ? 11 : 8} fill={on ? palette.orange : '#c9bfae'} />
            {on && <path d={`M${nx - 5},${y + 120} l4,4 l7,-8`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />}
          </g>
        );
      })}
      <rect x={x + 30} y={y + 150} width={120} height={8} rx={4} fill="#d8cfbf" />
      <rect x={x + 30} y={y + 166} width={80} height={8} rx={4} fill="#d8cfbf" />
    </g>
  );
};

export const IndiaOffice: React.FC<{cam: Cam; character?: React.ReactNode; timeline?: number; monitorGlow?: number}> = ({
  cam,
  character,
  timeline = 0,
  monitorGlow = 1,
}) => {
  const t = `translate(${OFFICE.origin.x} ${OFFICE.origin.y}) scale(${OFFICE.scale})`;
  const W = {x0: -170, x1: 330, y0: -700, y1: -300};
  const S = OFFICE.toStage;
  return (
    <Camera cam={cam} background="#e9d8bb">
      <Layer depth={0.15}>
        <Stage>
          <Sky id="ind-sky" stops={skies.indiaDay} top={-300} bottom={1000} />
          <Glow id="ind-sun" cx={900} cy={300} r={420} color="#fff1cf" opacity={0.7} />
        </Stage>
      </Layer>
      <Layer depth={0.3}>
        <Stage>
          <IndianCity />
        </Stage>
      </Layer>
      <Layer depth={1}>
        <Stage>
          <defs>
            <linearGradient id="ind-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ead9bd" />
              <stop offset="1" stopColor="#d8c09c" />
            </linearGradient>
            <linearGradient id="ind-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b99a7a" />
              <stop offset="1" stopColor="#8d6f55" />
            </linearGradient>
          </defs>
          <g transform={t}>
            <path fillRule="evenodd" d={`M-1000,-1300 H1000 V0 H-1000Z M${W.x0},${W.y0} V${W.y1} H${W.x1} V${W.y0}Z`} fill="url(#ind-wall)" />
            <rect x={W.x0 - 8} y={W.y0 - 8} width={W.x1 - W.x0 + 16} height={W.y1 - W.y0 + 16} fill="none" stroke="#f4ead8" strokeWidth={16} />
            <rect x={(W.x0 + W.x1) / 2 - 4} y={W.y0} width={8} height={W.y1 - W.y0} fill="#f4ead8" />
            <rect x={W.x0 - 20} y={W.y1 + 6} width={W.x1 - W.x0 + 40} height={12} fill="#cdb79a" />
            {/* curtains */}
            <path d={`M${W.x0 - 40},${W.y0 - 20} h50 v${W.y1 - W.y0 + 60} q-25,10 -50,0Z`} fill="#c9844f" opacity={0.85} />
            <path d={`M${W.x1 - 10},${W.y0 - 20} h50 v${W.y1 - W.y0 + 60} q-25,10 -50,0Z`} fill="#c9844f" opacity={0.85} />
            <Whiteboard x={-560} y={-640} progress={timeline} />
            <WallClock x={-240} y={-610} hours={10.5} />
            <rect x={-1000} y={-14} width={2000} height={14} fill="#b9a07f" />
            <rect x={-1000} y={0} width={2000} height={600} fill="url(#ind-floor)" />
            {/* back row of desks with anonymous colleagues */}
            <g opacity={0.55}>
              {[-520, 420].map((dx, i) => (
                <g key={i}>
                  <rect x={dx - 40} y={-205} width={34} height={70} rx={14} fill="#7b6656" />
                  <circle cx={dx - 22} cy={-225} r={16} fill="#6c5646" />
                  <rect x={dx} y={-200} width={170} height={12} fill="#9c8068" />
                  <rect x={dx + 40} y={-262} width={70} height={52} rx={4} fill="#4a4650" />
                </g>
              ))}
            </g>
            <Chair x={OFFICE.seat.x - 6} y={0} color="#3a3a46" />
            <Desk x={-6} y={0} w={300} h={150} top="#b08a67" body="#8a6a4f" legs="#5b4535" />
            <DesktopMonitor x={150} y={-150} glow={monitorGlow} />
            <rect x={30} y={-156} width={80} height={6} rx={3} fill="#3a3f4c" />
            <Mug x={240} y={-150} steam color="#e8e1d3" />
            <Plant x={-380} y={0} scale={1.1} seed="ind-plant" pot="#b5653d" leaf="#4f7a4a" />
            {character}
            <rect x={-6} y={-150} width={300} height={12} rx={3} fill="#b08a67" />
          </g>
          {/* sunbeam through the window + dust in it */}
          <LightBeam
            id="ind-beam"
            points={[
              [S(W.x0, W.y0).x, S(W.x0, W.y0).y],
              [S(W.x1, W.y0).x, S(W.x1, W.y0).y],
              [S(W.x1 - 260, 60).x, S(W.x1 - 260, 60).y],
              [S(W.x0 - 330, 60).x, S(W.x0 - 330, 60).y],
            ]}
            color="#ffe2b0"
            opacity={0.35}
            from={[700, 300]}
            to={[300, 1500]}
          />
          <Dust area={[S(W.x0 - 200, -600).x, S(0, -600).y, S(W.x1, 0).x, S(0, -20).y]} count={30} seed="ind-dust" />
          <g transform={t}>
            <CeilingFan x={60} y={-860} scale={1.2} />
          </g>
        </Stage>
      </Layer>
      <Layer depth={1.5} blur={8}>
        <Stage>
          <rect x={-200} y={1560} width={560} height={500} rx={20} fill="#8a6a52" />
          <g transform="translate(980 1780) scale(2.4)">
            <Plant x={0} y={0} seed="ind-fg" pot="#7d4a30" leaf="#3f5f3a" />
          </g>
        </Stage>
      </Layer>
    </Camera>
  );
};
