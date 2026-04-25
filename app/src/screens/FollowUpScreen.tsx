import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getDiagnosis, type DiagnosisRow } from '@/services/db';
import { completeLoop, getLoop, setComparisonResponse } from '@/services/loops';
import { routeComparison } from '@/services/InferenceRouter';
import { play } from '@/services/voice';
import { currentLanguage } from '@/i18n';
import type { InferenceTier, Loop, LoopOutcome, RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FollowUp'>;

const OUTCOMES: { id: LoopOutcome; key: string; color: string }[] = [
  { id: 'stabilised', key: 'followup.outcome_stabilised', color: '#2e7d32' },
  { id: 'healed', key: 'followup.outcome_healed', color: '#1b5e20' },
  { id: 'progressed', key: 'followup.outcome_progressed', color: '#c62828' },
  { id: 'unknown', key: 'followup.outcome_unknown', color: '#616161' },
];

export default function FollowUpScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { loopId } = route.params;
  const [loop, setLoop] = useState<Loop | null>(null);
  const [initial, setInitial] = useState<DiagnosisRow | null>(null);
  const [followupImage, setFollowupImage] = useState<string | null>(null);
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [comparisonTier, setComparisonTier] = useState<InferenceTier | null>(null);
  const [outcome, setOutcome] = useState<LoopOutcome | null>(null);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [lesson, setLesson] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const l = await getLoop(loopId);
      if (!l) return;
      setLoop(l);
      setInitial(await getDiagnosis(l.initialDiagnosisId));
    })();
  }, [loopId]);

  const takeFollowupPhoto = async () => {
    if (!initial) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setBusy(true);
    setFollowupImage(result.assets[0].uri);
    setComparisonText(null);
    try {
      const routed = await routeComparison(
        initial.imageUri,
        result.assets[0].uri,
        currentLanguage(),
        initial.diseaseName,
        { onTierChosen: setComparisonTier },
      );
      setComparisonText(routed.text);
      await setComparisonResponse(loopId, routed.text);
    } catch {
      setComparisonText(t('followup.compare_failed'));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!loop || !outcome) return;
    setBusy(true);
    await completeLoop(loop.id, {
      followupDiagnosisId: null,
      outcome,
      hypothesisConfirmed: confirmed,
      lesson: lesson.trim(),
    });
    navigation.replace('IntelligenceLog');
  };

  if (!loop || !initial) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('followup.title')}</Text>
        <Text style={styles.subtitle}>
          {t('followup.subtitle', { disease: initial.diseaseName })}
        </Text>

        <View style={styles.compareRow}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>{t('followup.before')}</Text>
            <Image source={{ uri: initial.imageUri }} style={styles.thumb} />
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>{t('followup.now')}</Text>
            {followupImage ? (
              <Image source={{ uri: followupImage }} style={styles.thumb} />
            ) : (
              <TouchableOpacity style={styles.photoBtn} onPress={takeFollowupPhoto} disabled={busy}>
                <Text style={styles.photoBtnText}>📷 {t('followup.take_photo')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {comparisonText && (
          <View style={styles.compareBox}>
            <Text style={styles.compareTitle}>
              🔬 {t('followup.ai_compare')}
              {comparisonTier && ` · ${comparisonTier}`}
            </Text>
            <Text style={styles.compareBody}>{comparisonText}</Text>
          </View>
        )}

        {loop.hypothesisAudioUri && (
          <TouchableOpacity
            style={styles.audioBtn}
            onPress={() => loop.hypothesisAudioUri && play(loop.hypothesisAudioUri)}
          >
            <Text style={styles.audioBtnText}>▶ {t('followup.play_hypothesis_audio')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>{t('followup.outcome_q')}</Text>
        <View style={styles.outcomeRow}>
          {OUTCOMES.map((o) => (
            <TouchableOpacity
              key={o.id}
              style={[
                styles.outcomeBtn,
                outcome === o.id && { borderColor: o.color, borderWidth: 2 },
              ]}
              onPress={() => setOutcome(o.id)}
            >
              <Text style={styles.outcomeText}>{t(o.key)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loop.hypothesisCategory && (
          <>
            <Text style={styles.sectionTitle}>
              {t('followup.confirm_q')} ({t(`hypothesis.opt_${loop.hypothesisCategory}`)})
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, confirmed === true && styles.confirmActive]}
                onPress={() => setConfirmed(true)}
              >
                <Text style={styles.confirmText}>✓ {t('followup.yes')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, confirmed === false && styles.confirmActive]}
                onPress={() => setConfirmed(false)}
              >
                <Text style={styles.confirmText}>✗ {t('followup.no')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>{t('followup.lesson_q')}</Text>
        <TextInput
          style={styles.lessonInput}
          value={lesson}
          onChangeText={setLesson}
          placeholder={t('followup.lesson_placeholder')}
          multiline
        />

        <TouchableOpacity
          style={[styles.cta, !outcome && styles.ctaDisabled]}
          onPress={finish}
          disabled={!outcome || busy}
        >
          <Text style={styles.ctaText}>
            {busy ? '…' : t('followup.save_to_log')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#1b5e20' },
  subtitle: { color: '#558b2f', marginTop: 4, marginBottom: 16 },
  compareRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  col: { flex: 1 },
  colLabel: { color: '#1b5e20', fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: '#eee' },
  photoBtn: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1b5e20',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  photoBtnText: { color: '#1b5e20', fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontWeight: '700', color: '#1b5e20', marginTop: 8, marginBottom: 8 },
  outcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outcomeBtn: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  outcomeText: { color: '#212121', fontWeight: '600' },
  confirmRow: { flexDirection: 'row', gap: 8 },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmActive: { borderColor: '#1b5e20', borderWidth: 2 },
  confirmText: { color: '#212121', fontWeight: '600' },
  lessonInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  cta: {
    backgroundColor: '#1b5e20',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontWeight: '700' },
  compareBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1565c0',
    marginBottom: 12,
  },
  compareTitle: { fontWeight: '700', color: '#1565c0', marginBottom: 4, fontSize: 13 },
  compareBody: { color: '#0d47a1', lineHeight: 20 },
  audioBtn: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1565c0',
    marginBottom: 12,
  },
  audioBtnText: { color: '#1565c0', fontWeight: '600' },
});
