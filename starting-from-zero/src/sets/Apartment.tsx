/**
 * SET: THE APARTMENT (UAE, night).
 * A layered environment: sky → far skyline → near skyline → room interior
 * → blurred foreground. Reused by Scenes 01, 02, 06 and future episodes.
 *
 * Interior coordinates are "set units": floor at y = 0, character height 360.
 * They are mapped onto the 1080x1920 stage by APT.toStage().
 */
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Cam, Camera, Glow, Haze, Layer, LightBeam, Sky, Skyline, Stage, Stars} from '../components/Background';
import {Chair, Desk, DeskLamp, Mug, Plant, Shelf, WallCalendar} from '../components/Props';
import {LaptopSide} from '../components/Laptop';
import {palette, skies} from '../theme/palette';
import {Plane} from '../components/Props';

export const APT = {
  scale: 1.9,
  origin: {x: 540, y: 1460},
  /** Window opening in set units. */
  window: {x0: -272, x1: 272, y0: -660, y1: -40},
  /** Where the seated character's feet go (set units). */
  seat: {x: -62, y: 0},
  laptop: {x: 34, y: -150},
  toStage: (x: number, y: number) => ({x: 540 + x * 1.9, y: 1460 + y * 1.9}),
};

export type ApartmentProps = {
  cam: Cam;
  /** 0..1 how open the laptop lid is. */
  lid?: number;
  /** Laptop glow intensity. */
  glow?: number;
  /** Desk lamp 0..1. */
  lamp?: number;
  /** Character (rendered in set units). */
  character?: React.ReactNode;
  /** Extra interior elements in set units (drawn in front of the desk). */
  overlay?: React.ReactNode;
  /** Desaturate / freeze look for the rewind effect (0..1). */
  freeze?: number;
  /** Time of day outside: 0 = deep night, 1 = pre-dawn. */
  dawn?: number;
  calendar?: {month: string; day: string};
};

export const Apartment: React.FC<ApartmentProps> = ({
  cam,
  lid = 1,
  glow = 1,
  lamp = 0,
  character,
  overlay,
  freeze = 0,
  dawn = 0,
  calendar,
}) => {
  const frame = useCurrentFrame();
  const W = APT.window;
  const t = `translate(${APT.origin.x} ${APT.origin.y}) scale(${APT.scale})`;
  const planeX = -500 + ((frame * 1.3) % 2600);
  const skyStops = dawn > 0 ? ['#060c1f', '#14214a', '#2c3566', '#5a4a72'] : skies.night;

  return (
    <Camera cam={cam} background={palette.navy950}>
      <div style={{position: 'absolute', inset: 0, filter: freeze > 0 ? `saturate(${1 - freeze * 0.75}) contrast(${1 + freeze * 0.1})` : undefined}}>
        {/* Sky */}
        <Layer depth={0.1}>
          <Stage>
            <Sky id="apt-sky" stops={skyStops} top={-400} bottom={1300} />
            <Stars count={70} seed="apt" area={[-300, -300, 1400, 650]} opacity={0.55} />
            <Glow id="apt-moon" cx={830} cy={330} r={160} color="#9db8ff" opacity={0.25} />
            <circle cx={830} cy={330} r={26} fill="#e8eeff" opacity={0.85} />
            <g transform={`translate(${planeX}, ${360 + Math.sin(frame / 50) * 6})`}>
              <circle r={3} fill="#fff" opacity={frame % 30 < 15 ? 1 : 0.3} />
              <circle cx={-10} r={2.4} fill="#ff5a4a" opacity={0.8} />
            </g>
          </Stage>
        </Layer>
        {/* Far skyline with the landmark tower */}
        <Layer depth={0.18}>
          <Stage>
            <Haze id="apt-haze-far" y={1040} height={360} color="#ff9b5a" opacity={0.28} />
            <Skyline seed="apt-far" baseY={1180} layer={0} scale={0.8} superX={700} maxH={430} time="night" lights={0.8} />
          </Stage>
        </Layer>
        <Layer depth={0.28}>
          <Stage>
            <Skyline seed="apt-mid" baseY={1260} layer={1} scale={1.05} maxH={380} time="night" />
            <Haze id="apt-haze-near" y={1250} height={220} color="#3a4f8f" opacity={0.45} />
          </Stage>
        </Layer>

        {/* Room interior */}
        <Layer depth={1}>
          <Stage>
            <defs>
              <linearGradient id="apt-wall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0a1124" />
                <stop offset="1" stopColor="#111a33" />
              </linearGradient>
              <linearGradient id="apt-floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#141b2e" />
                <stop offset="1" stopColor="#070b16" />
              </linearGradient>
              <linearGradient id="apt-glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#9fc0ff" stopOpacity={0} />
                <stop offset="0.48" stopColor="#9fc0ff" stopOpacity={0.07} />
                <stop offset="0.52" stopColor="#9fc0ff" stopOpacity={0} />
                <stop offset="0.8" stopColor="#9fc0ff" stopOpacity={0.05} />
                <stop offset="0.84" stopColor="#9fc0ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <g transform={t}>
              {/* wall with window hole */}
              <path
                fillRule="evenodd"
                d={`M-900,-1100 H900 V0 H-900Z M${W.x0},${W.y0} V${W.y1} H${W.x1} V${W.y0}Z`}
                fill="url(#apt-wall)"
              />
              {/* glass reflection + frame */}
              <rect x={W.x0} y={W.y0} width={W.x1 - W.x0} height={W.y1 - W.y0} fill="url(#apt-glass)" />
              {/* blinds rolled up at the top */}
              <rect x={W.x0 - 6} y={W.y0} width={W.x1 - W.x0 + 12} height={54} fill="#0d1428" />
              {Array.from({length: 5}, (_, i) => (
                <rect key={i} x={W.x0} y={W.y0 + 6 + i * 10} width={W.x1 - W.x0} height={2} fill="#1d2848" />
              ))}
              <rect x={W.x0 - 8} y={W.y0 - 8} width={W.x1 - W.x0 + 16} height={W.y1 - W.y0 + 16} fill="none" stroke="#070c19" strokeWidth={16} />
              <rect x={-4} y={W.y0} width={8} height={W.y1 - W.y0} fill="#070c19" />
              <rect x={W.x0} y={W.y1 - 200} width={W.x1 - W.x0} height={6} fill="#070c19" />
              {/* left wall details */}
              <Shelf x={-560} y={-420} w={200} seed="apt-shelf" />
              {calendar && <WallCalendar x={-420} y={-330} month={calendar.month} day={calendar.day} scale={0.55} />}
              {/* floor */}
              <rect x={-900} y={0} width={1800} height={400} fill="url(#apt-floor)" />
              {/* moonlight patch on the floor */}
              <polygon points={`${W.x0 + 40},4 ${W.x1 - 80},4 ${W.x1 + 120},150 ${W.x0 + 140},150`} fill="#6d8fd6" opacity={0.07} />
              <Plant x={-330} y={0} scale={1.3} seed="apt-plant" pot="#3a2e2a" leaf="#1d3a33" />
              {/* desk & chair */}
              <Chair x={APT.seat.x - 6} y={0} color="#141a2a" />
              <Desk x={-6} y={0} w={270} h={150} top="#3a2f28" body="#261e19" legs="#18130f" />
              <DeskLamp x={226} y={-150} on={lamp} color="#1f2433" />
              <Mug x={196} y={-150} steam={lamp > 0.5} color="#bfb2a0" />
              <LaptopSide x={APT.laptop.x} y={APT.laptop.y} lid={lid} glow={glow} />
              {character}
              {overlay}
              {/* desk front edge over the character's knees */}
              <rect x={-6} y={-150} width={270} height={12} rx={3} fill="#3a2f28" />
            </g>
            {/* laptop glow on the wall + ambient */}
            {glow > 0 && lid > 0.3 && (
              <Glow id="apt-lapglow" cx={APT.toStage(60, -230).x} cy={APT.toStage(60, -230).y} r={420} color={palette.blueGlow} opacity={0.22 * glow} />
            )}
            {lamp > 0 && <Glow id="apt-lampglow" cx={APT.toStage(240, -240).x} cy={APT.toStage(240, -240).y} r={520} color={palette.amber} opacity={0.3 * lamp} />}
            <LightBeam
              id="apt-beam"
              points={[
                [APT.toStage(W.x0, W.y0 + 200).x, APT.toStage(W.x0, W.y0 + 200).y],
                [APT.toStage(W.x1, W.y0 + 100).x, APT.toStage(W.x1, W.y0 + 100).y],
                [APT.toStage(W.x1 + 200, 120).x, APT.toStage(W.x1 + 200, 120).y],
                [APT.toStage(W.x0 + 80, 120).x, APT.toStage(W.x0 + 80, 120).y],
              ]}
              color="#7f9fe8"
              opacity={0.03}
              from={[540, 400]}
              to={[540, 1700]}
            />
          </Stage>
        </Layer>

        {/* Foreground: out-of-focus leaves and the sofa arm */}
        <Layer depth={1.55} blur={9}>
          <Stage>
            <g transform="translate(-60 1720) scale(2.6)">
              <Plant x={0} y={0} seed="apt-fg" pot="#0b0f1c" leaf="#0f1f22" />
            </g>
            <rect x={760} y={1700} width={520} height={400} rx={60} fill="#0a0e1a" />
          </Stage>
        </Layer>
      </div>
    </Camera>
  );
};

/** Plane silhouette for exterior shots (re-exported for convenience). */
export {Plane};
