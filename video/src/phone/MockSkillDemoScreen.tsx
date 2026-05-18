import React from 'react';
import demoJson from '../data/skill_demo.json';

type Level = 'novice' | 'practitioner' | 'expert';
type StageId = 'onboard' | 'diagnose' | 'result' | 'day7' | 'lesson';

interface OnboardLevel {
  questions: { q: string; answer: string; infer: string }[];
  initialEstimate: string;
}
interface DiagnoseLevel {
  fsfPrompt: string;
  fsfExampleAnswer: string;
  analyzerStatus: string;
  tierBadge: string;
  confidenceBand: string;
  agentNote: string;
}
interface ResultLevel {
  diagnosisTitle: string;
  diagnosisBody: string;
  diagnosisStory: string | null;
  treatmentTitle: string;
  treatmentSteps: string[];
  treatmentCost: string | null;
  moneyFraming: string;
  uiPattern: string;
}
interface Day7Level {
  prompt: string;
  exampleAnswer: string;
  outcomeQuestion: string;
  outcomeOptions: string[];
  agentUpdate: string;
}
interface LessonLevel {
  farmerLesson: string;
  agentExtract: string;
  skillUpdates: string[];
  nextSessionChange: string;
}

const data = demoJson as unknown as {
  scenario: {
    diseaseName: string;
    imageCaption: string;
    environmentalContext: string;
    farmHistory: string;
  };
  stages: {
    id: StageId;
    label: string;
    title: string;
    subtitle: string;
    levels: Record<Level, unknown>;
  }[];
  agentMemory: Record<Level, string[]>;
};

const LEVEL_COLOR: Record<Level, string> = {
  novice: '#1565c0',
  practitioner: '#6a1b9a',
  expert: '#2e7d32',
};

const LEVEL_LABEL: Record<Level, string> = {
  novice: 'Novice',
  practitioner: 'Practitioner',
  expert: 'Expert',
};

export const MockSkillDemoScreen: React.FC<{ stageId: StageId; level: Level }> = ({
  stageId,
  level,
}) => {
  const stage = data.stages.find((s) => s.id === stageId) ?? data.stages[0];
  if (!stage) return null;
  const accent = LEVEL_COLOR[level];

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#fafafa',
        padding: 12,
        overflow: 'hidden',
        fontSize: 11,
        lineHeight: 1.35,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1b1b1b' }}>Farmer Agent</div>
      <div style={{ fontSize: 10, color: '#666', marginTop: 2, marginBottom: 8 }}>
        Same disease. Same image. Three farmers.
      </div>

      <StageStepper currentId={stage.id} />

      <LevelSwitcher activeLevel={level} />

      <div style={{ marginTop: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent }}>
          {stage.label}: {stage.title}
        </div>
        <div style={{ fontSize: 9, color: '#666', marginTop: 1 }}>{stage.subtitle}</div>
      </div>

      <ImageCard />

      <StageBody stage={stage} level={level} accent={accent} />
    </div>
  );
};

const StageStepper: React.FC<{ currentId: StageId }> = ({ currentId }) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
    {data.stages.map((s, i) => {
      const active = s.id === currentId;
      return (
        <div
          key={s.id}
          style={{
            flex: 1,
            padding: 6,
            borderRadius: 10,
            backgroundColor: active ? '#1b1b1b' : '#fff',
            color: active ? '#fff' : '#666',
            fontSize: 9,
            fontWeight: 700,
            textAlign: 'center',
            border: active ? 'none' : '1px solid #ddd',
          }}
        >
          {i + 1} {s.label}
        </div>
      );
    })}
  </div>
);

const LevelSwitcher: React.FC<{ activeLevel: Level }> = ({ activeLevel }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {(Object.keys(LEVEL_COLOR) as Level[]).map((lv) => {
      const active = lv === activeLevel;
      return (
        <div
          key={lv}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            border: active ? `2px solid ${LEVEL_COLOR[lv]}` : '2px solid #ccc',
            backgroundColor: active ? LEVEL_COLOR[lv] : '#fff',
            color: active ? '#fff' : '#666',
            fontWeight: 700,
            fontSize: 10,
            textAlign: 'center',
          }}
        >
          {LEVEL_LABEL[lv]}
        </div>
      );
    })}
  </div>
);

const ImageCard: React.FC = () => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 8,
      marginTop: 8,
      marginBottom: 8,
    }}
  >
    <div
      style={{
        height: 70,
        backgroundColor: '#3e2723',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 38 }}>🍫</span>
      <span
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          fontSize: 8,
          fontWeight: 700,
          color: '#3e2723',
          backgroundColor: 'rgba(255,255,255,0.85)',
          padding: '2px 4px',
          borderRadius: 3,
        }}
      >
        SAMPLE
      </span>
    </div>
    <div style={{ fontSize: 9, color: '#333' }}>{data.scenario.imageCaption}</div>
    <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
      🌧 {data.scenario.environmentalContext}
    </div>
  </div>
);

const StageBody: React.FC<{
  stage: { id: StageId; levels: Record<Level, unknown> };
  level: Level;
  accent: string;
}> = ({ stage, level, accent }) => {
  if (stage.id === 'onboard') {
    const s = stage.levels[level] as OnboardLevel;
    const q = s.questions[0]!;
    return (
      <SectionCard accent={accent} title="Voice question">
        <Quote>{q.q}</Quote>
        <Sub>Farmer says:</Sub>
        <FarmerVoice>"{q.answer}"</FarmerVoice>
        <Sub>Agent infers:</Sub>
        <InferLine accent={accent}>{q.infer}</InferLine>
      </SectionCard>
    );
  }
  if (stage.id === 'diagnose') {
    const s = stage.levels[level] as DiagnoseLevel;
    return (
      <>
        <SectionCard accent={accent} title="Farmer speaks first">
          <Quote>{s.fsfPrompt}</Quote>
          <FarmerVoice>"{s.fsfExampleAnswer}"</FarmerVoice>
        </SectionCard>
        <SectionCard accent={accent} title="Analyzer">
          <Body>
            {s.tierBadge} · {s.confidenceBand}
          </Body>
        </SectionCard>
      </>
    );
  }
  if (stage.id === 'result') {
    const s = stage.levels[level] as ResultLevel;
    return (
      <>
        <SectionCard accent={accent} title="Diagnosis">
          <Title>{s.diagnosisTitle}</Title>
          <Body>{s.diagnosisBody.slice(0, 160)}{s.diagnosisBody.length > 160 ? '…' : ''}</Body>
        </SectionCard>
        <SectionCard accent={accent} title="Money">
          <Money>{s.moneyFraming.slice(0, 110)}{s.moneyFraming.length > 110 ? '…' : ''}</Money>
        </SectionCard>
      </>
    );
  }
  if (stage.id === 'day7') {
    const s = stage.levels[level] as Day7Level;
    return (
      <>
        <SectionCard accent={accent} title="Day-7 prompt">
          <Quote>{s.prompt.slice(0, 120)}{s.prompt.length > 120 ? '…' : ''}</Quote>
        </SectionCard>
        <SectionCard accent={accent} title="Outcome">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
            {s.outcomeOptions.map((o, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 8px',
                  borderRadius: 12,
                  border: `1.5px solid ${accent}`,
                  fontSize: 10,
                  fontWeight: 600,
                  color: accent,
                }}
              >
                {o}
              </span>
            ))}
          </div>
        </SectionCard>
      </>
    );
  }
  const s = stage.levels[level] as LessonLevel;
  return (
    <>
      <SectionCard accent={accent} title="Lesson">
        <Quote>{s.farmerLesson}</Quote>
      </SectionCard>
      <SectionCard accent={accent} title="Skill update">
        {s.skillUpdates.slice(0, 2).map((u, i) => (
          <Body key={i}>· {u}</Body>
        ))}
      </SectionCard>
    </>
  );
};

const SectionCard: React.FC<{
  accent: string;
  title: string;
  children: React.ReactNode;
}> = ({ accent, title, children }) => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: 6,
      padding: 8,
      marginBottom: 6,
      borderLeft: `3px solid ${accent}`,
    }}
  >
    <div
      style={{
        fontWeight: 700,
        fontSize: 9,
        textTransform: 'uppercase',
        color: accent,
        marginBottom: 4,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#1b1b1b', marginBottom: 2 }}>
    {children}
  </div>
);
const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 10, color: '#222', marginBottom: 2 }}>{children}</div>
);
const Quote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontStyle: 'italic', color: '#222' }}>"{children}"</div>
);
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginTop: 4 }}>
    {children}
  </div>
);
const FarmerVoice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>{children}</div>
);
const InferLine: React.FC<{ accent: string; children: React.ReactNode }> = ({
  accent,
  children,
}) => <div style={{ fontSize: 10, fontWeight: 600, color: accent }}>{children}</div>;
const Money: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, color: '#1b5e20', fontWeight: 500 }}>💰 {children}</div>
);
