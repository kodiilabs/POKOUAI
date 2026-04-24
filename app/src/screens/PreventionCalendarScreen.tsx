import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getCalendar } from '@/services/knowledge';

export default function PreventionCalendarScreen() {
  const { t, i18n } = useTranslation();
  const entries = getCalendar('cocoa', i18n.language);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>{t('calendar.subtitle')}</Text>
        {entries.map((e) => (
          <View key={e.month} style={styles.card}>
            <View style={styles.monthPill}>
              <Text style={styles.monthText}>{e.month}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{e.title}</Text>
              {e.actions.map((a, i) => (
                <Text key={i} style={styles.item}>
                  • {a}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  scroll: { padding: 16 },
  subtitle: { color: '#558b2f', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  monthPill: {
    backgroundColor: '#1b5e20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginRight: 12,
  },
  monthText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  body: { flex: 1 },
  title: { fontWeight: '700', color: '#1b5e20', marginBottom: 6 },
  item: { color: '#212121', lineHeight: 20 },
});
