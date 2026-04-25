import type { LanguageCode } from '@/types';

const USER_PROMPTS: Record<LanguageCode, string> = {
  fr: 'Regarde cette photo de cabosse de cacao. Quelle maladie est-ce, et que dois-je faire ?',
  en: 'Look at this cocoa pod photo. What disease is this, and what should I do?',
  dyu: '[FR→DYU à valider] Regarde cette photo de cabosse de cacao. Quelle maladie est-ce ?',
  bci: '[FR→BCI à valider] Regarde cette photo de cabosse de cacao. Quelle maladie est-ce ?',
};

const SYSTEM_PROMPT = `You are PokouAI, an agronomist assistant for West African cocoa farmers.
Respond ONLY in the following structured format, in the requested language:

MALADIE: <disease name>
SYMPTOMES:
- <symptom 1>
- <symptom 2>
TRAITEMENT:
- <step 1>
- <step 2>
PREVENTION:
- <step 1>
AGRONOME: <when to call an agronomist>

Choose the disease from this fixed list:
- Pourriture brune du cabosse (black_pod)
- Pourriture givrée (frosty_pod_rot)
- Maladie du swollen shoot (swollen_shoot)
- Dépérissement des tiges (vascular_streak_dieback)
- Cabosse saine (healthy)
- Dommage non identifié (other_damage)

If the image is unclear, dark, or blurry, respond:
MALADIE: Image non analysable
AGRONOME: Reprendre la photo à la lumière du jour, téléphone stable.`;

export interface BuiltPrompt {
  system: string;
  user: string;
  imagePath: string;
  language: LanguageCode;
}

export function buildPrompt(imagePath: string, language: LanguageCode): BuiltPrompt {
  return {
    system: SYSTEM_PROMPT,
    user: USER_PROMPTS[language],
    imagePath,
    language,
  };
}

const COMPARE_SYSTEM = `You are PokouAI comparing two photos of the same cocoa pod taken 7 days apart.
Photo 1 (Day 0) was diagnosed with the disease named below; the farmer applied a treatment.
Photo 2 (Day 7) is the follow-up.

Respond ONLY in this format, in the requested language:

EVOLUTION: <stabilisé | aggravé | guéri | incertain>
COMMENTAIRE: <one sentence on what changed visibly between the two photos>
ACTIONS: <one sentence on what to do next>
LECON: <one sentence the farmer should remember for next season>`;

const COMPARE_USER: Record<LanguageCode, (disease: string) => string> = {
  fr: (d) => `La photo 1 a été diagnostiquée comme ${d}. Compare avec la photo 2 prise 7 jours plus tard.`,
  en: (d) => `Photo 1 was diagnosed as ${d}. Compare with photo 2 taken 7 days later.`,
  dyu: (d) => `[FR→DYU à valider] Photo 1: ${d}. Comparer avec photo 2 (Jour 7).`,
  bci: (d) => `[FR→BCI à valider] Photo 1: ${d}. Comparer avec photo 2 (Jour 7).`,
};

const COMPARE_USER_SINGLE: Record<LanguageCode, (disease: string) => string> = {
  fr: (d) => `Cette cabosse a été diagnostiquée avec ${d} il y a 7 jours, le paysan a traité. Sur cette photo de suivi, est-ce stabilisé, aggravé ou guéri ?`,
  en: (d) => `This pod was diagnosed with ${d} 7 days ago and treated. From this follow-up photo, is it stabilised, worse, or healed?`,
  dyu: (d) => `[FR→DYU à valider] Diagnostic il y a 7 jours: ${d}. Stabilisé, aggravé ou guéri ?`,
  bci: (d) => `[FR→BCI à valider] Diagnostic il y a 7 jours: ${d}. Stabilisé, aggravé ou guéri ?`,
};

export interface BuiltComparisonPrompt {
  system: string;
  user: string;
  beforePath: string;
  afterPath: string;
  language: LanguageCode;
}

export function buildComparisonPrompt(
  beforePath: string,
  afterPath: string,
  language: LanguageCode,
  diseaseName: string,
): BuiltComparisonPrompt {
  return {
    system: COMPARE_SYSTEM,
    user: COMPARE_USER[language](diseaseName),
    beforePath,
    afterPath,
    language,
  };
}

/** Single-image variant: when the backend cannot accept two images (e.g. local llama.cpp). */
export function buildComparisonPromptSingle(
  afterPath: string,
  language: LanguageCode,
  diseaseName: string,
): BuiltPrompt {
  return {
    system: COMPARE_SYSTEM,
    user: COMPARE_USER_SINGLE[language](diseaseName),
    imagePath: afterPath,
    language,
  };
}

