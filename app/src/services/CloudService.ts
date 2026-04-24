import * as FileSystem from 'expo-file-system';
import type { DiagnosisResult, LanguageCode } from '@/types';
import { buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';

const CLOUD_ENDPOINT = 'https://api.pokou.ai/v1/diagnose';
const CLOUD_MODEL_VERSION = 'gemma4-27b-cloud';

export async function diagnoseViaCloud(
  imageUri: string,
  language: LanguageCode,
): Promise<DiagnosisResult> {
  const prompt = buildPrompt(imageUri, language);
  const imageB64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const started = Date.now();
  const res = await fetch(CLOUD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: prompt.system,
      prompt: prompt.user,
      image_base64: imageB64,
      language,
    }),
  });
  if (!res.ok) throw new Error(`cloud responded ${res.status}`);
  const data = (await res.json()) as { response: string; confidence?: number };
  const latencyMs = Date.now() - started;

  return parseResponse(
    data.response,
    data.confidence ?? 0.85,
    CLOUD_MODEL_VERSION,
    latencyMs,
  );
}
