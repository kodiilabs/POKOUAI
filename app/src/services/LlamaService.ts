import * as FileSystem from 'expo-file-system';
import type { DiagnosisResult, LanguageCode } from '@/types';
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

async function loadModule(): Promise<LlamaModule> {
  // Lazy import — the native module only exists on device, not in web/tests
  const mod = (await import('react-native-llama')) as unknown as LlamaModule;
  if (!mod?.initLlama) throw new Error('react-native-llama not available');
  return mod;
}

export async function loadModel(): Promise<LlamaContext> {
  if (llamaCtx) return llamaCtx;
  if (loadInFlight) return loadInFlight;

  loadInFlight = (async () => {
    if (!(await isModelDownloaded())) {
      throw new Error('model not downloaded — call downloadModel() first');
    }
    const mod = await loadModule();
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
