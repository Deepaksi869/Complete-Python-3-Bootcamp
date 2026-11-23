import React from 'react';
import {Composition, Folder} from 'remotion';
import {CharacterSheet} from './compositions/CharacterSheet';
import {Episode01, episode01Timeline} from './compositions/Episode01';
import {episode01} from './config/episode01';
import {ensureFonts} from './theme/typography';

ensureFonts();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Episodes">
        <Composition
          id={episode01.compositionId}
          component={Episode01}
          durationInFrames={episode01Timeline.durationInFrames}
          fps={episode01.fps}
          width={episode01.width}
          height={episode01.height}
        />
      </Folder>
      <Folder name="Tools">
        <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={60} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
