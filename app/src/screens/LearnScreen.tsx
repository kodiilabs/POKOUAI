import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getDiagnosis, type DiagnosisRow } from '@/services/db';
import { getCauses, getSources } from '@/services/knowledge';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Learn'>;

export default function LearnScreen({ route }: Props) {
  const { t, i18n } = useTranslation();
  const [d, setD] = useState<DiagnosisRow | null>(null);

  useEffect(() => {
    (async () => setD(await getDiagnosis(route.params.diagnosisId)))();
  }, [route.params.diagnosisId]);

  if (!d) return null;
  const causes = getCauses(d.disease, i18n.language);
  const sources = getSources(d.disease);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('learn.why_title')}</Text>
        <Text style={styles.disease}>{d.diseaseName}</Text>

        <Section title={t('learn.why_it_happened')} items={causes.conditions} />
        <Section title={t('learn.what_you_did')} items={causes.contributing} />
        <Section title={t('learn.change_next_season')} items={causes.nextSeason} />

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>💡 {t('learn.takeaway_title')}</Text>
          <Text style={styles.tipBody}>{t('learn.takeaway_body')}</Text>
        </View>

        {sources.length > 0 && (
          <View style={styles.sources}>
            <Text style={styles.sourcesLabel}>📚 {t('learn.sources')}</Text>
            <Text style={styles.sourcesBody}>{sources.join(' · ')}</Text>
          </View>
        )}
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
  scroll: { padding: 16 },
  title: { fontSize: 14, color: '#558b2f', fontWeight: '600', marginBottom: 4 },
  disease: { fontSize: 22, fontWeight: '700', color: '#1b5e20', marginBottom: 16 },
  section: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 8 },
  item: { color: '#212121', lineHeight: 22, marginBottom: 4 },
  tip: {
    backgroundColor: '#fff8e1',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f9a825',
  },
  tipTitle: { fontWeight: '700', color: '#e65100', marginBottom: 4 },
  tipBody: { color: '#4e342e', lineHeight: 20 },
  sources: { marginTop: 12, paddingHorizontal: 4 },
  sourcesLabel: { fontSize: 11, color: '#558b2f', fontWeight: '700', marginBottom: 2, letterSpacing: 0.5 },
  sourcesBody: { fontSize: 11, color: '#616161', lineHeight: 16 },
});
