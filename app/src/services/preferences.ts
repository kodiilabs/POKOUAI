import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CropId, LanguageCode } from '@/types';

const KEYS = {
  language: 'pokouai.language',
  crop: 'pokouai.crop',
  onboarded: 'pokouai.onboarded',
  lastSync: 'pokouai.last_sync',
  cloudSyncEnabled: 'pokouai.cloud_sync',
} as const;

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
