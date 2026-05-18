import { getHubUrl } from './preferences';
import type { InferenceTier } from '@/types';

const INTERNET_PROBE = 'https://api.pokou.ai/healthz';
const PROBE_TIMEOUT_MS = 1500;

async function probe(url: string, init?: RequestInit): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function isOnline(): Promise<boolean> {
  return probe(INTERNET_PROBE);
}

export async function isHubReachable(): Promise<boolean> {
  const url = (await getHubUrl()).trim();
  if (!url) return false;
  return probe(`${url.replace(/\/$/, '')}/api/tags`);
}

export interface TierAvailability {
  local: boolean;
  hub: boolean;
  cloud: boolean;
}

export async function detectAvailability(localReady: boolean): Promise<TierAvailability> {
  const [hub, cloud] = await Promise.all([isHubReachable(), isOnline()]);
  return { local: localReady, hub, cloud };
}

export function pickTier(avail: TierAvailability, prefer?: InferenceTier): InferenceTier {
  if (prefer && avail[prefer]) return prefer;
  if (avail.hub) return 'hub';
  if (avail.cloud) return 'cloud';
  if (avail.local) return 'local';
  throw new Error('no inference tier available');
}
