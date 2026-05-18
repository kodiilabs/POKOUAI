import * as FileSystem from 'expo-file-system/legacy';
import diseases from '@/data/cocoa_diseases.json';
import type { DiagnosisResult, DiseaseId, LanguageCode } from '@/types';
import { buildComparisonPromptSingle, buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';

// ─── constants ───────────────────────────────────────────────────────────
const MODEL_VERSION = 'cocoa_v1_e2b';
const MOCK_VERSION = 'cocoa_v1_e2b-MOCK';
const MODEL_FILENAME = 'cocoa_v1_e2b.gguf';
const MMPROJ_FILENAME = 'cocoa_v1_e2b-mmproj.gguf';
// Main Q4_K_M GGUF only — matches the size quoted in README.
// The vision projector (MMPROJ_SIZE_MB) is downloaded separately.
export const MODEL_SIZE_MB = 1500;
export const MMPROJ_SIZE_MB = 880;

/** Generation timeout. iOS won't kill our completion call indefinitely; the
 *  user will if the spinner spins too long. 90 s is generous for a phone
 *  doing 5B params at ~5 t/s with a 400-token cap. */
const COMPLETION_TIMEOUT_MS = 90_000;

let isMockMode = false;
export function isRunningMock(): boolean {
  return isMockMode;
}

// ─── module load (llama.rn binding) ──────────────────────────────────────
type LlamaModule = {
  initLlama: (config: {
    model: string;
    n_ctx?: number;
    n_batch?: number;
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
  /** Optional in older versions of llama.rn; required for vision input. */
  initMultimodal?: (params: { path: string; use_gpu?: boolean }) => Promise<void>;
  release: () => Promise<void>;
}

let llamaCtx: LlamaContext | null = null;
let loadInFlight: Promise<LlamaContext> | null = null;

async function loadModule(): Promise<LlamaModule | null> {
  try {
    const mod = (await import('llama.rn')) as unknown as LlamaModule;
    return typeof mod?.initLlama === 'function' ? mod : null;
  } catch {
    return null;
  }
}

// ─── filesystem ──────────────────────────────────────────────────────────
function docDir(): string {
  const dir = FileSystem.documentDirectory;
  if (!dir) {
    throw new Error(
      'FileSystem.documentDirectory is null — running in an unsupported environment',
    );
  }
  return dir;
}

function modelLocalPath(): string {
  return `${docDir()}${MODEL_FILENAME}`;
}
function mmprojLocalPath(): string {
  return `${docDir()}${MMPROJ_FILENAME}`;
}

async function fileExists(path: string, minSize = 1_000_000): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    const size = info.exists ? info.size : undefined;
    const exists = info.exists && size !== undefined && size > minSize;
    console.log(`[LlamaService] fileExists(${path}): exists=${info.exists}, size=${size}, minSize=${minSize}, result=${exists}`);
    return exists;
  } catch (e) {
    console.error(`[LlamaService] fileExists error for ${path}:`, e);
    return false;
  }
}

export async function isModelDownloaded(): Promise<boolean> {
  const path = modelLocalPath();
  console.log(`[LlamaService] checking model at: ${path}`);
  return fileExists(path);
}
export async function isMmprojDownloaded(): Promise<boolean> {
  const path = mmprojLocalPath();
  console.log(`[LlamaService] checking mmproj at: ${path}`);
  return fileExists(path, 100_000);
}

/** True if inference can run *now*: either the GGUF is sideloaded, or the
 *  native module is unavailable (simulator / web → falls back to mock).
 *  Note: this does NOT guarantee the model loaded successfully — initLlama
 *  may still throw and fall back to mock. Use isRunningMock() afterward
 *  for the truth. */
export async function isModelReady(): Promise<boolean> {
  if (await isModelDownloaded()) return true;
  return (await loadModule()) === null;
}

/** Auto-download is intentionally disabled. The user-uploaded HF path
 *  was 404-ing and silently wrote bad GGUFs. Until we publish a public
 *  repo, models must be sideloaded via Finder → iPhone → Files → PokouAI. */
export async function downloadModel(): Promise<string> {
  throw new Error(
    'Auto-download disabled. Sideload the GGUF via Finder → iPhone → Files → PokouAI.',
  );
}
export async function downloadMmproj(): Promise<string> {
  throw new Error(
    'Auto-download disabled. Sideload the mmproj GGUF via Finder → iPhone → Files → PokouAI.',
  );
}

// ─── mock (used when llama.rn missing or initLlama fails) ────────────────
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

function detectLang(prompt: string): LanguageCode {
  let lang: LanguageCode = 'fr';
  if (prompt.includes('[FR→DYU')) lang = 'dyu';
  else if (prompt.includes('[FR→BCI')) lang = 'bci';
  else if (
    /\bDISEASE:|in English|Look at this cocoa pod|Respond ONLY in the following|Black pod rot|Frosty pod rot|What disease is this/i.test(
      prompt,
    )
  )
    lang = 'en';
  return lang;
}

function pickStr(m: Record<string, string>, lang: LanguageCode): string {
  return m[lang] ?? m.fr ?? '';
}
function pickArr(m: Record<string, string[]>, lang: LanguageCode): string[] {
  return m[lang] ?? m.fr ?? [];
}

const HEADERS: Record<LanguageCode, { disease: string; symptoms: string; treatment: string; prevention: string; agronomist: string }> = {
  fr: { disease: 'MALADIE', symptoms: 'SYMPTOMES', treatment: 'TRAITEMENT', prevention: 'PREVENTION', agronomist: 'AGRONOME' },
  en: { disease: 'DISEASE', symptoms: 'SYMPTOMS', treatment: 'TREATMENT', prevention: 'PREVENTION', agronomist: 'AGRONOMIST' },
  dyu: { disease: 'MALADIE', symptoms: 'SYMPTOMES', treatment: 'TRAITEMENT', prevention: 'PREVENTION', agronomist: 'AGRONOME' },
  bci: { disease: 'MALADIE', symptoms: 'SYMPTOMES', treatment: 'TRAITEMENT', prevention: 'PREVENTION', agronomist: 'AGRONOME' },
};

function mockDiagnosisText(imagePath: string, lang: LanguageCode): string {
  const id = MOCK_DISEASES[hashStr(imagePath) % MOCK_DISEASES.length];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = id ? (diseases as any).diseases?.[id] : undefined;
  const h = HEADERS[lang];
  if (!e) return `${h.disease}:`;
  return [
    `${h.disease}: ${pickStr(e.names, lang)}`,
    `${h.symptoms}:\n- ${pickArr(e.symptoms, lang).join('\n- ')}`,
    `${h.treatment}:\n- ${pickArr(e.treatment, lang).join('\n- ')}`,
    `${h.prevention}:\n- ${pickArr(e.prevention, lang).join('\n- ')}`,
    `${h.agronomist}: ${pickStr(e.when_to_call_agronomist, lang)}`,
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

const COMPARE_HEADERS: Record<LanguageCode, { evolution: string; comment: string; actions: string; lesson: string }> = {
  fr: { evolution: 'EVOLUTION', comment: 'COMMENTAIRE', actions: 'ACTIONS', lesson: 'LECON' },
  en: { evolution: 'EVOLUTION', comment: 'COMMENT', actions: 'ACTIONS', lesson: 'LESSON' },
  dyu: { evolution: 'EVOLUTION', comment: 'COMMENTAIRE', actions: 'ACTIONS', lesson: 'LECON' },
  bci: { evolution: 'EVOLUTION', comment: 'COMMENTAIRE', actions: 'ACTIONS', lesson: 'LECON' },
};

function mockComparisonText(imagePath: string, lang: LanguageCode): string {
  const verdicts = COMPARE_VERDICTS[lang];
  const body = COMPARE_BODY[lang];
  const h = COMPARE_HEADERS[lang];
  const v = verdicts[hashStr(imagePath) % verdicts.length];
  return [
    `${h.evolution}: ${v}`,
    `${h.comment}: ${body.commentaire}`,
    `${h.actions}: ${body.actions}`,
    `${h.lesson}: ${body.lecon}`,
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

// ─── load + completion helpers ───────────────────────────────────────────
/** Auto-unload timer: keep model warm for 30s, then release to save RAM. */
let unloadTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleUnload(): void {
  if (unloadTimer) clearTimeout(unloadTimer);
  unloadTimer = setTimeout(() => {
    unloadModel().catch(() => {});
    unloadTimer = null;
  }, 30_000);
}

/** Strip <think>/<reasoning>/<thought> blocks some Gemma 4 variants emit. */
function stripThinking(text: string): string {
  return text.replace(/<(think|reasoning|thought)>[\s\S]*?<\/\1>/gi, '').trim();
}

/** Wrap a promise with a timeout that rejects with a clear message. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
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
        // 2048 is the floor for Gemma 4 multimodal: system (~500) + image (256) + user (~100) + 400-token reply.
        // 1024 truncates the reply mid-generation → "uncertain" / missing sections → low confidence.
        // n_batch left at llama.rn default — llama.cpp requires n_batch ≥ n_ubatch (512) or init fails.
        n_ctx: 2048,
        n_gpu_layers: 99, // offload all to Metal on iOS / OpenCL on Android
        n_threads: 4,
      });
      console.log('[LlamaService] ✓ main model loaded');
      if (ctx.initMultimodal && (await isMmprojDownloaded())) {
        try {
          await ctx.initMultimodal({ path: mmprojLocalPath(), use_gpu: true });
          console.log('[LlamaService] ✓ mmproj loaded (Metal)');
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
  loadInFlight = null;
  if (llamaCtx) {
    try {
      await llamaCtx.release();
    } catch {
      /* may already be released */
    }
    llamaCtx = null;
  }
  isMockMode = false;
}

// Gemma 4 stop tokens. </s> is for LLaMA family — leaving it would let the
// model ramble past the structured answer until n_predict ran out.
const STOP_TOKENS = ['<end_of_turn>', '<eos>'];

// ─── public API ──────────────────────────────────────────────────────────
export async function diagnose(imageUri: string, language: LanguageCode): Promise<DiagnosisResult> {
  const ctx = await loadModel();
  const prompt = buildPrompt(imageUri, language);
  const full = `${prompt.system}\n\n${prompt.user}`;

  try {
    const started = Date.now();
    const result = await withTimeout(
      ctx.completion({
        prompt: full,
        image_path: imageUri,
        n_predict: 400,
        temperature: 0.2,
        stop: STOP_TOKENS,
      }),
      COMPLETION_TIMEOUT_MS,
      'diagnose',
    );
    const latencyMs = Date.now() - started;

    const text = stripThinking(result.text);
    const confidence = estimateConfidence(text);
    const version = isMockMode ? MOCK_VERSION : MODEL_VERSION;
    return parseResponse(text, confidence, version, latencyMs);
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
  if (/incertain|uncertain|non analysable|not analyzable|non identifi|unidentif/i.test(text))
    return Math.min(base * 0.5, 0.4);
  const cap = isMockMode ? 0.65 : 0.9;
  const jitter = (text.length % 10) / 100;
  return Math.max(0.5, Math.min(cap, base * cap + jitter));
}

export interface ComparisonResult {
  text: string;
  modelVersion: string;
  latencyMs: number;
}

/** Local single-image fallback for the day-7 follow-up. The current
 *  llama.rn `completion` binding accepts only one `image_path`, so we
 *  feed the day-7 photo with a comparison-aware prompt that names the
 *  Day-0 disease. When llama.rn ships multi-image support we can drop
 *  the "_beforeUri" argument and pass both. */
export async function compareLocal(
  _beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
): Promise<ComparisonResult> {
  const ctx = await loadModel();
  const prompt = buildComparisonPromptSingle(afterUri, language, diseaseName);
  const full = `${prompt.system}\n\n${prompt.user}`;

  try {
    const started = Date.now();
    const result = await withTimeout(
      ctx.completion({
        prompt: full,
        image_path: afterUri,
        n_predict: 250,
        temperature: 0.2,
        stop: STOP_TOKENS,
      }),
      COMPLETION_TIMEOUT_MS,
      'compareLocal',
    );
    return {
      text: stripThinking(result.text),
      modelVersion: isMockMode ? `${MOCK_VERSION}-compare` : `${MODEL_VERSION}-compare-1img`,
      latencyMs: Date.now() - started,
    };
  } finally {
    scheduleUnload();
  }
}

export const __test = { estimateConfidence };
