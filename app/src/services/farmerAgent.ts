import AsyncStorage from '@react-native-async-storage/async-storage';

export type SkillLevel = 'novice' | 'practitioner' | 'expert';
export type SkillSignal =
  | 'diagnosis_hypothesis_correct'
  | 'treatment_within_48h'
  | 'caught_early'
  | 'mentioned_prevention'
  | 'plot_specific_observation';

const KEYS = {
  level: 'pokouai.agent.skill_level',
  tally: 'pokouai.agent.signal_tally',
  lastUpdated: 'pokouai.agent.last_updated',
} as const;

const DEFAULT_LEVEL: SkillLevel = 'novice';

export const SKILL_LEVELS: readonly SkillLevel[] = ['novice', 'practitioner', 'expert'];

const EMPTY_TALLY: Record<SkillSignal, number> = {
  diagnosis_hypothesis_correct: 0,
  treatment_within_48h: 0,
  caught_early: 0,
  mentioned_prevention: 0,
  plot_specific_observation: 0,
};

export async function getSkillLevel(): Promise<SkillLevel> {
  const v = (await AsyncStorage.getItem(KEYS.level)) as SkillLevel | null;
  return v && SKILL_LEVELS.includes(v) ? v : DEFAULT_LEVEL;
}

export async function setSkillLevel(level: SkillLevel): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.level, level],
    [KEYS.lastUpdated, new Date().toISOString()],
  ]);
}

export async function getSignalTally(): Promise<Record<SkillSignal, number>> {
  const raw = await AsyncStorage.getItem(KEYS.tally);
  if (!raw) return { ...EMPTY_TALLY };
  try {
    const parsed = JSON.parse(raw) as Partial<Record<SkillSignal, number>>;
    return { ...EMPTY_TALLY, ...parsed };
  } catch {
    return { ...EMPTY_TALLY };
  }
}

/**
 * Record a behavioral signal. v1 stores the tally — does not auto-promote. Promotion
 * logic is intentionally out of scope until REQ-TBD (Farmer Agent) — see
 * docs/PokouAI_Future_of_Learning.md "How Skill Levels Change."
 */
export async function recordSignal(signal: SkillSignal): Promise<void> {
  const tally = await getSignalTally();
  tally[signal] = tally[signal] + 1;
  await AsyncStorage.multiSet([
    [KEYS.tally, JSON.stringify(tally)],
    [KEYS.lastUpdated, new Date().toISOString()],
  ]);
}

export async function getLastUpdated(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.lastUpdated);
}

export async function resetAgent(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.level, KEYS.tally, KEYS.lastUpdated]);
}
