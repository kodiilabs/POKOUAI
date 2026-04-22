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
