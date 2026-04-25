import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { createLoop, getLoopByDiagnosis, setHypothesis, setHypothesisAudio } from '@/services/loops';
import { scheduleFollowUpReminder } from '@/services/notifications';
import { play, startRecording, type RecordingHandle } from '@/services/voice';
import type { HypothesisCategory, Loop } from '@/types';

interface Props {
  diagnosisId: number;
  diseaseName: string;
}

const OPTIONS: { id: HypothesisCategory; emoji: string; key: string }[] = [
  { id: 'rain', emoji: '🌧', key: 'hypothesis.opt_rain' },
  { id: 'neighbour', emoji: '🌳', key: 'hypothesis.opt_neighbour' },
  { id: 'insects', emoji: '🐜', key: 'hypothesis.opt_insects' },
  { id: 'unknown', emoji: '🤷', key: 'hypothesis.opt_unknown' },
];

export default function HypothesisCard({ diagnosisId, diseaseName }: Props) {
  const { t } = useTranslation();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [busy, setBusy] = useState(false);
  const [recHandle, setRecHandle] = useState<RecordingHandle | null>(null);

  useEffect(() => {
    (async () => setLoop(await getLoopByDiagnosis(diagnosisId)))();
  }, [diagnosisId]);

  const ensureLoop = async (): Promise<number> => {
    const existing = await getLoopByDiagnosis(diagnosisId);
    if (existing) return existing.id;
    let scheduledFor: string;
    let notificationId: string | null = null;
    try {
      const sched = await scheduleFollowUpReminder({
        loopId: 0,
        diseaseName,
        body: t('hypothesis.reminder_body', { disease: diseaseName }),
      });
      scheduledFor = sched.firesAt;
      notificationId = sched.id;
    } catch {
      scheduledFor = new Date(Date.now() + 7 * 86400_000).toISOString();
    }
    return createLoop({ diagnosisId, scheduledFor, notificationId });
  };

  const pick = async (cat: HypothesisCategory) => {
    setBusy(true);
    try {
      const id = await ensureLoop();
      await setHypothesis(id, cat, null);
      setLoop(await getLoopByDiagnosis(diagnosisId));
    } finally {
      setBusy(false);
    }
  };

  const startRec = async () => {
    try {
      const h = await startRecording();
      setRecHandle(h);
    } catch {
      /* permission denied or device error */
    }
  };

  const stopRec = async () => {
    if (!recHandle) return;
    setBusy(true);
    try {
      const { uri } = await recHandle.stop();
      const id = await ensureLoop();
      await setHypothesisAudio(id, uri);
      setLoop(await getLoopByDiagnosis(diagnosisId));
    } finally {
      setRecHandle(null);
      setBusy(false);
    }
  };

  if (loop) {
    return (
      <View style={[styles.card, styles.cardConfirmed]}>
        <Text style={styles.confirmedTitle}>🔬 {t('hypothesis.scheduled_title')}</Text>
        <Text style={styles.confirmedBody}>
          {t('hypothesis.scheduled_body', {
            date: new Date(loop.scheduledFor).toLocaleDateString(),
          })}
        </Text>
        {loop.hypothesisCategory && (
          <Text style={styles.hypothesisLine}>
            {t('hypothesis.your_theory')}: {t(`hypothesis.opt_${loop.hypothesisCategory}`)}
          </Text>
        )}
        {loop.hypothesisAudioUri && (
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => loop.hypothesisAudioUri && play(loop.hypothesisAudioUri)}
          >
            <Text style={styles.playBtnText}>▶ {t('hypothesis.play_voice')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🔬 {t('hypothesis.prompt_title')}</Text>
      <Text style={styles.body}>{t('hypothesis.prompt_body')}</Text>
      {busy ? (
        <ActivityIndicator color="#1b5e20" style={{ marginTop: 12 }} />
      ) : (
        <>
          <View style={styles.options}>
            {OPTIONS.map((o) => (
              <TouchableOpacity key={o.id} style={styles.option} onPress={() => pick(o.id)}>
                <Text style={styles.optionEmoji}>{o.emoji}</Text>
                <Text style={styles.optionLabel}>{t(o.key)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.voiceBtn, recHandle && styles.voiceBtnActive]}
            onPress={recHandle ? stopRec : startRec}
          >
            <Text style={styles.voiceBtnText}>
              {recHandle ? `⏹ ${t('hypothesis.stop_voice')}` : `🎙 ${t('hypothesis.start_voice')}`}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e3f2fd',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1565c0',
    marginBottom: 12,
  },
  cardConfirmed: { backgroundColor: '#e8f5e9', borderLeftColor: '#1b5e20' },
  title: { fontWeight: '700', color: '#1565c0', marginBottom: 4 },
  body: { color: '#1a237e', lineHeight: 20, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: { fontSize: 22, marginRight: 8 },
  optionLabel: { color: '#212121', fontWeight: '600', flexShrink: 1 },
  confirmedTitle: { fontWeight: '700', color: '#1b5e20', marginBottom: 4 },
  confirmedBody: { color: '#2e7d32', lineHeight: 20 },
  hypothesisLine: { color: '#1b5e20', marginTop: 6, fontStyle: 'italic' },
  voiceBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1565c0',
  },
  voiceBtnActive: { backgroundColor: '#c62828', borderColor: '#c62828' },
  voiceBtnText: { color: '#1565c0', fontWeight: '700' },
  playBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1b5e20',
  },
  playBtnText: { color: '#1b5e20', fontWeight: '600' },
});
