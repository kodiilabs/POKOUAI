import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listDiagnoses, type DiagnosisRow } from '@/services/db';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmLog'>;

export default function FarmLogScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DiagnosisRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => setRows(await listDiagnoses(100)))();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('farmlog.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Result', { diagnosisId: item.id })}
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              <View style={styles.body}>
                <Text style={styles.title}>{item.diseaseName}</Text>
                <Text style={styles.sub}>
                  {new Date(item.createdAt).toLocaleString()} · {(item.confidence * 100).toFixed(0)}%
                </Text>
                <Text style={[styles.syncBadge, item.syncedAt ? styles.synced : styles.pending]}>
                  {item.syncedAt ? t('farmlog.synced') : t('farmlog.not_synced')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#757575', fontStyle: 'italic' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
  body: { marginLeft: 12, flex: 1 },
  title: { fontWeight: '600', color: '#1b5e20' },
  sub: { color: '#757575', fontSize: 12, marginTop: 2 },
  syncBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  synced: { backgroundColor: '#c8e6c9', color: '#1b5e20' },
  pending: { backgroundColor: '#ffe0b2', color: '#e65100' },
});
