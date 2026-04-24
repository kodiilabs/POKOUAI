import diseases from '@/data/cocoa_diseases.json';
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

interface CalendarEntry {
  month: string;
  title: string;
  actions: string[];
}

const CALENDAR_FR: CalendarEntry[] = [
  { month: 'MAR', title: 'Préparation saison principale', actions: ['Tailler les arbres après récolte', 'Désinfecter les outils', 'Inspecter les parcelles pour swollen shoot'] },
  { month: 'AVR', title: 'Début des pluies', actions: ['Surveillance hebdomadaire black pod', 'Drainer les zones humides', 'Nettoyer les cabosses au sol'] },
  { month: 'MAI', title: 'Saison humide — risque élevé', actions: ['Appliquer bouillie bordelaise toutes les 3 semaines', 'Récolter cabosses mûres rapidement'] },
  { month: 'JUN', title: 'Pic de pression maladie', actions: ['Retirer cabosses noircies immédiatement', 'Brûler ou enterrer les cabosses infectées', 'Vérifier nœuds renflés (VSD)'] },
  { month: 'SEP', title: 'Mi-saison', actions: ['Deuxième traitement cuivre', 'Contrôle cochenilles (vecteur swollen shoot)'] },
  { month: 'OCT', title: 'Humidité remontante', actions: ['Vigilance black pod', 'Inspection cochenilles avant pluies'] },
  { month: 'DEC', title: 'Récolte principale', actions: ['Récolte régulière (hebdomadaire)', 'Sanitation stricte des parcelles'] },
];

const CALENDAR_EN: CalendarEntry[] = [
  { month: 'MAR', title: 'Main season prep', actions: ['Prune trees after harvest', 'Disinfect tools', 'Inspect plots for swollen shoot'] },
  { month: 'APR', title: 'Rains begin', actions: ['Weekly black pod monitoring', 'Drain wet areas', 'Clear fallen pods'] },
  { month: 'MAY', title: 'Wet season — high risk', actions: ['Apply Bordeaux mixture every 3 weeks', 'Harvest ripe pods quickly'] },
  { month: 'JUN', title: 'Disease pressure peak', actions: ['Remove blackened pods immediately', 'Burn or bury infected pods', 'Check for swollen branch nodes (VSD)'] },
  { month: 'SEP', title: 'Mid-season', actions: ['Second copper treatment', 'Mealybug control (swollen shoot vector)'] },
  { month: 'OCT', title: 'Humidity returns', actions: ['Black pod vigilance', 'Mealybug inspection before rains'] },
  { month: 'DEC', title: 'Main harvest', actions: ['Weekly harvest rhythm', 'Strict plot sanitation'] },
];

export function getCalendar(crop: string, lang: string): CalendarEntry[] {
  if (crop !== 'cocoa') return [];
  if (lang === 'en') return CALENDAR_EN;
  return CALENDAR_FR;
}

export interface QuizQuestion {
  text: string;
  keywords: string[];
}

const QUIZ_BANK_FR: Partial<Record<DiseaseId, QuizQuestion[]>> = {
  black_pod: [
    { text: 'Quels sont les 3 signes précoces de la pourriture brune ?', keywords: ['tache', 'brun', 'noir', 'mycélium', 'blanc'] },
    { text: 'Que faire immédiatement avec une cabosse infectée ?', keywords: ['retirer', 'brûler', 'enterrer'] },
  ],
  swollen_shoot: [
    { text: 'Quel insecte transmet le swollen shoot ?', keywords: ['cochenille'] },
    { text: 'Existe-t-il un traitement curatif ?', keywords: ['non', 'aucun', 'arracher'] },
  ],
  vascular_streak_dieback: [
    { text: 'À quelle distance de la zone infectée faut-il tailler ?', keywords: ['30', 'cm', 'centim'] },
  ],
};

const QUIZ_BANK_EN: Partial<Record<DiseaseId, QuizQuestion[]>> = {
  black_pod: [
    { text: 'What are the 3 early signs of black pod rot?', keywords: ['brown', 'spot', 'black', 'mycelium', 'white'] },
    { text: 'What should you do immediately with an infected pod?', keywords: ['remove', 'burn', 'bury'] },
  ],
  swollen_shoot: [
    { text: 'Which insect transmits swollen shoot virus?', keywords: ['mealybug'] },
    { text: 'Is there a curative treatment?', keywords: ['no', 'none', 'uproot'] },
  ],
  vascular_streak_dieback: [
    { text: 'How far below the infected area should you prune?', keywords: ['30', 'cm'] },
  ],
};

const FALLBACK: QuizQuestion = {
  text: 'Citez une mesure de prévention que vous pouvez appliquer cette semaine.',
  keywords: ['récolt', 'harvest', 'taille', 'prune', 'nettoy', 'clean'],
};

export function pickQuizQuestion(disease: DiseaseId, lang: string): QuizQuestion {
  const bank = lang === 'en' ? QUIZ_BANK_EN : QUIZ_BANK_FR;
  const pool = bank[disease] ?? [];
  if (pool.length === 0) return FALLBACK;
  return pool[Math.floor(Math.random() * pool.length)] ?? FALLBACK;
}
