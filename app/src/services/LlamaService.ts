import * as FileSystem from 'expo-file-system/legacy';
import diseases from '@/data/cocoa_diseases.json';
import type { DiagnosisResult, DiseaseId, LanguageCode } from '@/types';
import { buildComparisonPromptSingle, buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';

const MODEL_VERSION = 'cocoa_v1_e2b';
const MODEL_FILENAME = 'cocoa_v1_e2b.gguf';
const MODEL_URL = 'https://huggingface.co/pokou-ai/cocoa-v1-gguf/resolve/main/cocoa_v1_e2b.gguf';
export const MODEL_SIZE_MB = 1500;

type LlamaModule = {
  initLlama: (config: {
    model: string;
    n_ctx?: number;
    n_gpu_layers?: number;
    n_threads?: number;
  }) => Promise<LlamaContext>;
};

interface LlamaContext {
  completion: (params: {
    prompt: string;
    image_path?: string;
    n_predict?: number;
    temperature?: number;
    stop?: string[];
  }) => Promise<{ text: string; timings?: { predicted_per_second: number } }>;
  release: () => Promise<void>;
}

let llamaCtx: LlamaContext | null = null;
let loadInFlight: Promise<LlamaContext> | null = null;

function modelLocalPath(): string {
  const dir = FileSystem.documentDirectory ?? '';
  return `${dir}${MODEL_FILENAME}`;
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(modelLocalPath());
  return info.exists && info.size !== undefined && info.size > 1_000_000;
}

/** True if inference can run *now*: either the GGUF is downloaded, or the
 *  native module is unavailable (simulator / web → falls back to mock). */
export async function isModelReady(): Promise<boolean> {
  if (await isModelDownloaded()) return true;
  return (await loadModule()) === null;
}

export async function downloadModel(onProgress?: (pct: number) => void): Promise<string> {
  const path = modelLocalPath();
  const task = FileSystem.createDownloadResumable(
    MODEL_URL,
    path,
    {},
    (progress) => {
      if (onProgress && progress.totalBytesExpectedToWrite > 0) {
        onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    },
  );
  const res = await task.downloadAsync();
  if (!res?.uri) throw new Error('model download failed');
  return res.uri;
}

async function loadModule(): Promise<LlamaModule | null> {
  try {
    const mod = (await import('llama.rn')) as unknown as LlamaModule;
    return mod?.initLlama ? mod : null;
  } catch {
    return null;
  }
}

/** Demo-mode mock used when the native llama.rn module isn't loaded.
 *  Picks a disease deterministically from the image path so the same photo
 *  yields the same diagnosis across runs (and different photos vary). Builds
 *  the response from the actual cocoa_diseases.json content. */
const MOCK_DISEASES: DiseaseId[] = [
  'black_pod',
  'frosty_pod_rot',
  'swollen_shoot',
  'vascular_streak_dieback',
  'healthy',
  'other_damage',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mockDiagnosisText(imagePath: string): string {
  const id = MOCK_DISEASES[hashStr(imagePath) % MOCK_DISEASES.length];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = (diseases as any).diseases?.[id];
  if (!e) return 'MALADIE: Non identifié';
  const fr = (m: { fr: string[] }) => m.fr;
  return [
    `MALADIE: ${e.names.fr}`,
    `SYMPTOMES:\n- ${fr(e.symptoms).join('\n- ')}`,
    `TRAITEMENT:\n- ${fr(e.treatment).join('\n- ')}`,
    `PREVENTION:\n- ${fr(e.prevention).join('\n- ')}`,
    `AGRONOME: ${e.when_to_call_agronomist.fr}`,
  ].join('\n');
}

function mockComparisonText(imagePath: string): string {
  // Vary the EVOLUTION verdict per image so the demo isn't always "stabilisé"
  const verdicts = ['stabilisé', 'guéri', 'aggravé', 'incertain'];
  const v = verdicts[hashStr(imagePath) % verdicts.length];
  return [
    `EVOLUTION: ${v}`,
    "COMMENTAIRE: Comparaison des deux photos prises à 7 jours d'intervalle.",
    'ACTIONS: Continuez la surveillance et la sanitation hebdomadaire.',
    'LECON: Après 3 jours de pluie, inspecter les cabosses ombragées sous 48h.',
  ].join('\n');
}

function mockContext(): LlamaContext {
  return {
    completion: async (params) => {
      const isComparison = /EVOLUTION:|two photos|7 jours/i.test(params.prompt);
      const path = params.image_path ?? '';
      return { text: isComparison ? mockComparisonText(path) : mockDiagnosisText(path) };
    },
    release: async () => {},
  };
}

export async function loadModel(): Promise<LlamaContext> {
  if (llamaCtx) return llamaCtx;
  if (loadInFlight) return loadInFlight;

  loadInFlight = (async () => {
    const mod = await loadModule();
    if (!mod) {
      // Native module not present (simulator / web / test) — return canned diagnosis
      // so the rest of the app can be exercised. Real device with llama.rn falls
      // through to the real path below.
      llamaCtx = mockContext();
      return llamaCtx;
    }
    if (!(await isModelDownloaded())) {
      throw new Error('model not downloaded — call downloadModel() first');
    }
    const ctx = await mod.initLlama({
      model: modelLocalPath(),
      n_ctx: 2048,
      n_gpu_layers: 0,
      n_threads: 4,
    });
    llamaCtx = ctx;
    return ctx;
  })();

  try {
    return await loadInFlight;
  } finally {
    loadInFlight = null;
  }
}

export async function unloadModel(): Promise<void> {
  if (llamaCtx) {
    await llamaCtx.release();
    llamaCtx = null;
  }
}

export async function diagnose(imageUri: string, language: LanguageCode): Promise<DiagnosisResult> {
  const ctx = await loadModel();
  const prompt = buildPrompt(imageUri, language);
  const full = `${prompt.system}\n\n${prompt.user}`;

  const started = Date.now();
  const result = await ctx.completion({
    prompt: full,
    image_path: imageUri,
    n_predict: 400,
    temperature: 0.2,
    stop: ['</s>', '<end_of_turn>'],
  });
  const latencyMs = Date.now() - started;

  const confidence = estimateConfidence(result.text);
  return parseResponse(result.text, confidence, MODEL_VERSION, latencyMs);
}

function estimateConfidence(text: string): number {
  // Placeholder: a real implementation reads logprobs from the completion.
  // Heuristic: structured responses with all 4 sections present → high.
  const sections = ['MALADIE:', 'SYMPTOMES:', 'TRAITEMENT:', 'PREVENTION:'];
  const present = sections.filter((s) => text.includes(s)).length;
  const base = present / sections.length;
  if (/incertain|non analysable|non identifi/i.test(text)) return Math.min(base * 0.6, 0.45);
  return Math.max(0.5, base);
}

export interface ComparisonResult {
  text: string;
  modelVersion: string;
  latencyMs: number;
}

/** Local llama.cpp can only handle one image; we feed it the day-7 photo with comparison-aware prompt. */
export async function compareLocal(
  _beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
): Promise<ComparisonResult> {
  const ctx = await loadModel();
  const prompt = buildComparisonPromptSingle(afterUri, language, diseaseName);
  const full = `${prompt.system}\n\n${prompt.user}`;

  const started = Date.now();
  const result = await ctx.completion({
    prompt: full,
    image_path: afterUri,
    n_predict: 250,
    temperature: 0.2,
    stop: ['</s>', '<end_of_turn>'],
  });
  return {
    text: result.text,
    modelVersion: `${MODEL_VERSION}-compare-1img`,
    latencyMs: Date.now() - started,
  };
}

export const __test = { estimateConfidence };
