import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character, poses} from '../components/Character';
import {palette} from '../theme/palette';

/** Model sheet for checking the protagonist's look: head turn + key poses. */
export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const turns = [0, 0.35, 0.65, 1];
  return (
    <AbsoluteFill style={{background: palette.navy800}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height={1920} fill="#1a2440" />
        {/* Head turn: profile → camera (crop of the upper body, scaled up) */}
        {turns.map((t, i) => (
          <g key={i} transform={`translate(${140 + i * 265}, 1500) scale(3.3)`}>
            <Character x={0} y={0} pose={poses.stand({headTurn: t})} expression={i === 3 ? 'hopeful' : 'neutral'} groundShadow={0} breathe={0} idle={0} />
          </g>
        ))}
        <rect x={0} y={620} width={1080} height={1300} fill="#1a2440" />
        <line x1={0} y1={1180} x2={1080} y2={1180} stroke="#33405f" />
        <Character x={130} y={1180} scale={1.3} pose={poses.stand()} />
        <Character x={330} y={1180} scale={1.3} pose={poses.walk(frame / 5)} expression="hopeful" holding="suitcase" />
        <Character x={580} y={1180} scale={1.3} pose={poses.sitTyping(frame)} expression="focused" />
        <Character x={850} y={1180} scale={1.3} pose={poses.standRecord({headTurn: 0.5})} holding="phone" phoneGlow={1} phoneRecording expression="smile" />
        <line x1={0} y1={1800} x2={1080} y2={1800} stroke="#33405f" />
        <Character x={170} y={1800} scale={1.3} pose={poses.standWindow({headTurn: 0.6})} expression="smile" />
        <Character x={450} y={1800} scale={1.3} pose={poses.sit({headTurn: 0.55})} expression="determined" shade={0.38} light={{color: palette.blue, strength: 0.24}} rim={{color: '#8fb0ff', strength: 0.3}} />
        <Character x={720} y={1800} scale={1.3} facing={-1} pose={poses.walk(frame / 5 + 2, {energy: 0.75})} expression="sad" />
        <Character x={930} y={1800} scale={1.3} pose={poses.stand({headTurn: 1})} expression="smile" rim={{color: palette.orange, strength: 0.5}} />
      </svg>
    </AbsoluteFill>
  );
};
