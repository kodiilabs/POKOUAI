import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { routeInference } from '@/services/InferenceRouter';
import { insertDiagnosis } from '@/services/db';
import { currentLanguage } from '@/i18n';
import type { InferenceTier, RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnosis'>;
type Phase = 'idle' | 'analyzing' | 'error';

const TIER_LABEL: Record<InferenceTier, string> = {
  local: '📱 local',
  hub: '🛰 hub (Ollama)',
  cloud: '☁️ cloud',
};

export default function DiagnosisScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { imageUri } = route.params;
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorKey, setErrorKey] = useState<string>('diagnosis.error_generic');
  const [chosenTier, setChosenTier] = useState<InferenceTier | null>(null);

  const analyze = async () => {
    if (!imageUri) return;
    setPhase('analyzing');
    setChosenTier(null);
    try {
      const routed = await routeInference(imageUri, currentLanguage(), {
        // Prefer hub while on-device E2B exceeds iPhone jetsam (>3 GB RSS).
        // Falls back to local mock if hub is unreachable.
        prefer: 'hub',
        onTierChosen: setChosenTier,
      });
      if (routed.confidenceBand === 'low') {
        setErrorKey('diagnosis.error_uncertain');
        setPhase('error');
        return;
      }
      const id = await insertDiagnosis(imageUri, currentLanguage(), routed, routed.tier);
      navigation.replace('Result', { diagnosisId: id });
    } catch (e) {
      console.error('[DiagnosisScreen] inference failed:', e);
      setErrorKey('diagnosis.error_generic');
      setPhase('error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      ) : (
        <View style={styles.previewFallback}>
          <Text>{t('diagnosis.preview')}</Text>
        </View>
      )}

      <View style={styles.panel}>
        {phase === 'analyzing' && (
          <>
            <ActivityIndicator size="large" color="#1b5e20" />
            <Text style={styles.hint}>
              {t('diagnosis.analyzing')}
              {chosenTier ? ` · ${TIER_LABEL[chosenTier]}` : ''}
            </Text>
          </>
        )}

        {phase === 'error' && (
          <>
            <Text style={styles.error}>{t(errorKey)}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => setPhase('idle')}>
              <Text style={styles.btnText}>{t('diagnosis.retake')}</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'idle' && (
          <>
            <TouchableOpacity style={styles.btn} onPress={analyze} disabled={!imageUri}>
              <Text style={styles.btnText}>🔍 {t('diagnosis.analyze')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={() => navigation.goBack()}>
              <Text style={styles.btnGhostText}>{t('diagnosis.choose_another')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  preview: { flex: 1, backgroundColor: '#000' },
  previewFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  panel: { padding: 16, backgroundColor: '#fff' },
  btn: {
    backgroundColor: '#1b5e20',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnGhost: { padding: 12, alignItems: 'center' },
  btnGhostText: { color: '#1b5e20' },
  hint: { textAlign: 'center', color: '#424242', marginVertical: 12 },
  error: { color: '#c62828', textAlign: 'center', marginBottom: 12 },
});
