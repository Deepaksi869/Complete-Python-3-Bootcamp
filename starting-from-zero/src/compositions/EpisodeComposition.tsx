/**
 * GENERIC EPISODE COMPOSITION
 * Assembles any episode from its config + timeline: scenes with
 * transitions, narration clips, auto-ducked music, captions and the
 * cinematic finishing layers. Nothing here is episode-specific.
 */
import React from 'react';
import {AbsoluteFill, Audio, Sequence, getRemotionEnvironment, staticFile, useCurrentFrame} from 'remotion';
import type {EpisodeConfig, Timeline} from '../lib/types';
import {duckedVolume} from '../lib/timeline';
import {sceneRegistry} from '../scenes/registry';
import {SceneEnter, transitionNeedsOverlap} from '../components/Transitions';
import {Captions} from '../components/Subtitle';
import {FilmGrain, Grade, Vignette} from '../components/Background';
import {SfxLevel} from '../components/Sound';
import {fonts} from '../theme/typography';
import {clamp} from '../lib/anim';

const MissingScene: React.FC<{name: string}> = ({name}) => (
  <AbsoluteFill style={{background: '#300', color: '#fff', fontFamily: fonts.body, fontSize: 40, padding: 80}}>
    Scene component "{name}" is not registered in src/scenes/registry.ts
  </AbsoluteFill>
);

const PreviewNotice: React.FC = () => {
  const frame = useCurrentFrame();
  if (!getRemotionEnvironment().isStudio) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        right: 24,
        padding: '14px 20px',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.6)',
        color: '#ffd9a8',
        fontFamily: fonts.body,
        fontSize: 22,
        fontWeight: 600,
        opacity: frame < 150 ? 1 : 0.35,
      }}
    >
      PREVIEW · estimated timing (no narration yet). Put your ElevenLabs file at public/audio/voiceover.mp3 and restart the preview.
    </div>
  );
};

export const EpisodeComposition: React.FC<{config: EpisodeConfig; timeline: Timeline}> = ({config, timeline}) => {
  const total = timeline.durationInFrames;
  return (
    <SfxLevel.Provider value={config.mix.sfx}>
      <AbsoluteFill style={{background: '#000'}}>
        {timeline.scenes.map((scene, i) => {
          const Comp = sceneRegistry[scene.spec.component];
          const next = timeline.scenes[i + 1];
          const overlap = next && transitionNeedsOverlap(next.spec.transitionIn?.kind) ? next.spec.transitionIn?.duration ?? 0 : 0;
          return (
            <Sequence
              key={scene.spec.id}
              name={`${String(i + 1).padStart(2, '0')} · ${scene.spec.id}`}
              from={scene.from}
              durationInFrames={scene.durationInFrames + overlap}
            >
              <SceneEnter kind={scene.spec.transitionIn?.kind} duration={scene.spec.transitionIn?.duration}>
                {Comp ? <Comp scene={scene} timeline={timeline} episode={config} /> : <MissingScene name={scene.spec.component} />}
              </SceneEnter>
            </Sequence>
          );
        })}

        {/* Cinematic finishing */}
        <Grade />
        <Vignette strength={0.55} />
        <FilmGrain opacity={0.1} />

        {/* Captions sit above the grade so they stay crisp */}
        <Captions timeline={timeline} />

        {/* Narration: placed clip by clip, never time-stretched */}
        {timeline.voiceoverFile &&
          timeline.clips.map((c, i) => (
            <Sequence key={`vo-${i}`} from={c.from} durationInFrames={c.durationInFrames} name={`Narration ${i + 1}`} layout="none">
              <Audio src={staticFile(timeline.voiceoverFile!)} trimBefore={c.trimBefore} volume={config.mix.voice} />
            </Sequence>
          ))}

        {/* Optional licensed music, ducked under the narration */}
        {timeline.musicFile && (
          <Audio
            src={staticFile(timeline.musicFile)}
            loop
            volume={(f) => {
              const fadeIn = clamp(f / (timeline.fps * 2));
              const fadeOut = clamp((total - f) / (timeline.fps * 3));
              return duckedVolume(f, timeline, config) * fadeIn * fadeOut;
            }}
          />
        )}

        {timeline.estimated && <PreviewNotice />}
      </AbsoluteFill>
    </SfxLevel.Provider>
  );
};
