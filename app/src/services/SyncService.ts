import { listDiagnoses, markSynced } from './db';
import { getCloudSyncEnabled, setLastSync } from './preferences';

const SYNC_ENDPOINT = 'https://api.pokou.ai/v1/diagnoses';
const HEALTH_ENDPOINT = 'https://api.pokou.ai/healthz';

export interface SyncResult {
  attempted: number;
  succeeded: number;
  skippedNoNetwork: boolean;
  skippedDisabled: boolean;
}

async function isOnline(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_ENDPOINT, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncPending(): Promise<SyncResult> {
  if (!(await getCloudSyncEnabled())) {
    return { attempted: 0, succeeded: 0, skippedNoNetwork: false, skippedDisabled: true };
  }
  if (!(await isOnline())) {
    return { attempted: 0, succeeded: 0, skippedNoNetwork: true, skippedDisabled: false };
  }

  const pending = (await listDiagnoses(200)).filter((d) => !d.syncedAt);
  if (pending.length === 0) {
    await setLastSync(new Date().toISOString());
    return { attempted: 0, succeeded: 0, skippedNoNetwork: false, skippedDisabled: false };
  }

  const payload = pending.map((d) => ({
    id: d.id,
    disease: d.disease,
    confidence: d.confidence,
    language: d.language,
    model_version: d.modelVersion,
    latency_ms: d.latencyMs,
    created_at: d.createdAt,
  }));

  const succeededIds: number[] = [];
  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnoses: payload }),
    });
    if (res.ok) {
      succeededIds.push(...pending.map((d) => d.id));
    }
  } catch {
    // Network error; leave pending
  }

  if (succeededIds.length > 0) {
    await markSynced(succeededIds);
    await setLastSync(new Date().toISOString());
  }

  return {
    attempted: pending.length,
    succeeded: succeededIds.length,
    skippedNoNetwork: false,
    skippedDisabled: false,
  };
}

export { isOnline };
