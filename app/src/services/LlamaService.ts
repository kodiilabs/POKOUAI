import * as FileSystem from 'expo-file-system/legacy';
import diseases from '@/data/cocoa_diseases.json';
import type { DiagnosisResult, DiseaseId, LanguageCode } from '@/types';
import { buildComparisonPromptSingle, buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';

const MODEL_VERSION = 'cocoa_v1_e2b';
const MOCK_VERSION = 'cocoa_v1_e2b-MOCK';

let isMockMode = false;
export function isRunningMock(): boolean {
  return isMockMode;
}
const MODEL_FILENAME = 'cocoa_v1_e2b.gguf';
const MMPROJ_FILENAME = 'cocoa_v1_e2b-mmproj.gguf';
const MODEL_URL = 'https://huggingface.co/pokou-ai/cocoa-v1-gguf/resolve/main/cocoa_v1_e2b.gguf';
const MMPROJ_URL = 'https://huggingface.co/pokou-ai/cocoa-v1-gguf/resolve/main/cocoa_v1_e2b-mmproj.gguf';
export const MODEL_SIZE_MB = 3200;
export const MMPROJ_SIZE_MB = 880;

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
  /** Optional in older versions of llama.rn; required for vision input */
  initMultimodal?: (params: { path: string; use_gpu?: boolean }) => Promise<void>;
  release: () => Promise<void>;
}

let llamaCtx: LlamaContext | null = null;
let loadInFlight: Promise<LlamaContext> | null = null;

function modelLocalPath(): string {
  const dir = FileSystem.documentDirectory ?? '';
  return `${dir}${MODEL_FILENAME}`;
}

function mmprojLocalPath(): string {
  const dir = FileSystem.documentDirectory ?? '';
  return `${dir}${MMPROJ_FILENAME}`;
}

async function fileExists(path: string, minSize = 1_000_000): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && info.size !== undefined && info.size > minSize;
}

export async function isModelDownloaded(): Promise<boolean> {
  return fileExists(modelLocalPath());
}

export async function isMmprojDownloaded(): Promise<boolean> {
  return fileExists(mmprojLocalPath(), 100_000);
}

/** True if inference can run *now*: either the GGUF is downloaded, or the
 *  native module is unavailable (simulator / web → falls back to mock). */
export async function isModelReady(): Promise<boolean> {
  if (await isModelDownloaded()) return true;
  return (await loadModule()) === null;
}

async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const task = FileSystem.createDownloadResumable(url, destPath, {}, (progress) => {
    if (onProgress && progress.totalBytesExpectedToWrite > 0) {
      onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    }
  });
  const res = await task.downloadAsync();
  if (!res?.uri) throw new Error(`download failed: ${url}`);
  return res.uri;
}

export async function downloadModel(onProgress?: (pct: number) => void): Promise<string> {
  return downloadFile(MODEL_URL, modelLocalPath(), onProgress);
}

export async function downloadMmproj(onProgress?: (pct: number) => void): Promise<string> {
  return downloadFile(MMPROJ_URL, mmprojLocalPath(), onProgress);
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

/** Detect the user's language from the prompt content so the mock can return
 *  content in the right language. The user-prompt strings are language-tagged
 *  in promptBuilder; we match on stable substrings. */
function detectLang(prompt: string): LanguageCode {
  if (prompt.includes('[FR→DYU')) return 'dyu';
  if (prompt.includes('[FR→BCI')) return 'bci';
  if (/Look at this cocoa pod|Compare with photo 2|7 days later|7 days ago/i.test(prompt)) {
    return 'en';
  }
  return 'fr';
}

function pickStr(m: Record<string, string>, lang: LanguageCode): string {
  return m[lang] ?? m.fr;
}
function pickArr(m: Record<string, string[]>, lang: LanguageCode): string[] {
  return m[lang] ?? m.fr ?? [];
}

function mockDiagnosisText(imagePath: string, lang: LanguageCode): string {
  const id = MOCK_DISEASES[hashStr(imagePath) % MOCK_DISEASES.length];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = (diseases as any).diseases?.[id];
  if (!e) return 'MALADIE: Non identifié';
  return [
    `MALADIE: ${pickStr(e.names, lang)}`,
    `SYMPTOMES:\n- ${pickArr(e.symptoms, lang).join('\n- ')}`,
    `TRAITEMENT:\n- ${pickArr(e.treatment, lang).join('\n- ')}`,
    `PREVENTION:\n- ${pickArr(e.prevention, lang).join('\n- ')}`,
    `AGRONOME: ${pickStr(e.when_to_call_agronomist, lang)}`,
  ].join('\n');
}

const COMPARE_VERDICTS: Record<LanguageCode, string[]> = {
  fr: ['stabilisé', 'guéri', 'aggravé', 'incertain'],
  en: ['stabilised', 'healed', 'worsened', 'uncertain'],
  dyu: ['[FR→DYU à valider] stabilisé', '[FR→DYU à valider] guéri', '[FR→DYU à valider] aggravé', '[FR→DYU à valider] incertain'],
  bci: ['[FR→BCI à valider] stabilisé', '[FR→BCI à valider] guéri', '[FR→BCI à valider] aggravé', '[FR→BCI à valider] incertain'],
};

const COMPARE_BODY: Record<LanguageCode, { commentaire: string; actions: string; lecon: string }> = {
  fr: {
    commentaire: "Comparaison des deux photos prises à 7 jours d'intervalle.",
    actions: 'Continuez la surveillance et la sanitation hebdomadaire.',
    lecon: 'Après 3 jours de pluie, inspecter les cabosses ombragées sous 48h.',
  },
  en: {
    commentaire: 'Comparison of the two photos taken 7 days apart.',
    actions: 'Keep up weekly monitoring and plot sanitation.',
    lecon: 'After 3 rainy days, inspect shaded pods within 48 hours.',
  },
  dyu: {
    commentaire: '[FR→DYU à valider] Comparaison des deux photos.',
    actions: '[FR→DYU à valider] Surveillance hebdomadaire.',
    lecon: '[FR→DYU à valider] Inspecter les cabosses ombragées après pluie.',
  },
  bci: {
    commentaire: '[FR→BCI à valider] Comparaison des deux photos.',
    actions: '[FR→BCI à valider] Surveillance hebdomadaire.',
    lecon: '[FR→BCI à valider] Inspecter les cabosses ombragées après pluie.',
  },
};

function mockComparisonText(imagePath: string, lang: LanguageCode): string {
  const verdicts = COMPARE_VERDICTS[lang];
  const body = COMPARE_BODY[lang];
  const v = verdicts[hashStr(imagePath) % verdicts.length];
  return [
    `EVOLUTION: ${v}`,
    `COMMENTAIRE: ${body.commentaire}`,
    `ACTIONS: ${body.actions}`,
    `LECON: ${body.lecon}`,
  ].join('\n');
}

function mockContext(): LlamaContext {
  return {
    completion: async (params) => {
      const lang = detectLang(params.prompt);
      const isComparison = /EVOLUTION:|two photos|7 jours|7 days/i.test(params.prompt);
      const path = params.image_path ?? '';
      return {
        text: isComparison ? mockComparisonText(path, lang) : mockDiagnosisText(path, lang),
      };
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
      console.warn('[LlamaService] llama.rn not available — using MOCK');
      isMockMode = true;
      llamaCtx = mockContext();
      return llamaCtx;
    }
    if (!(await isModelDownloaded())) {
      console.warn('[LlamaService] GGUF not on device — using MOCK');
      isMockMode = true;
      llamaCtx = mockContext();
      return llamaCtx;
    }
    try {
      console.log('[LlamaService] initLlama on', modelLocalPath());
      const ctx = await mod.initLlama({
        model: modelLocalPath(),
        n_ctx: 2048,
        n_gpu_layers: 0,
        n_threads: 4,
      });
      console.log('[LlamaService] ✓ main model loaded');
      if (ctx.initMultimodal && (await isMmprojDownloaded())) {
        try {
          await ctx.initMultimodal({ path: mmprojLocalPath(), use_gpu: false });
          console.log('[LlamaService] ✓ mmproj loaded');
        } catch (e) {
          console.warn('[LlamaService] initMultimodal failed — text-only', e);
        }
      }
      isMockMode = false;
      llamaCtx = ctx;
      return ctx;
    } catch (err) {
      console.error('[LlamaService] initLlama threw — falling back to MOCK', err);
      isMockMode = true;
      llamaCtx = mockContext();
      return llamaCtx;
    }
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
  const version = isMockMode ? MOCK_VERSION : MODEL_VERSION;
  return parseResponse(result.text, confidence, version, latencyMs);
}

function estimateConfidence(text: string): number {
  // Placeholder: a real implementation reads logprobs from the completion.
  // Mock mode caps at 0.65 — structurally consistent canned text shouldn't
  // claim 100%. Real-model path caps at 0.9 because heuristic still
  // can't measure true confidence; we vary slightly per response shape.
  const sections = ['MALADIE:', 'SYMPTOMES:', 'TRAITEMENT:', 'PREVENTION:'];
  const present = sections.filter((s) => text.includes(s)).length;
  const base = present / sections.length;
  if (/incertain|non analysable|non identifi/i.test(text)) return Math.min(base * 0.5, 0.4);
  const cap = isMockMode ? 0.65 : 0.9;
  // Slight per-response jitter so the band varies across diagnoses
  const jitter = (text.length % 10) / 100;
  return Math.max(0.5, Math.min(cap, base * cap + jitter));
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
    modelVersion: isMockMode ? `${MOCK_VERSION}-compare` : `${MODEL_VERSION}-compare-1img`,
    latencyMs: Date.now() - started,
  };
}

export const __test = { estimateConfidence };
