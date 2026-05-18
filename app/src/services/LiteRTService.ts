import * as FileSystem from 'expo-file-system/legacy';
import type { DiagnosisResult, LanguageCode } from '@/types';
import { buildComparisonPromptSingle, buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';

const FINETUNE_FILENAME = 'cocoa_v1_e2b.litertlm';
const UPSTREAM_FILENAME = 'gemma-3n-e2b-int4.litertlm';

const VERSION_FT = 'cocoa_v1_e2b-litert';
const VERSION_BASE = 'gemma-3n-e2b-int4-litert';
const VERSION_FT_COMPARE = `${VERSION_FT}-compare-1img`;
const VERSION_BASE_COMPARE = `${VERSION_BASE}-compare-1img`;

const COMPLETION_TIMEOUT_MS = 90_000;
const UNLOAD_IDLE_MS = 30_000;

type Backend = 'cpu' | 'gpu' | 'npu';
type LLMConfig = {
  systemPrompt?: string;
  backend?: Backend;
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
};
interface LiteRTLMInstance {
  loadModel: (path: string, cfg?: LLMConfig) => Promise<void>;
  sendMessage: (msg: string) => Promise<string>;
  sendMessageWithImage: (msg: string, imagePath: string) => Promise<string>;
  resetConversation: () => void;
  isReady: () => boolean;
  getStats: () => { tokensPerSecond: number; completionTokens: number; timeToFirstToken: number };
  close: () => void;
}
type LiteRTModule = {
  createLLM: (opts?: { enableMemoryTracking?: boolean }) => LiteRTLMInstance;
  getRecommendedBackend: () => Backend;
  checkMultimodalSupport: () => string | undefined;
};

let llm: LiteRTLMInstance | null = null;
let loadedFrom: 'finetune' | 'upstream' | null = null;
let loadInFlight: Promise<{ llm: LiteRTLMInstance; from: 'finetune' | 'upstream' }> | null = null;
let unloadTimer: ReturnType<typeof setTimeout> | null = null;

function docDir(): string {
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error('FileSystem.documentDirectory is null');
  return dir;
}
// Paths with `file://` scheme — for expo-file-system APIs.
function finetunePath(): string {
  return `${docDir()}${FINETUNE_FILENAME}`;
}
function upstreamPath(): string {
  return `${docDir()}${UPSTREAM_FILENAME}`;
}
// Native LiteRT-LM engine wants plain paths — it stat(2)s the string and
// fails with errno 2 if the `file://` prefix is left in.
function toNative(uriPath: string): string {
  return uriPath.replace(/^file:\/\//, '');
}

async function fileExists(path: string, minSize = 1_000_000): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists && info.size !== undefined && info.size > minSize;
  } catch {
    return false;
  }
}

async function loadModule(): Promise<LiteRTModule | null> {
  try {
    const mod = (await import('react-native-litert-lm')) as unknown as LiteRTModule;
    return typeof mod?.createLLM === 'function' ? mod : null;
  } catch {
    return null;
  }
}

/** True iff a usable .litertlm is already on disk. The upstream auto-download
 *  is driven by the smoke screen, not by routing — we don't want a 1.3 GB
 *  fetch firing the first time the farmer taps "Diagnose" while offline. */
export async function isModelReady(): Promise<boolean> {
  const mod = await loadModule();
  if (!mod) return false;
  if (await fileExists(finetunePath())) return true;
  if (await fileExists(upstreamPath())) return true;
  return false;
}

function scheduleUnload(): void {
  if (unloadTimer) clearTimeout(unloadTimer);
  unloadTimer = setTimeout(() => {
    unloadModel().catch(() => {});
    unloadTimer = null;
  }, UNLOAD_IDLE_MS);
}

function stripThinking(text: string): string {
  return text.replace(/<(think|reasoning|thought)>[\s\S]*?<\/\1>/gi, '').trim();
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function loadInstance(): Promise<{ llm: LiteRTLMInstance; from: 'finetune' | 'upstream' }> {
  if (llm && loadedFrom) return { llm, from: loadedFrom };
  if (loadInFlight) return loadInFlight;

  loadInFlight = (async () => {
    const mod = await loadModule();
    if (!mod) throw new Error('react-native-litert-lm not available');

    const ftReady = await fileExists(finetunePath());
    const upReady = ftReady ? false : await fileExists(upstreamPath());
    if (!ftReady && !upReady) {
      throw new Error(
        'No .litertlm on device — sideload cocoa_v1_e2b.litertlm via Files → PokouAI, ' +
          'or download the upstream Gemma 3n via Settings → LiteRT smoke test.',
      );
    }
    const path = ftReady ? finetunePath() : upstreamPath();
    const nativePath = toNative(path);
    const from: 'finetune' | 'upstream' = ftReady ? 'finetune' : 'upstream';

    // Force 'gpu' (Metal on iOS, GPU delegate on Android). getRecommendedBackend()
    // returns 'cpu' on iOS per the binding's "safe default" policy, but a 2.5 GB
    // int4 Gemma 4 E2B OOMs on CPU on iPhone 14 Pro (6 GB RAM). GPU uses a
    // separate memory pool — matches what Google's Edge AI reference app does.
    const backend: 'cpu' | 'gpu' | 'npu' = 'gpu';
    const instance = mod.createLLM({ enableMemoryTracking: false });
    console.log(`[LiteRTService] loadModel ${nativePath} backend=${backend}`);
    await instance.loadModel(nativePath, { backend, maxTokens: 400, temperature: 0.2 });
    console.log('[LiteRTService] ✓ model loaded');

    llm = instance;
    loadedFrom = from;
    return { llm: instance, from };
  })();

  try {
    return await loadInFlight;
  } finally {
    loadInFlight = null;
  }
}

export async function unloadModel(): Promise<void> {
  loadInFlight = null;
  if (llm) {
    try {
      llm.close();
    } catch {
      /* may already be released */
    }
    llm = null;
    loadedFrom = null;
  }
}

export async function diagnose(
  imageUri: string,
  language: LanguageCode,
): Promise<DiagnosisResult> {
  const { llm: ctx, from } = await loadInstance();
  const prompt = buildPrompt(imageUri, language);
  const message = `${prompt.system}\n\n${prompt.user}`;

  // Stateless per call — LiteRT keeps history by default; we don't want
  // prior diagnosis turns leaking into this one.
  try {
    ctx.resetConversation();
  } catch {
    /* older builds may not expose it; the next loadModel resets anyway */
  }

  try {
    const started = Date.now();
    const text = await withTimeout(
      ctx.sendMessageWithImage(message, imageUri),
      COMPLETION_TIMEOUT_MS,
      'litert-diagnose',
    );
    const latencyMs = Date.now() - started;
    const clean = stripThinking(text);
    const confidence = estimateConfidence(clean);
    const version = from === 'finetune' ? VERSION_FT : VERSION_BASE;
    return parseResponse(clean, confidence, version, latencyMs);
  } finally {
    scheduleUnload();
  }
}

export interface ComparisonResult {
  text: string;
  modelVersion: string;
  latencyMs: number;
}

/** Single-image follow-up comparison. The binding accepts one image per call,
 *  so we feed the day-7 photo with a comparison-aware prompt that names the
 *  Day-0 disease, matching LlamaService.compareLocal. */
export async function compareLocal(
  _beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
): Promise<ComparisonResult> {
  const { llm: ctx, from } = await loadInstance();
  const prompt = buildComparisonPromptSingle(afterUri, language, diseaseName);
  const message = `${prompt.system}\n\n${prompt.user}`;

  try {
    ctx.resetConversation();
  } catch {
    /* ignore */
  }

  try {
    const started = Date.now();
    const text = await withTimeout(
      ctx.sendMessageWithImage(message, afterUri),
      COMPLETION_TIMEOUT_MS,
      'litert-compare',
    );
    return {
      text: stripThinking(text),
      modelVersion: from === 'finetune' ? VERSION_FT_COMPARE : VERSION_BASE_COMPARE,
      latencyMs: Date.now() - started,
    };
  } finally {
    scheduleUnload();
  }
}

function estimateConfidence(text: string): number {
  const sectionPairs = [
    ['MALADIE:', 'DISEASE:'],
    ['SYMPTOMES:', 'SYMPTOMS:'],
    ['TRAITEMENT:', 'TREATMENT:'],
    ['PREVENTION:'],
  ];
  const present = sectionPairs.filter((alts) => alts.some((s) => text.includes(s))).length;
  const base = present / sectionPairs.length;
  if (/incertain|uncertain|non analysable|not analyzable|non identifi|unidentif/i.test(text)) {
    return Math.min(base * 0.5, 0.4);
  }
  const jitter = (text.length % 10) / 100;
  return Math.max(0.5, Math.min(0.9, base * 0.9 + jitter));
}

export const __test = { estimateConfidence };
