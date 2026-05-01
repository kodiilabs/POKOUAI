import * as FileSystem from 'expo-file-system/legacy';
import type { DiagnosisResult, LanguageCode } from '@/types';
import { buildComparisonPrompt, buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';
import { getHubModel, getHubUrl } from './preferences';
import type { ComparisonResult } from './LlamaService';

const HUB_TIMEOUT_MS = 20_000;
/** Keep the model loaded on the hub between calls to avoid cold-start.
 *  Ollama default is 5 min; 15 min is more demo-friendly. */
const KEEP_ALIVE = '15m';

async function imageToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function isValidHubUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

interface HubResponse {
  response?: string;
}

async function fetchHub(hub: string, body: object, retry = 1): Promise<HubResponse> {
  if (!isValidHubUrl(hub)) {
    throw new Error(
      `Invalid hub URL "${hub}". Set a valid http(s) URL in Settings → Hub.`,
    );
  }
  const url = `${hub.replace(/\/$/, '')}/api/generate`;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retry; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), HUB_TIMEOUT_MS);
    try {
      console.log(`[OllamaService] POST ${url} attempt=${attempt + 1}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`hub responded ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = (await res.json()) as HubResponse;
      const len = data.response?.length ?? 0;
      console.log(`[OllamaService] ✓ ${len} chars`);
      return data;
    } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message ?? String(e);
      console.warn(`[OllamaService] attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < retry) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error('hub call failed');
}

/** Strip reasoning blocks emitted by some models (Gemma 4 27B occasionally,
 *  reasoning-mode finetunes always) so parseResponse sees only the
 *  structured PokouAI output. */
function stripThinking(text: string): string {
  return text.replace(/<(think|reasoning|thought)>[\s\S]*?<\/\1>/gi, '').trim();
}

export async function diagnoseViaHub(
  imageUri: string,
  language: LanguageCode,
): Promise<DiagnosisResult> {
  const [hub, model] = await Promise.all([getHubUrl(), getHubModel()]);
  const prompt = buildPrompt(imageUri, language);
  const imageB64 = await imageToBase64(imageUri);

  const started = Date.now();
  const data = await fetchHub(hub, {
    model,
    system: prompt.system,
    prompt: prompt.user,
    images: [imageB64],
    stream: false,
    keep_alive: KEEP_ALIVE,
    options: { temperature: 0.2, num_predict: 400 },
  });
  const latencyMs = Date.now() - started;
  const text = stripThinking(data.response ?? '');

  const confidence = estimateHubConfidence(text);
  return parseResponse(text, confidence, `ollama/${model}`, latencyMs);
}

function estimateHubConfidence(text: string): number {
  // Check for both French and English headers — system prompt is language-aware
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
  return Math.min(0.95, 0.6 + base * 0.35);
}

export async function compareViaHub(
  beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
): Promise<ComparisonResult> {
  const [hub, model] = await Promise.all([getHubUrl(), getHubModel()]);
  const prompt = buildComparisonPrompt(beforeUri, afterUri, language, diseaseName);
  const [b64Before, b64After] = await Promise.all([
    imageToBase64(beforeUri),
    imageToBase64(afterUri),
  ]);

  const started = Date.now();
  const data = await fetchHub(hub, {
    model,
    system: prompt.system,
    prompt: prompt.user,
    images: [b64Before, b64After],
    stream: false,
    keep_alive: KEEP_ALIVE,
    options: { temperature: 0.2, num_predict: 300 },
  });
  return {
    text: stripThinking(data.response ?? ''),
    modelVersion: `ollama/${model}-compare`,
    latencyMs: Date.now() - started,
  };
}
