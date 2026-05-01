import diagnosisCfg from '@/data/prompts/diagnosis.json';
import comparisonCfg from '@/data/prompts/comparison.json';
import type { LanguageCode } from '@/types';

type LangMap = Record<LanguageCode, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DIAGNOSIS_SYSTEM = (diagnosisCfg as any).system_by_lang as LangMap;
const DIAGNOSIS_USER = diagnosisCfg.user_by_lang as LangMap;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPARE_SYSTEM = (comparisonCfg as any).system_by_lang as LangMap;
const COMPARE_USER_2 = comparisonCfg.user_two_image_by_lang as LangMap;
const COMPARE_USER_1 = comparisonCfg.user_single_image_by_lang as LangMap;

function pick(map: LangMap, language: LanguageCode): string {
  return map[language] ?? map.fr;
}

export interface BuiltPrompt {
  system: string;
  user: string;
  imagePath: string;
  language: LanguageCode;
}

export function buildPrompt(imagePath: string, language: LanguageCode): BuiltPrompt {
  return {
    system: pick(DIAGNOSIS_SYSTEM, language),
    user: pick(DIAGNOSIS_USER, language),
    imagePath,
    language,
  };
}

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
    system: pick(COMPARE_SYSTEM, language),
    user: pick(COMPARE_USER_2, language).replace('{disease}', diseaseName),
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
    system: pick(COMPARE_SYSTEM, language),
    user: pick(COMPARE_USER_1, language).replace('{disease}', diseaseName),
    imagePath: afterPath,
    language,
  };
}
