import * as Speech from 'expo-speech';
import type { LanguageCode } from '@/types';

/** Languages with reliable on-device TTS (iOS Siri / Android Google). */
const LOCALE: Partial<Record<LanguageCode, string>> = {
  fr: 'fr-FR',
  en: 'en-US',
  // dyu / bci have no off-the-shelf TTS — callers should isSupported() first
  // and surface a "coming soon" message. Phase-2 plan: pre-recorded audio
  // clips bundled per disease, played back instead of synthesised speech.
};

/** Section labels per language. Used by diagnosisToSpeech so the text
 *  matches the TTS locale (English voice + English labels, etc.). */
const LABELS: Record<LanguageCode, { symptoms: string; treatment: string; prevention: string; agronomist: string }> = {
  fr: { symptoms: 'Symptômes', treatment: 'Traitement', prevention: 'Prévention', agronomist: 'Agronome' },
  en: { symptoms: 'Symptoms', treatment: 'Treatment', prevention: 'Prevention', agronomist: 'Agronomist' },
  dyu: { symptoms: 'Symptômes', treatment: 'Traitement', prevention: 'Prévention', agronomist: 'Agronome' },
  bci: { symptoms: 'Symptômes', treatment: 'Traitement', prevention: 'Prévention', agronomist: 'Agronome' },
};

export function isSpeechSupported(lang: LanguageCode): boolean {
  return lang in LOCALE;
}

export interface SpeakCallbacks {
  onDone?: () => void;
  onError?: (err: unknown) => void;
}

export async function speak(text: string, lang: LanguageCode, cb: SpeakCallbacks = {}): Promise<void> {
  await Speech.stop();
  const locale = LOCALE[lang];
  if (!locale) throw new Error(`TTS unavailable for ${lang}`);
  console.log(`[speech] speak (${locale}, ${text.length} chars):`, text.slice(0, 80));
  Speech.speak(text, {
    language: locale,
    rate: 0.92,
    pitch: 1.0,
    onStart: () => console.log('[speech] onStart'),
    onDone: () => {
      console.log('[speech] onDone');
      cb.onDone?.();
    },
    onStopped: () => {
      console.log('[speech] onStopped');
      cb.onDone?.();
    },
    onError: (err) => {
      console.error('[speech] onError', err);
      cb.onError?.(err);
    },
  });
}

export async function stopSpeaking(): Promise<void> {
  await Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/** Compose a "read aloud" version of a structured diagnosis. Section
 *  labels match the requested language so TTS sounds natural (English
 *  voice reads "Symptoms..." instead of mixing in "Symptômes..."). */
export function diagnosisToSpeech(
  parts: {
    diseaseName: string;
    symptoms: string[];
    treatment: string[];
    prevention: string[];
    agronomistAdvice: string;
  },
  lang: LanguageCode,
): string {
  const { diseaseName, symptoms, treatment, prevention, agronomistAdvice } = parts;
  const l = LABELS[lang] ?? LABELS.fr;
  const lines: string[] = [diseaseName + '.'];
  if (symptoms.length) lines.push(`${l.symptoms} : ${symptoms.join('. ')}`);
  if (treatment.length) lines.push(`${l.treatment} : ${treatment.join('. ')}`);
  if (prevention.length) lines.push(`${l.prevention} : ${prevention.join('. ')}`);
  if (agronomistAdvice) lines.push(`${l.agronomist} : ${agronomistAdvice}`);
  return lines.join(' ');
}
