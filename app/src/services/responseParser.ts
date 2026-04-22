import type { ConfidenceBand, DiagnosisResult, DiseaseId } from '@/types';

const DISEASE_KEYWORDS: Array<{ id: DiseaseId; patterns: RegExp[] }> = [
  { id: 'black_pod', patterns: [/pourriture brune/i, /black pod/i] },
  { id: 'frosty_pod_rot', patterns: [/pourriture givr/i, /frosty pod/i, /monilia/i] },
  { id: 'swollen_shoot', patterns: [/swollen shoot/i, /cssv/i, /gonflement/i] },
  { id: 'vascular_streak_dieback', patterns: [/vascular streak/i, /dépérissement/i, /\bvsd\b/i] },
  { id: 'healthy', patterns: [/cabosse saine/i, /healthy pod/i, /\bsaine\b/i] },
  { id: 'other_damage', patterns: [/dommage/i, /unidentified/i, /non identif/i] },
];

function extractSection(raw: string, label: string): string | null {
  const re = new RegExp(`${label}\\s*:\\s*([\\s\\S]*?)(?=\\n[A-ZÉÀ]+\\s*:|$)`, 'i');
  const match = raw.match(re);
  return match?.[1]?.trim() ?? null;
}

function extractListSection(raw: string, label: string): string[] {
  const section = extractSection(raw, label);
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
  const diseaseName = extractSection(raw, 'MALADIE') ?? 'Non identifié';
  const disease = classifyDisease(diseaseName);
  const symptoms = extractListSection(raw, 'SYMPTOMES');
  const treatment = extractListSection(raw, 'TRAITEMENT');
  const prevention = extractListSection(raw, 'PREVENTION');
  const agronomist = extractSection(raw, 'AGRONOME') ?? '';

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
