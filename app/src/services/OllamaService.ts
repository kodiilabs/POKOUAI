import * as FileSystem from 'expo-file-system';
import type { DiagnosisResult, LanguageCode } from '@/types';
import { buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';
import { getHubModel, getHubUrl } from './preferences';

async function imageToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function diagnoseViaHub(
  imageUri: string,
  language: LanguageCode,
): Promise<DiagnosisResult> {
  const [hub, model] = await Promise.all([getHubUrl(), getHubModel()]);
  const prompt = buildPrompt(imageUri, language);
  const imageB64 = await imageToBase64(imageUri);

  const started = Date.now();
  const res = await fetch(`${hub.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system: prompt.system,
      prompt: prompt.user,
      images: [imageB64],
      stream: false,
      options: { temperature: 0.2, num_predict: 400 },
    }),
  });
  if (!res.ok) throw new Error(`hub responded ${res.status}`);
  const data = (await res.json()) as { response?: string };
  const latencyMs = Date.now() - started;
  const text = data.response ?? '';

  const confidence = estimateHubConfidence(text);
  return parseResponse(text, confidence, `ollama/${model}`, latencyMs);
}

function estimateHubConfidence(text: string): number {
  const sections = ['MALADIE:', 'SYMPTOMES:', 'TRAITEMENT:', 'PREVENTION:'];
  const present = sections.filter((s) => text.includes(s)).length;
  return Math.min(0.95, 0.6 + 0.1 * present);
}
