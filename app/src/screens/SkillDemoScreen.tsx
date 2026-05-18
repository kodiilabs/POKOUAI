import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import demoData from '@/data/skill_demo.json';
import { useSkillLevel } from '@/hooks/useSkillLevel';
import type { SkillLevel } from '@/services/farmerAgent';

type Level = SkillLevel;
type StageId = 'onboard' | 'diagnose' | 'result' | 'day7' | 'lesson';

interface OnboardQuestion {
  q: string;
  answer: string;
  infer: string;
}
interface OnboardLevel {
  questions: OnboardQuestion[];
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
type StageContent =
  | { id: 'onboard'; levels: Record<Level, OnboardLevel> }
  | { id: 'diagnose'; levels: Record<Level, DiagnoseLevel> }
  | { id: 'result'; levels: Record<Level, ResultLevel> }
  | { id: 'day7'; levels: Record<Level, Day7Level> }
  | { id: 'lesson'; levels: Record<Level, LessonLevel> };

interface DemoStage {
  id: StageId;
  label: string;
  title: string;
  subtitle: string;
  levels: Record<Level, unknown>;
}

const data = demoData as unknown as {
  scenario: {
    diseaseName: string;
    imageCaption: string;
    environmentalContext: string;
    farmHistory: string;
  };
  stages: DemoStage[];
  agentMemory: Record<Level, string[]>;
  twoTrackNote: string;
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

const LEVEL_ORDER: Level[] = ['novice', 'practitioner', 'expert'];

export default function SkillDemoScreen() {
  const [level, setLevel] = useSkillLevel();
  const [stageIdx, setStageIdx] = useState(0);
  const stage = data.stages[stageIdx] ?? data.stages[0];
  const accent = LEVEL_COLOR[level];
  const memory = useMemo(() => data.agentMemory[level], [level]);

  if (!stage) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.title}>Demo data missing</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Farmer Agent — Skill-Level Adaptation</Text>
        <Text style={styles.subtitle}>
          Same image. Same disease. Three different farmers. Five flow stages. The agent silently
          adapts every prompt, every treatment, every Day-7 follow-up.
        </Text>

        {/* Stage stepper */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperRow}
        >
          {data.stages.map((s, i) => {
            const active = i === stageIdx;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.stepperPill, active && styles.stepperPillActive]}
                onPress={() => setStageIdx(i)}
              >
                <Text style={[styles.stepperIdx, active && styles.stepperIdxActive]}>{i + 1}</Text>
                <Text style={[styles.stepperLabel, active && styles.stepperLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Level switcher */}
        <View style={styles.switcher}>
          {LEVEL_ORDER.map((lv) => {
            const active = lv === level;
            return (
              <TouchableOpacity
                key={lv}
                style={[
                  styles.switchButton,
                  active && { backgroundColor: LEVEL_COLOR[lv], borderColor: LEVEL_COLOR[lv] },
                ]}
                onPress={() => void setLevel(lv)}
              >
                <Text style={[styles.switchLabel, active && styles.switchLabelActive]}>
                  {LEVEL_LABEL[lv]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.persistNote}>
          Skill level persists across the app. Change it from Settings → Agent skill level.
        </Text>

        {/* Stage header */}
        <View style={styles.stageHeader}>
          <Text style={[styles.stageTitle, { color: accent }]}>
            Stage {stageIdx + 1}: {stage.title}
          </Text>
          <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
        </View>

        {/* Scenario card (visible on every stage to preserve video continuity) */}
        <View style={styles.imageCard}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>🍫</Text>
            <Text style={styles.imageBadge}>SAMPLE</Text>
          </View>
          <Text style={styles.imageCaption}>{data.scenario.imageCaption}</Text>
          <Text style={styles.contextLine}>🌧  {data.scenario.environmentalContext}</Text>
          <Text style={styles.contextLine}>📒  {data.scenario.farmHistory}</Text>
        </View>

        {/* Stage-specific content */}
        <StageRenderer stage={stage} level={level} accent={accent} />

        {/* Agent memory footer (constant across stages, changes with level) */}
        <SectionCard accent={accent} title="What the agent has inferred (invisible to farmer)">
          {memory.map((line, i) => (
            <Text key={i} style={styles.memoryLine}>
              · {line}
            </Text>
          ))}
        </SectionCard>

        <Text style={styles.footnote}>{data.twoTrackNote}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StageRenderer({
  stage,
  level,
  accent,
}: {
  stage: DemoStage;
  level: Level;
  accent: string;
}) {
  if (stage.id === 'onboard') {
    const s = stage.levels[level] as OnboardLevel;
    return (
      <>
        <SectionCard accent={accent} title="Voice questions the agent asks">
          {s.questions.map((qa, i) => (
            <View key={i} style={styles.qaBlock}>
              <Text style={styles.qLabel}>Q{i + 1}</Text>
              <Text style={styles.q}>{qa.q}</Text>
              <Text style={styles.aLabel}>Farmer's answer:</Text>
              <Text style={styles.a}>"{qa.answer}"</Text>
              <Text style={styles.inferLabel}>Agent inference:</Text>
              <Text style={[styles.infer, { color: accent }]}>{qa.infer}</Text>
            </View>
          ))}
        </SectionCard>
        <SectionCard accent={accent} title="Initial skill estimate after onboarding">
          <Text style={styles.body1}>{s.initialEstimate}</Text>
        </SectionCard>
      </>
    );
  }
  if (stage.id === 'diagnose') {
    const s = stage.levels[level] as DiagnoseLevel;
    return (
      <>
        <SectionCard accent={accent} title="Farmer Speaks First — prompt heard">
          <Text style={styles.quote}>"{s.fsfPrompt}"</Text>
          <Text style={styles.aLabel}>Example farmer answer:</Text>
          <Text style={styles.a}>"{s.fsfExampleAnswer}"</Text>
        </SectionCard>
        <SectionCard accent={accent} title="Analyzer">
          <View style={styles.tierRow}>
            <Text style={[styles.tierBadge, { color: accent }]}>{s.tierBadge}</Text>
            <Text style={styles.tierMeta}>{s.confidenceBand}</Text>
          </View>
          <Text style={styles.body1}>{s.analyzerStatus}</Text>
        </SectionCard>
        <SectionCard accent={accent} title="What the agent did with the answer">
          <Text style={styles.body1}>{s.agentNote}</Text>
        </SectionCard>
      </>
    );
  }
  if (stage.id === 'result') {
    const s = stage.levels[level] as ResultLevel;
    return (
      <>
        <SectionCard accent={accent} title="Diagnosis delivery">
          <Text style={styles.diagnosisTitle}>{s.diagnosisTitle}</Text>
          <Text style={styles.body1}>{s.diagnosisBody}</Text>
          {s.diagnosisStory ? (
            <Text style={[styles.body1, styles.story]}>{s.diagnosisStory}</Text>
          ) : null}
        </SectionCard>
        <SectionCard accent={accent} title="Treatment recommendation">
          <Text style={styles.diagnosisTitle}>{s.treatmentTitle}</Text>
          {s.treatmentSteps.map((step, i) => (
            <Text key={i} style={styles.step}>
              {step}
            </Text>
          ))}
          {s.treatmentCost ? <Text style={styles.cost}>{s.treatmentCost}</Text> : null}
        </SectionCard>
        <SectionCard accent={accent} title="Money framing — CFA impact">
          <Text style={styles.money}>💰  {s.moneyFraming}</Text>
        </SectionCard>
        <Text style={styles.uiNote}>Design pattern: {s.uiPattern}</Text>
      </>
    );
  }
  if (stage.id === 'day7') {
    const s = stage.levels[level] as Day7Level;
    return (
      <>
        <SectionCard accent={accent} title="Day 7 follow-up prompt">
          <Text style={styles.quote}>"{s.prompt}"</Text>
          <Text style={styles.aLabel}>Example farmer answer:</Text>
          <Text style={styles.a}>"{s.exampleAnswer}"</Text>
        </SectionCard>
        <SectionCard accent={accent} title="Outcome capture">
          <Text style={styles.body1}>{s.outcomeQuestion}</Text>
          <View style={styles.outcomeRow}>
            {s.outcomeOptions.map((opt, i) => (
              <View key={i} style={[styles.outcomeChip, { borderColor: accent }]}>
                <Text style={[styles.outcomeText, { color: accent }]}>{opt}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
        <SectionCard accent={accent} title="Agent skill update from this loop">
          <Text style={styles.body1}>{s.agentUpdate}</Text>
        </SectionCard>
      </>
    );
  }
  // lesson
  const s = stage.levels[level] as LessonLevel;
  return (
    <>
      <SectionCard accent={accent} title="Lesson the farmer recorded">
        <Text style={styles.quote}>"{s.farmerLesson}"</Text>
      </SectionCard>
      <SectionCard accent={accent} title="What the agent extracted">
        <Text style={styles.body1}>{s.agentExtract}</Text>
      </SectionCard>
      <SectionCard accent={accent} title="Skill updates after this loop">
        {s.skillUpdates.map((u, i) => (
          <Text key={i} style={styles.memoryLine}>
            · {u}
          </Text>
        ))}
      </SectionCard>
      <SectionCard accent={accent} title="What changes next session">
        <Text style={styles.body1}>{s.nextSessionChange}</Text>
      </SectionCard>
    </>
  );
}

function SectionCard({
  accent,
  title,
  children,
}: {
  accent: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderLeftColor: accent }]}>
      <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  body: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1b1b1b' },
  subtitle: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 19, marginBottom: 12 },

  stepperRow: { paddingVertical: 4, paddingRight: 16, gap: 8 },
  stepperPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  stepperPillActive: { backgroundColor: '#1b1b1b', borderColor: '#1b1b1b' },
  stepperIdx: {
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#eee',
    color: '#666',
    overflow: 'hidden',
  },
  stepperIdxActive: { backgroundColor: '#fff', color: '#1b1b1b' },
  stepperLabel: { color: '#666', fontWeight: '600', fontSize: 13 },
  stepperLabelActive: { color: '#fff' },

  switcher: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  switchLabel: { fontWeight: '700', color: '#666' },
  switchLabelActive: { color: '#fff' },
  persistNote: { fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 4 },

  stageHeader: { marginTop: 12, marginBottom: 8 },
  stageTitle: { fontSize: 16, fontWeight: '700' },
  stageSubtitle: { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 17 },

  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#3e2723',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imageEmoji: { fontSize: 56 },
  imageBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    color: '#3e2723',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageCaption: { fontSize: 13, color: '#333', marginBottom: 6 },
  contextLine: { fontSize: 12, color: '#666', marginBottom: 2 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: { fontWeight: '700', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 },
  diagnosisTitle: { fontWeight: '700', fontSize: 15, marginBottom: 6, color: '#1b1b1b' },
  body1: { fontSize: 14, color: '#222', lineHeight: 20 },
  story: { fontStyle: 'italic', color: '#444', marginTop: 6 },
  step: { fontSize: 14, color: '#222', lineHeight: 21, marginBottom: 6 },
  cost: { fontSize: 13, color: '#555', marginTop: 4, fontStyle: 'italic' },
  quote: { fontSize: 15, color: '#222', lineHeight: 22, fontStyle: 'italic' },
  qaBlock: { marginBottom: 12 },
  qLabel: { fontSize: 11, color: '#888', fontWeight: '700', marginBottom: 2 },
  q: { fontSize: 14, color: '#222', lineHeight: 19, fontStyle: 'italic', marginBottom: 6 },
  aLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginTop: 4 },
  a: { fontSize: 13, color: '#333', lineHeight: 18, marginBottom: 4 },
  inferLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginTop: 4 },
  infer: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  tierBadge: { fontWeight: '700', fontSize: 14 },
  tierMeta: { color: '#555', fontSize: 13 },
  money: { fontSize: 14, color: '#1b5e20', lineHeight: 21, fontWeight: '500' },
  outcomeRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  outcomeText: { fontWeight: '600', fontSize: 13 },
  memoryLine: { fontSize: 12, color: '#444', lineHeight: 18, marginBottom: 3 },
  uiNote: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  footnote: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
