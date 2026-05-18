import React from 'react';
import { ScreenshotFrame } from '../phone/ScreenshotFrame';
import { MockHomeScreen } from '../phone/MockHomeScreen';
import { MockResultScreen } from '../phone/MockResultScreen';
import { MockSkillDemoScreen } from '../phone/MockSkillDemoScreen';

// Each composition below is a single still frame, used by
// scripts/gen-screenshots.mjs to render PNGs into docs/screenshots/.

export const ScreenshotHome: React.FC = () => (
  <ScreenshotFrame>
    <MockHomeScreen highlightFarmerAgent />
  </ScreenshotFrame>
);

export const ScreenshotResult: React.FC = () => (
  <ScreenshotFrame background="linear-gradient(180deg, #fff3e0 0%, #ffe0b2 100%)">
    <MockResultScreen level="practitioner" />
  </ScreenshotFrame>
);

export const ScreenshotSkillDemoDiagnose: React.FC = () => (
  <ScreenshotFrame background="linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%)">
    <MockSkillDemoScreen stageId="diagnose" level="novice" />
  </ScreenshotFrame>
);

export const ScreenshotSkillDemoLesson: React.FC = () => (
  <ScreenshotFrame background="linear-gradient(180deg, #e8f5e9 0%, #a5d6a7 100%)">
    <MockSkillDemoScreen stageId="lesson" level="expert" />
  </ScreenshotFrame>
);
