import * as FileSystem from 'expo-file-system/legacy';
import type { DiagnosisResult, LanguageCode } from '@/types';
import { buildComparisonPrompt, buildPrompt } from './promptBuilder';
import { parseResponse } from './responseParser';
import type { ComparisonResult } from './LlamaService';

const CLOUD_ENDPOINT = 'https://api.pokou.ai/v1/diagnose';
const CLOUD_COMPARE_ENDPOINT = 'https://api.pokou.ai/v1/compare';
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

export async function compareViaCloud(
  beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
): Promise<ComparisonResult> {
  const prompt = buildComparisonPrompt(beforeUri, afterUri, language, diseaseName);
  const [beforeB64, afterB64] = await Promise.all([
    FileSystem.readAsStringAsync(beforeUri, { encoding: FileSystem.EncodingType.Base64 }),
    FileSystem.readAsStringAsync(afterUri, { encoding: FileSystem.EncodingType.Base64 }),
  ]);

  const started = Date.now();
  const res = await fetch(CLOUD_COMPARE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: prompt.system,
      prompt: prompt.user,
      before_base64: beforeB64,
      after_base64: afterB64,
      language,
    }),
  });
  if (!res.ok) throw new Error(`cloud responded ${res.status}`);
  const data = (await res.json()) as { response: string };
  return {
    text: data.response,
    modelVersion: `${CLOUD_MODEL_VERSION}-compare`,
    latencyMs: Date.now() - started,
  };
}
