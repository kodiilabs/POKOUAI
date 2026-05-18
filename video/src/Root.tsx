import React from 'react';
import { Composition } from 'remotion';
import { PokouAIAutoVideo, TOTAL_FRAMES } from './compositions/PokouAIAutoVideo';
import {
  ScreenshotHome,
  ScreenshotResult,
  ScreenshotSkillDemoDiagnose,
  ScreenshotSkillDemoLesson,
} from './compositions/Screenshots';

const SCREENSHOT_DIM = { width: 1080, height: 1920, fps: 30, durationInFrames: 1 };

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
      <Composition id="Screenshot-Home" component={ScreenshotHome} {...SCREENSHOT_DIM} />
      <Composition id="Screenshot-Result" component={ScreenshotResult} {...SCREENSHOT_DIM} />
      <Composition
        id="Screenshot-SkillDemo-Diagnose"
        component={ScreenshotSkillDemoDiagnose}
        {...SCREENSHOT_DIM}
      />
      <Composition
        id="Screenshot-SkillDemo-Lesson"
        component={ScreenshotSkillDemoLesson}
        {...SCREENSHOT_DIM}
      />
    </>
  );
};
