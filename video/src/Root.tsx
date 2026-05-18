import React from 'react';
import { Composition } from 'remotion';
import { PokouAIAutoVideo, TOTAL_FRAMES } from './compositions/PokouAIAutoVideo';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PokouAIAutoVideo"
        component={PokouAIAutoVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
