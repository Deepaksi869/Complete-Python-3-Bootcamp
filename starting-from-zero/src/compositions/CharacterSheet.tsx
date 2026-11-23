import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character, poses} from '../components/Character';
import {palette} from '../theme/palette';

/** Model sheet for checking the protagonist's look in every pose. */
export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const turns = [0, 0.35, 0.65, 1];
  return (
    <AbsoluteFill style={{background: palette.navy800}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height={1920} fill={palette.navy800} />
        {turns.map((t, i) => (
          <g key={i} transform={`translate(${150 + i * 260}, 1420) scale(3.6)`}>
            <Character x={0} y={0} pose={poses.stand({headTurn: t, hipY: -178})} expression={i === 3 ? 'smile' : 'neutral'} groundShadow={0} />
          </g>
        ))}
        <line x1={0} y1={1080} x2={1080} y2={1080} stroke="#334" />
        <Character x={130} y={1080} scale={1.35} pose={poses.stand()} />
        <Character x={330} y={1080} scale={1.35} pose={poses.walk(frame / 5)} expression="hopeful" holding="suitcase" />
        <Character x={560} y={1080} scale={1.35} pose={poses.sitTyping(frame)} expression="focused" />
        <Character x={820} y={1080} scale={1.35} pose={poses.sitPhone()} holding="phone" phoneGlow={1} expression="tired" />
        <line x1={0} y1={1700} x2={1080} y2={1700} stroke="#334" />
        <Character x={150} y={1700} scale={1.35} pose={poses.standWindow({headTurn: 0.5})} expression="wry" />
        <Character x={420} y={1700} scale={1.35} pose={poses.leanRailing()} rim={{color: palette.orange, strength: 0.9}} shade={0.5} />
        <Character x={680} y={1700} scale={1.35} pose={poses.standRecord()} holding="phone" phoneGlow={1} phoneRecording expression="determined" light={{color: palette.blue, strength: 0.6}} />
        <Character x={920} y={1700} scale={1.35} facing={-1} pose={poses.walk(frame / 5 + 2)} expression="sad" />
      </svg>
    </AbsoluteFill>
  );
};
