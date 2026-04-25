import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getDiagnosis, type DiagnosisRow } from '@/services/db';
import HypothesisCard from '@/components/HypothesisCard';
import type { ConfidenceBand, InferenceTier, RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const BAND_COLORS: Record<ConfidenceBand, string> = {
  high: '#2e7d32',
  medium: '#f9a825',
  low: '#c62828',
};

const TIER_LABEL: Record<InferenceTier, string> = {
  local: '📱 Llama.cpp · on-device',
  hub: '🛰 Ollama · hub',
  cloud: '☁️ Cloud · 27B',
};

function bandFor(c: number): ConfidenceBand {
  if (c >= 0.8) return 'high';
  if (c >= 0.55) return 'medium';
  return 'low';
}

export default function ResultScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { diagnosisId } = route.params;
  const [d, setD] = useState<DiagnosisRow | null>(null);

  useEffect(() => {
    (async () => setD(await getDiagnosis(diagnosisId)))();
  }, [diagnosisId]);

  if (!d) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const band = bandFor(d.confidence);

  const onShare = async () => {
    const message =
      `${t('result.disease')}: ${d.diseaseName}\n` +
      `${t('result.confidence')}: ${(d.confidence * 100).toFixed(0)}%\n\n` +
      `${t('result.treatment')}:\n- ${d.treatment.join('\n- ')}\n\n` +
      `— PokouAI`;
    await Share.share({ message });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={{ uri: d.imageUri }} style={styles.image} />

        <View style={styles.header}>
          <Text style={styles.disease}>{d.diseaseName}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.band, { backgroundColor: BAND_COLORS[band] }]}>
              <Text style={styles.bandText}>
                {t('result.confidence')}: {(d.confidence * 100).toFixed(0)}% · {t(`result.confidence_${band}`)}
              </Text>
            </View>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{TIER_LABEL[d.tier]}</Text>
            </View>
          </View>
        </View>

        <HypothesisCard diagnosisId={diagnosisId} diseaseName={d.diseaseName} />

        <Section title={t('result.symptoms')} items={d.symptoms} />
        <Section title={t('result.treatment')} items={d.treatment} />
        <Section title={t('result.prevention')} items={d.prevention} />

        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>📞 {t('result.agronomist')}</Text>
          <Text style={styles.calloutBody}>{d.agronomistAdvice}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Learn', { diagnosisId })}
          >
            <Text style={styles.actionBtnText}>📖 {t('result.learn_more')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Quiz', { diagnosisId })}
          >
            <Text style={styles.actionBtnText}>🧠 {t('result.practice')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
          <Text style={styles.shareBtnText}>{t('result.share')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((s, i) => (
        <Text key={i} style={styles.item}>
          • {s}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 16 },
  header: { marginBottom: 16 },
  disease: { fontSize: 24, fontWeight: '700', color: '#1b5e20' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  band: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  bandText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#263238',
  },
  tierBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 8 },
  item: { color: '#212121', lineHeight: 22, marginBottom: 4 },
  callout: {
    backgroundColor: '#fff3e0',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
    marginBottom: 16,
  },
  calloutTitle: { fontWeight: '700', color: '#e65100', marginBottom: 4 },
  calloutBody: { color: '#4e342e', lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1b5e20',
  },
  actionBtnText: { color: '#1b5e20', fontWeight: '700' },
  shareBtn: {
    backgroundColor: '#1b5e20',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '700' },
});
