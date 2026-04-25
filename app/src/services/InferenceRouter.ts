import type { DiagnosisRouted, InferenceTier, LanguageCode } from '@/types';
import { detectAvailability, pickTier } from './NetworkService';
import {
  compareLocal,
  diagnose as diagnoseLocal,
  isModelReady,
  type ComparisonResult,
} from './LlamaService';
import { compareViaHub, diagnoseViaHub } from './OllamaService';
import { compareViaCloud, diagnoseViaCloud } from './CloudService';

export interface RouterOptions {
  prefer?: InferenceTier;
  onTierChosen?: (tier: InferenceTier) => void;
}

export async function routeInference(
  imageUri: string,
  language: LanguageCode,
  opts: RouterOptions = {},
): Promise<DiagnosisRouted> {
  const localReady = await isModelReady();
  const avail = await detectAvailability(localReady);
  const tier = pickTier(avail, opts.prefer);
  opts.onTierChosen?.(tier);

  const result = await runTier(tier, imageUri, language, avail);
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
    return { ...(await diagnoseLocal(imageUri, language)), tier: 'local' };
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
  const localReady = await isModelReady();
  const avail = await detectAvailability(localReady);
  const tier = pickTier(avail, opts.prefer);
  opts.onTierChosen?.(tier);

  return runComparisonTier(tier, beforeUri, afterUri, language, diseaseName, avail);
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
