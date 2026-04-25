import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listCompletedLoops, listPendingLoops } from '@/services/loops';
import { getDiagnosis } from '@/services/db';
import { play } from '@/services/voice';
import type { Loop, LoopOutcome, RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IntelligenceLog'>;

interface Enriched extends Loop {
  diseaseName: string;
}

const OUTCOME_COLOR: Record<LoopOutcome, string> = {
  stabilised: '#2e7d32',
  healed: '#1b5e20',
  progressed: '#c62828',
  unknown: '#616161',
};

export default function FarmIntelligenceLogScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState<Enriched[]>([]);
  const [pending, setPending] = useState<Enriched[]>([]);

  const refresh = useCallback(async () => {
    const [c, p] = await Promise.all([listCompletedLoops(), listPendingLoops()]);
    const enrich = async (loop: Loop): Promise<Enriched> => {
      const d = await getDiagnosis(loop.initialDiagnosisId);
      return { ...loop, diseaseName: d?.diseaseName ?? '—' };
    };
    setCompleted(await Promise.all(c.map(enrich)));
    setPending(await Promise.all(p.map(enrich)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const total = completed.length + pending.length;
  if (total === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.empty}>{t('intel.empty')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={[
          ...pending.map((l) => ({ kind: 'pending' as const, loop: l })),
          ...completed.map((l) => ({ kind: 'completed' as const, loop: l })),
        ]}
        keyExtractor={(it) => `${it.kind}-${it.loop.id}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.header}>
            {t('intel.summary', { count: completed.length, pending: pending.length })}
          </Text>
        }
        renderItem={({ item }) => {
          if (item.kind === 'pending') {
            const due = new Date(item.loop.scheduledFor);
            const overdue = due.getTime() < Date.now();
            return (
              <TouchableOpacity
                style={[styles.card, overdue && styles.cardOverdue]}
                onPress={() => navigation.navigate('FollowUp', { loopId: item.loop.id })}
              >
                <View style={styles.row}>
                  <Text style={styles.cardTitle}>{item.loop.diseaseName}</Text>
                  <Text style={overdue ? styles.statusOverdue : styles.statusPending}>
                    {overdue ? t('intel.overdue') : t('intel.pending')}
                  </Text>
                </View>
                <Text style={styles.cardSub}>
                  {t('intel.followup_due')}: {due.toLocaleDateString()}
                </Text>
                {item.loop.hypothesisCategory && (
                  <Text style={styles.hypothesis}>
                    {t('intel.your_theory')}: {t(`hypothesis.opt_${item.loop.hypothesisCategory}`)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }
          const outcomeColor = item.loop.outcome ? OUTCOME_COLOR[item.loop.outcome] : '#616161';
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{item.loop.diseaseName}</Text>
                {item.loop.outcome && (
                  <Text style={[styles.outcomeTag, { color: outcomeColor }]}>
                    {t(`followup.outcome_${item.loop.outcome}`)}
                  </Text>
                )}
              </View>
              {item.loop.hypothesisCategory && (
                <Text style={styles.hypothesis}>
                  {t('intel.your_theory')}: {t(`hypothesis.opt_${item.loop.hypothesisCategory}`)}{' '}
                  {item.loop.hypothesisConfirmed === true && '✓'}
                  {item.loop.hypothesisConfirmed === false && '✗'}
                </Text>
              )}
              {item.loop.hypothesisAudioUri && (
                <TouchableOpacity
                  style={styles.audioPill}
                  onPress={() => item.loop.hypothesisAudioUri && play(item.loop.hypothesisAudioUri)}
                >
                  <Text style={styles.audioPillText}>▶ {t('intel.play_voice')}</Text>
                </TouchableOpacity>
              )}
              {item.loop.lesson ? (
                <View style={styles.lessonBox}>
                  <Text style={styles.lessonLabel}>{t('intel.lesson')}</Text>
                  <Text style={styles.lessonText}>{item.loop.lesson}</Text>
                </View>
              ) : null}
              {item.loop.completedAt && (
                <Text style={styles.cardSub}>
                  {new Date(item.loop.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty: { color: '#757575', fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  list: { padding: 16 },
  header: { color: '#1b5e20', fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  cardOverdue: { borderLeftWidth: 4, borderLeftColor: '#c62828' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700', color: '#1b5e20', flex: 1 },
  cardSub: { color: '#757575', fontSize: 12, marginTop: 4 },
  hypothesis: { color: '#1b5e20', fontStyle: 'italic', marginTop: 6 },
  outcomeTag: { fontWeight: '700', fontSize: 12 },
  statusPending: { color: '#f57c00', fontSize: 12, fontWeight: '700' },
  statusOverdue: { color: '#c62828', fontSize: 12, fontWeight: '700' },
  lessonBox: {
    backgroundColor: '#fff8e1',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f9a825',
  },
  lessonLabel: { color: '#e65100', fontWeight: '700', fontSize: 12, marginBottom: 2 },
  lessonText: { color: '#4e342e', lineHeight: 20 },
  audioPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  audioPillText: { color: '#1565c0', fontSize: 12, fontWeight: '600' },
});
