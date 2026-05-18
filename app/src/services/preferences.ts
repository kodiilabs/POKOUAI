import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CropId, LanguageCode } from '@/types';

const KEYS = {
  language: 'pokouai.language',
  crop: 'pokouai.crop',
  onboarded: 'pokouai.onboarded',
  lastSync: 'pokouai.last_sync',
  cloudSyncEnabled: 'pokouai.cloud_sync',
  hubUrl: 'pokouai.hub_url',
  hubModel: 'pokouai.hub_model',
  preferTier: 'pokouai.prefer_tier',
} as const;

const DEFAULT_HUB_URL = 'http://192.168.2.85:11434';
export const HUB_MODEL_OPTIONS = [
  'cocoa-v1:latest',
  'gemma4:e2b',
  'gemma4:e4b',
  'gemma4:27b',
] as const;
export type HubModel = (typeof HUB_MODEL_OPTIONS)[number];
const DEFAULT_HUB_MODEL: HubModel = 'cocoa-v1:latest';

export async function getCrop(): Promise<CropId> {
  const v = (await AsyncStorage.getItem(KEYS.crop)) as CropId | null;
  return v ?? 'cocoa';
}

export async function setCrop(c: CropId): Promise<void> {
  await AsyncStorage.setItem(KEYS.crop, c);
}

export async function markOnboarded(lang: LanguageCode, crop: CropId): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.language, lang],
    [KEYS.crop, crop],
    [KEYS.onboarded, '1'],
  ]);
}

export async function getLastSync(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.lastSync);
}

export async function setLastSync(ts: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.lastSync, ts);
}

export async function getCloudSyncEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.cloudSyncEnabled);
  return v === '1';
}

export async function setCloudSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.cloudSyncEnabled, enabled ? '1' : '0');
}

export async function getHubUrl(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.hubUrl)) ?? DEFAULT_HUB_URL;
}

export async function setHubUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.hubUrl, url);
}

export async function getHubModel(): Promise<HubModel> {
  const v = (await AsyncStorage.getItem(KEYS.hubModel)) as HubModel | null;
  return v && HUB_MODEL_OPTIONS.includes(v) ? v : DEFAULT_HUB_MODEL;
}

export async function setHubModel(m: HubModel): Promise<void> {
  await AsyncStorage.setItem(KEYS.hubModel, m);
}
