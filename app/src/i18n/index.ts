import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import frRaw from './locales/fr.json';
import enRaw from './locales/en.json';
import dyuRaw from './locales/dyu.json';
import bciRaw from './locales/bci.json';
import type { LanguageCode } from '@/types';

const LANGUAGE_KEY = 'pokouai.language';
const SUPPORTED: LanguageCode[] = ['fr', 'dyu', 'bci', 'en'];

// Strips the placeholder prefix used in draft locale files (e.g.
// "[FR→BCI à valider] Bienvenue" → "Bienvenue"). Users see clean French
// fallback content; the marker stays in the JSON for the translator.
const PLACEHOLDER_PREFIX = /^\[FR→[A-Z]{2,3} à valider\]\s*/;
function stripPlaceholderPrefix(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? v.replace(PLACEHOLDER_PREFIX, '') : v;
  }
  return out;
}

const fr = frRaw;
const en = enRaw;
const dyu = stripPlaceholderPrefix(dyuRaw as Record<string, unknown>);
const bci = stripPlaceholderPrefix(bciRaw as Record<string, unknown>);

const DRAFT_REVIEW_STATUS = 'draft_requires_native_review';
const DRAFT_LANGUAGES = new Set<LanguageCode>(
  (
    [
      ['dyu', (dyuRaw as { _review_status?: string })._review_status],
      ['bci', (bciRaw as { _review_status?: string })._review_status],
    ] as const
  )
    .filter(([, status]) => status === DRAFT_REVIEW_STATUS)
    .map(([code]) => code),
);

export function isDraftLanguage(lang: LanguageCode): boolean {
  return DRAFT_LANGUAGES.has(lang);
}

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
    // Hermes (RN's engine) doesn't ship Intl.PluralRules; v3 format avoids the
    // runtime probe i18next does for v4 and silences the warning. No plural
    // keys are used in the locale files, so format choice is otherwise moot.
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false },
  });
}

export async function setLanguage(lng: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  await i18n.changeLanguage(lng);
  // Drop any cached LLM context so the next diagnosis re-creates the mock /
  // model-init closure against the new language. Without this, changing
  // language only takes effect after a full app kill.
  try {
    const { unloadModel } = await import('@/services/LlamaService');
    await unloadModel();
  } catch {
    /* hot-reload edge case */
  }
}

export function currentLanguage(): LanguageCode {
  return (i18n.language as LanguageCode) || 'fr';
}

export { SUPPORTED as SUPPORTED_LANGUAGES };
export default i18n;
