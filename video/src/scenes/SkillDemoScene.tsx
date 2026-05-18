import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { PhoneFrame } from '../phone/PhoneFrame';
import { MockSkillDemoScreen } from '../phone/MockSkillDemoScreen';

type Level = 'novice' | 'practitioner' | 'expert';
type StageId = 'onboard' | 'diagnose' | 'result' | 'day7' | 'lesson';

const LEVEL_LABEL: Record<Level, string> = {
  novice: 'Novice',
  practitioner: 'Practitioner',
  expert: 'Expert',
};

export const SKILL_DEMO_STEP_FRAMES = 45; // 1.5 s at 30 fps per (stage × level) slide

// Auto-cycle: for each stage, show all three levels in sequence.
// Total ordering: 5 stages × 3 levels = 15 frames-windows.
const SEQUENCE: { stage: StageId; level: Level }[] = [
  { stage: 'onboard', level: 'novice' },
  { stage: 'onboard', level: 'practitioner' },
  { stage: 'onboard', level: 'expert' },
  { stage: 'diagnose', level: 'novice' },
  { stage: 'diagnose', level: 'practitioner' },
  { stage: 'diagnose', level: 'expert' },
  { stage: 'result', level: 'novice' },
  { stage: 'result', level: 'practitioner' },
  { stage: 'result', level: 'expert' },
  { stage: 'day7', level: 'novice' },
  { stage: 'day7', level: 'practitioner' },
  { stage: 'day7', level: 'expert' },
  { stage: 'lesson', level: 'novice' },
  { stage: 'lesson', level: 'practitioner' },
  { stage: 'lesson', level: 'expert' },
];

export const SKILL_DEMO_TOTAL_FRAMES = SKILL_DEMO_STEP_FRAMES * 15;

export const SkillDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const framesPerStep = SKILL_DEMO_STEP_FRAMES;
  const stepIdx = Math.min(Math.floor(frame / framesPerStep), SEQUENCE.length - 1);
  const step = SEQUENCE[stepIdx]!;
  const captionOpacity = interpolate(
    frame % framesPerStep,
    [0, 8, framesPerStep - 8, framesPerStep],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #2c2c2c 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Caption opacity={captionOpacity} stage={step.stage} level={step.level} />
        <PhoneFrame statusBarTint="dark">
          <MockSkillDemoScreen stageId={step.stage} level={step.level} />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

const STAGE_LABEL: Record<StageId, string> = {
  onboard: 'Onboarding',
  diagnose: 'Diagnose',
  result: 'Result',
  day7: 'Day 7',
  lesson: 'Lesson',
};

const Caption: React.FC<{ opacity: number; stage: StageId; level: Level }> = ({
  opacity,
  stage,
  level,
}) => (
  <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
    <div style={{ fontSize: 18, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 2 }}>
      Stage · {STAGE_LABEL[stage]}
    </div>
    <div
      style={{
        fontSize: 36,
        fontWeight: 700,
        marginTop: 4,
        letterSpacing: -1,
        color: levelColor(level),
      }}
    >
      {LEVEL_LABEL[level]}
    </div>
  </div>
);

function levelColor(l: Level): string {
  if (l === 'novice') return '#90caf9';
  if (l === 'practitioner') return '#ce93d8';
  return '#a5d6a7';
}
