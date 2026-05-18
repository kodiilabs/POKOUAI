import type { DiagnosisRouted, InferenceTier, LanguageCode } from '@/types';
import { detectAvailability, pickTier } from './NetworkService';
import {
  compareLocal as compareLocalLlama,
  diagnose as diagnoseLlama,
  isModelReady as isLlamaReady,
  type ComparisonResult,
} from './LlamaService';
import {
  compareLocal as compareLocalLiteRT,
  diagnose as diagnoseLiteRT,
  isModelReady as isLiteRTReady,
} from './LiteRTService';
import { compareViaHub, diagnoseViaHub } from './OllamaService';
import { compareViaCloud, diagnoseViaCloud } from './CloudService';
import { prepareForInference } from './imagePrep';

// Local tier prefers LiteRT-LM (.litertlm), falls back to llama.rn (.gguf).
// `isLocalReady` is true if either backend has a model on disk.
async function isLocalReady(): Promise<boolean> {
  return (await isLiteRTReady()) || (await isLlamaReady());
}

async function diagnoseLocal(
  imageUri: string,
  language: LanguageCode,
): Promise<DiagnosisRouted> {
  if (await isLiteRTReady()) {
    try {
      return { ...(await diagnoseLiteRT(imageUri, language)), tier: 'local' };
    } catch (err) {
      console.warn('[Router] LiteRT diagnose failed, falling back to llama.rn', err);
    }
  }
  return { ...(await diagnoseLlama(imageUri, language)), tier: 'local' };
}

async function compareLocal(
  beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
): Promise<ComparisonResult> {
  if (await isLiteRTReady()) {
    try {
      return await compareLocalLiteRT(beforeUri, afterUri, language, diseaseName);
    } catch (err) {
      console.warn('[Router] LiteRT compare failed, falling back to llama.rn', err);
    }
  }
  return compareLocalLlama(beforeUri, afterUri, language, diseaseName);
}

export interface RouterOptions {
  prefer?: InferenceTier;
  onTierChosen?: (tier: InferenceTier) => void;
}

export async function routeInference(
  imageUri: string,
  language: LanguageCode,
  opts: RouterOptions = {},
): Promise<DiagnosisRouted> {
  const prepared = await prepareForInference(imageUri);
  const localReady = await isLocalReady();
  const avail = await detectAvailability(localReady);
  const tier = pickTier(avail, opts.prefer);
  opts.onTierChosen?.(tier);

  const result = await runTier(tier, prepared, language, avail);
  return { ...result, tier };
}

async function runTier(
  tier: InferenceTier,
  imageUri: string,
  language: LanguageCode,
  avail: { local: boolean; hub: boolean; cloud: boolean },
): Promise<DiagnosisRouted> {
  try {
    if (tier === 'hub') return { ...(await diagnoseViaHub(imageUri, language)), tier: 'hub' };
    if (tier === 'cloud') return { ...(await diagnoseViaCloud(imageUri, language)), tier: 'cloud' };
    return await diagnoseLocal(imageUri, language);
  } catch (err) {
    const fallback = nextTier(tier, avail);
    if (!fallback) throw err;
    return runTier(fallback, imageUri, language, { ...avail, [tier]: false });
  }
}

function nextTier(
  failed: InferenceTier,
  avail: { local: boolean; hub: boolean; cloud: boolean },
): InferenceTier | null {
  const order: InferenceTier[] = ['hub', 'cloud', 'local'];
  for (const t of order) {
    if (t !== failed && avail[t]) return t;
  }
  return null;
}

export interface ComparisonRouted extends ComparisonResult {
  tier: InferenceTier;
}

export async function routeComparison(
  beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
  opts: RouterOptions = {},
): Promise<ComparisonRouted> {
  const [preparedBefore, preparedAfter] = await Promise.all([
    prepareForInference(beforeUri),
    prepareForInference(afterUri),
  ]);
  const localReady = await isLocalReady();
  const avail = await detectAvailability(localReady);
  const tier = pickTier(avail, opts.prefer);
  opts.onTierChosen?.(tier);

  return runComparisonTier(tier, preparedBefore, preparedAfter, language, diseaseName, avail);
}

async function runComparisonTier(
  tier: InferenceTier,
  beforeUri: string,
  afterUri: string,
  language: LanguageCode,
  diseaseName: string,
  avail: { local: boolean; hub: boolean; cloud: boolean },
): Promise<ComparisonRouted> {
  try {
    if (tier === 'hub') {
      return { ...(await compareViaHub(beforeUri, afterUri, language, diseaseName)), tier };
    }
    if (tier === 'cloud') {
      return { ...(await compareViaCloud(beforeUri, afterUri, language, diseaseName)), tier };
    }
    return { ...(await compareLocal(beforeUri, afterUri, language, diseaseName)), tier: 'local' };
  } catch (err) {
    const fallback = nextTier(tier, avail);
    if (!fallback) throw err;
    return runComparisonTier(fallback, beforeUri, afterUri, language, diseaseName, {
      ...avail,
      [tier]: false,
    });
  }
}
