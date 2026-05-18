import type { ConfidenceBand, DiagnosisResult, DiseaseId } from '@/types';

const DISEASE_KEYWORDS: Array<{ id: DiseaseId; patterns: RegExp[] }> = [
  { id: 'black_pod', patterns: [/pourriture brune/i, /black pod/i] },
  { id: 'frosty_pod_rot', patterns: [/pourriture givr/i, /frosty pod/i, /monilia/i] },
  { id: 'swollen_shoot', patterns: [/swollen shoot/i, /cssv/i, /gonflement/i] },
  { id: 'vascular_streak_dieback', patterns: [/vascular streak/i, /dépérissement/i, /\bvsd\b/i] },
  { id: 'healthy', patterns: [/cabosse saine/i, /healthy pod/i, /\bsaine\b/i] },
  { id: 'other_damage', patterns: [/dommage/i, /unidentified/i, /non identif/i] },
];

/** Header aliases — first match wins. Add new languages here as they ship. */
const HEADER_ALIASES = {
  disease: ['MALADIE', 'DISEASE'],
  symptoms: ['SYMPTOMES', 'SYMPTOMS'],
  treatment: ['TRAITEMENT', 'TREATMENT'],
  prevention: ['PREVENTION'], // same word in fr + en
  agronomist: ['AGRONOME', 'AGRONOMIST'],
} as const;

function extractSection(raw: string, labels: readonly string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*:\\s*([\\s\\S]*?)(?=\\n[A-ZÉÀ]+\\s*:|$)`, 'i');
    const match = raw.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractListSection(raw: string, labels: readonly string[]): string[] {
  const section = extractSection(raw, labels);
  if (!section) return [];
  return section
    .split(/\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function classifyDisease(diseaseName: string): DiseaseId {
  for (const { id, patterns } of DISEASE_KEYWORDS) {
    if (patterns.some((p) => p.test(diseaseName))) return id;
  }
  return 'other_damage';
}

function bandFor(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.55) return 'medium';
  return 'low';
}

export function parseResponse(
  raw: string,
  confidence: number,
  modelVersion: string,
  latencyMs: number,
): DiagnosisResult {
  // Empty when no header / no value parsed. UI substitutes a localized
  // "not identified" label so the stored string is never language-bound.
  const diseaseName = extractSection(raw, HEADER_ALIASES.disease) ?? '';
  const disease = classifyDisease(diseaseName);
  const symptoms = extractListSection(raw, HEADER_ALIASES.symptoms);
  const treatment = extractListSection(raw, HEADER_ALIASES.treatment);
  const prevention = extractListSection(raw, HEADER_ALIASES.prevention);
  const agronomist = extractSection(raw, HEADER_ALIASES.agronomist) ?? '';

  return {
    disease,
    diseaseName,
    confidence,
    confidenceBand: bandFor(confidence),
    symptoms,
    treatment,
    prevention,
    whenToCallAgronomist: agronomist,
    rawResponse: raw,
    modelVersion,
    latencyMs,
  };
}
