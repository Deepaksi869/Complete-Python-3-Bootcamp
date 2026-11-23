/**
 * SET: OFFICE ENTRANCE (UAE, day → dusk).
 * Generic, unbranded office building with a sliding frosted-glass door.
 * The character can walk into the doorway and disappear behind the facade.
 */
import React from 'react';
import {interpolateColors} from 'remotion';
import {Cam, Camera, Glow, Haze, Layer, Sky, Skyline, Stage} from '../components/Background';
import {Plant} from '../components/Props';
import {palette, skies} from '../theme/palette';
import {lerp} from '../lib/anim';

export const ENTRANCE = {groundY: 1600, door: {x0: 690, x1: 890, top: 1000}};

const mixStops = (a: readonly string[], b: readonly string[], t: number) =>
  a.map((c, i) => interpolateColors(t, [0, 1], [c, b[Math.min(i, b.length - 1)]]));

export const OfficeEntrance: React.FC<{
  cam: Cam;
  dusk: number;
  doorOpen: number;
  interiorOn: number;
  character?: React.ReactNode;
  /** 0..1 glowing "square one" outline around x. */
  square?: number;
  squareX?: number;
}> = ({cam, dusk, doorOpen, interiorOn, character, square = 0, squareX = 400}) => {
  const D = ENTRANCE.door;
  const G = ENTRANCE.groundY;
  const day = ['#7fa6d6', '#a9c4e3', '#e9dcc8', '#f2d6b0'];
  const sky = mixStops(day, skies.dusk, dusk);
  const facade = interpolateColors(dusk, [0, 1], ['#3a4566', '#161c33']);
  const ground = interpolateColors(dusk, [0, 1], ['#8d8a92', '#2a2b40']);
  const frost = interpolateColors(interiorOn, [0, 1], ['#28314d', '#f6dcb2']);
  const doorShift = doorOpen * (D.x1 - D.x0 - 10);
  return (
    <Camera cam={cam} background={palette.navy900}>
      <Layer depth={0.12}>
        <Stage>
          <Sky id="oe-sky" stops={sky} top={-300} bottom={1350} />
          <Glow id="oe-sun" cx={200} cy={lerp(500, 1150, dusk)} r={480} color={dusk > 0.5 ? '#ff9a5a' : '#fff2d6'} opacity={0.7} />
        </Stage>
      </Layer>
      <Layer depth={0.22}>
        <Stage>
          <Haze id="oe-haze" y={1150} height={300} color={dusk > 0.5 ? '#e0825a' : '#f4e2c8'} opacity={0.5} />
          <Skyline seed="oe-far" baseY={1300} layer={0} scale={0.85} superX={260} maxH={420} time={dusk > 0.5 ? 'dusk' : 'day'} lights={dusk} />
        </Stage>
      </Layer>
      <Layer depth={1}>
        <Stage>
          {/* ground plaza with tiles */}
          <rect x={-800} y={G} width={2800} height={800} fill={ground} />
          {Array.from({length: 30}, (_, i) => (
            <line key={i} x1={-800 + i * 110} y1={G} x2={-1000 + i * 150} y2={G + 500} stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
          ))}
          {[G + 60, G + 150, G + 280].map((y) => (
            <line key={y} x1={-800} y1={y} x2={2000} y2={y} stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
          ))}
          {/* square one */}
          {square > 0 && (
            <g opacity={square} style={{mixBlendMode: 'screen'}}>
              <polygon
                points={`${squareX - 150},${G + 8} ${squareX + 120},${G + 8} ${squareX + 175},${G + 120} ${squareX - 135},${G + 120}`}
                fill="none"
                stroke={palette.orange}
                strokeWidth={6}
              />
              <polygon
                points={`${squareX - 150},${G + 8} ${squareX + 120},${G + 8} ${squareX + 175},${G + 120} ${squareX - 135},${G + 120}`}
                fill={palette.orange}
                opacity={0.12}
              />
            </g>
          )}
          {/* interior visible through the doorway */}
          <rect x={D.x0} y={D.top} width={D.x1 - D.x0} height={G - D.top} fill={interpolateColors(interiorOn, [0, 1], ['#0c1020', '#f0d2a2'])} />
          <rect x={D.x0 + 20} y={G - 120} width={150} height={120} fill={interpolateColors(interiorOn, [0, 1], ['#0a0d18', '#c79e74'])} />
          <rect x={D.x0} y={D.top + 40} width={D.x1 - D.x0} height={20} fill="#fff" opacity={0.25 * interiorOn} />
          {character}
          {/* facade with the doorway cut out */}
          <path
            fillRule="evenodd"
            d={`M560,-500 H2200 V${G} H560Z M${D.x0},${D.top} V${G} H${D.x1} V${D.top}Z`}
            fill={facade}
          />
          {/* frosted glass panels (lit from inside) */}
          {[
            [930, 600, 300, 1000],
            [1250, 600, 300, 1000],
            [600, 300, 610, 240],
            [930, 300, 620, 240],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={frost} opacity={0.85} />
          ))}
          <rect x={600} y={600} width={70} height={1000} fill={frost} opacity={0.85} />
          {/* sliding door panel */}
          <rect x={D.x0 + doorShift} y={D.top} width={D.x1 - D.x0} height={G - D.top} fill={frost} opacity={0.55} />
          <rect x={D.x0 + doorShift} y={D.top} width={D.x1 - D.x0} height={G - D.top} fill="none" stroke="#11162a" strokeWidth={10} />
          <rect x={D.x0 + doorShift + 20} y={D.top + 260} width={8} height={90} rx={4} fill="#c7cbd6" />
          {/* door frame + canopy */}
          <rect x={D.x0 - 14} y={D.top - 14} width={D.x1 - D.x0 + 28} height={14} fill="#0f1426" />
          <rect x={D.x0 - 60} y={D.top - 60} width={D.x1 - D.x0 + 120} height={30} fill="#0f1426" />
          {/* street lamp */}
          <rect x={120} y={900} width={12} height={G - 900} fill="#151a2c" />
          <rect x={100} y={890} width={70} height={16} rx={6} fill="#151a2c" />
          {dusk > 0.4 && (
            <g opacity={(dusk - 0.4) / 0.6}>
              <Glow id="oe-lamp" cx={135} cy={910} r={220} color="#ffcf8f" opacity={0.6} />
              <ellipse cx={135} cy={G + 30} rx={220} ry={40} fill="#ffcf8f" opacity={0.15} />
            </g>
          )}
          <Plant x={980} y={G} scale={1.5} seed="oe-plant" pot="#1d2236" leaf={dusk > 0.5 ? '#1f3530' : '#3b6a4f'} />
        </Stage>
      </Layer>
      <Layer depth={1.45} blur={9}>
        <Stage>
          <g transform="translate(40 1980) scale(3)">
            <Plant x={0} y={0} seed="oe-fg" pot="#10131f" leaf="#14231f" />
          </g>
        </Stage>
      </Layer>
    </Camera>
  );
};
