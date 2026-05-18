import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { TitleScene } from '../scenes/TitleScene';
import { ProblemScene } from '../scenes/ProblemScene';
import { HomeRevealScene } from '../scenes/HomeRevealScene';
import { SkillDemoScene, SKILL_DEMO_TOTAL_FRAMES } from '../scenes/SkillDemoScene';
import { ArchitectureScene } from '../scenes/ArchitectureScene';
import { DiagnosisScene } from '../scenes/DiagnosisScene';
import { FieldScene, FIELD_SCENE_FRAMES } from '../scenes/FieldScene';
import { OutroScene } from '../scenes/OutroScene';

// Flip these to false to render without audio (useful for fast iteration).
// Files live in video/public/audio/.
const VOICE_ENABLED = true;
const MUSIC_ENABLED = true;
const VOICE_SRC = 'audio/voice.mp3';
const MUSIC_SRC = 'audio/music.mp3';
const MUSIC_VOLUME = 0.12;

// 30 fps timing — all in frames.
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const TITLE = s(5);
const PROBLEM = s(7);
const HOME = s(5);
const SKILL_DEMO = SKILL_DEMO_TOTAL_FRAMES; // 15 (stage × level) steps × 45 frames = 22.5 s
const ARCH = s(7);
const DIAGNOSIS = s(7);
const FIELD = FIELD_SCENE_FRAMES; // 15 s — Ivorian cocoa-farmer photos
const OUTRO = s(9);

const T0 = 0;
const T1 = T0 + TITLE;
const T2 = T1 + PROBLEM;
const T3 = T2 + HOME;
const T4 = T3 + SKILL_DEMO;
const T5 = T4 + ARCH;
const T6 = T5 + DIAGNOSIS;
const T7 = T6 + FIELD;
export const TOTAL_FRAMES = T7 + OUTRO;

export const PokouAIAutoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence from={T0} durationInFrames={TITLE}>
        <TitleScene />
      </Sequence>
      <Sequence from={T1} durationInFrames={PROBLEM}>
        <ProblemScene />
      </Sequence>
      <Sequence from={T2} durationInFrames={HOME}>
        <HomeRevealScene />
      </Sequence>
      <Sequence from={T3} durationInFrames={SKILL_DEMO}>
        <SkillDemoScene />
      </Sequence>
      <Sequence from={T4} durationInFrames={ARCH}>
        <ArchitectureScene />
      </Sequence>
      <Sequence from={T5} durationInFrames={DIAGNOSIS}>
        <DiagnosisScene />
      </Sequence>
      <Sequence from={T6} durationInFrames={FIELD}>
        <FieldScene />
      </Sequence>
      <Sequence from={T7} durationInFrames={OUTRO}>
        <OutroScene />
      </Sequence>
      {VOICE_ENABLED ? <Audio src={staticFile(VOICE_SRC)} /> : null}
      {MUSIC_ENABLED ? <Audio src={staticFile(MUSIC_SRC)} volume={MUSIC_VOLUME} /> : null}
    </AbsoluteFill>
  );
};
