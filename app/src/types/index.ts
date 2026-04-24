export type LanguageCode = 'fr' | 'dyu' | 'bci' | 'en';

export type DiseaseId =
  | 'black_pod'
  | 'frosty_pod_rot'
  | 'swollen_shoot'
  | 'vascular_streak_dieback'
  | 'healthy'
  | 'other_damage';

export type CropId = 'cocoa' | 'coffee' | 'cashew' | 'other';

export type ConfidenceBand = 'high' | 'medium' | 'low';

export interface DiagnosisResult {
  disease: DiseaseId;
  diseaseName: string;
  confidence: number;
  confidenceBand: ConfidenceBand;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  whenToCallAgronomist: string;
  rawResponse: string;
  modelVersion: string;
  latencyMs: number;
}

export interface FarmLogEntry {
  id: number;
  imageUri: string;
  disease: DiseaseId;
  diseaseName: string;
  confidence: number;
  language: LanguageCode;
  note: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export type InferenceTier = 'local' | 'hub' | 'cloud';

export interface DiagnosisRouted extends DiagnosisResult {
  tier: InferenceTier;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Diagnosis: { imageUri?: string; groupMode?: boolean };
  Result: { diagnosisId: number };
  FarmLog: undefined;
  Settings: undefined;
  HubSettings: undefined;
  Learn: { diagnosisId: number };
  PreventionCalendar: undefined;
  Quiz: { diagnosisId?: number };
  GroupMode: undefined;
};
