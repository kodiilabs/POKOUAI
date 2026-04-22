import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import fr from './locales/fr.json';
import en from './locales/en.json';
import dyu from './locales/dyu.json';
import bci from './locales/bci.json';
import type { LanguageCode } from '@/types';

const LANGUAGE_KEY = 'pokouai.language';
const SUPPORTED: LanguageCode[] = ['fr', 'dyu', 'bci', 'en'];

function detectInitial(): LanguageCode {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode as LanguageCode | undefined;
  if (code && SUPPORTED.includes(code)) return code;
  return 'fr';
}

export async function initI18n(): Promise<void> {
  const stored = (await AsyncStorage.getItem(LANGUAGE_KEY)) as LanguageCode | null;
  const lng = stored && SUPPORTED.includes(stored) ? stored : detectInitial();

  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      dyu: { translation: dyu },
      bci: { translation: bci },
    },
    lng,
    fallbackLng: 'fr',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
  });
}

export async function setLanguage(lng: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export function currentLanguage(): LanguageCode {
  return (i18n.language as LanguageCode) || 'fr';
}

export { SUPPORTED as SUPPORTED_LANGUAGES };
export default i18n;
