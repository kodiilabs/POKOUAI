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

export function isSpeechSupported(lang: LanguageCode): boolean {
  return lang in LOCALE;
}

export async function speak(text: string, lang: LanguageCode): Promise<void> {
  await Speech.stop();
  const locale = LOCALE[lang];
  if (!locale) throw new Error(`TTS unavailable for ${lang}`);
  Speech.speak(text, {
    language: locale,
    rate: 0.92,
    pitch: 1.0,
  });
}

export async function stopSpeaking(): Promise<void> {
  await Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/** Compose a "read aloud" version of a structured diagnosis (skips
 *  bullets / line breaks, joins sections with periods). */
export function diagnosisToSpeech(parts: {
  diseaseName: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  agronomistAdvice: string;
}): string {
  const { diseaseName, symptoms, treatment, prevention, agronomistAdvice } = parts;
  const lines: string[] = [diseaseName + '.'];
  if (symptoms.length) lines.push('Symptômes : ' + symptoms.join('. '));
  if (treatment.length) lines.push('Traitement : ' + treatment.join('. '));
  if (prevention.length) lines.push('Prévention : ' + prevention.join('. '));
  if (agronomistAdvice) lines.push('Agronome : ' + agronomistAdvice);
  return lines.join(' ');
}
