import diseases from '@/data/cocoa_diseases.json';
import calendarCfg from '@/data/prompts/calendar.json';
import quizCfg from '@/data/prompts/quiz.json';
import type { DiseaseId } from '@/types';

type LangMap = { fr: string[]; en: string[]; dyu: string[]; bci: string[] };

interface DiseaseEntry {
  id: DiseaseId;
  symptoms: LangMap;
  prevention: LangMap;
  treatment: LangMap;
}

function pickLang(m: LangMap, lang: string): string[] {
  if (lang === 'en') return m.en;
  if (lang === 'dyu') return m.dyu;
  if (lang === 'bci') return m.bci;
  return m.fr;
}

function entry(id: DiseaseId): DiseaseEntry | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (diseases as any).diseases?.[id];
  return raw ?? null;
}

export interface Causes {
  conditions: string[];
  contributing: string[];
  nextSeason: string[];
}

export function getCauses(disease: DiseaseId, lang: string): Causes {
  const e = entry(disease);
  if (!e) return { conditions: [], contributing: [], nextSeason: [] };
  const symptoms = pickLang(e.symptoms, lang);
  const prevention = pickLang(e.prevention, lang);
  return {
    conditions: symptoms.slice(0, 3),
    contributing: prevention.slice(0, 2),
    nextSeason: prevention.slice(0, 4),
  };
}

export function getSources(disease: DiseaseId): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (diseases as any).diseases?.[disease];
  return Array.isArray(raw?.sources) ? raw.sources : [];
}

interface CalendarEntry {
  month: string;
  title: string;
  actions: string[];
}

export function getCalendar(crop: string, lang: string): CalendarEntry[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cropCfg = (calendarCfg as any).by_crop?.[crop];
  if (!cropCfg) return [];
  const langKey = lang === 'en' ? 'en' : 'fr';
  return (cropCfg[langKey] ?? []) as CalendarEntry[];
}

export interface QuizQuestion {
  text: string;
  keywords: string[];
}

export function pickQuizQuestion(disease: DiseaseId, lang: string): QuizQuestion {
  const langKey = lang === 'en' ? 'en' : 'fr';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDisease = (quizCfg as any).by_disease ?? {};
  const pool: QuizQuestion[] = byDisease[disease]?.[langKey] ?? [];
  if (pool.length > 0) {
    return (pool[Math.floor(Math.random() * pool.length)] ?? pool[0]) as QuizQuestion;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallback = (quizCfg as any).fallback?.[langKey] as QuizQuestion;
  return fallback;
}
