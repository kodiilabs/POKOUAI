import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { recentDiagnoses, type DiagnosisRow } from '@/services/db';
import { isOnline } from '@/services/SyncService';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [recent, setRecent] = useState<DiagnosisRow[]>([]);
  const [online, setOnline] = useState(false);

  const refresh = useCallback(async () => {
    const [rows, net] = await Promise.all([recentDiagnoses(3), isOnline()]);
    setRecent(rows);
    setOnline(net);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate('Diagnosis', { imageUri: result.assets[0].uri });
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate('Diagnosis', { imageUri: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={[styles.badge, online ? styles.badgeOnline : styles.badgeOffline]}>
          <Text style={styles.badgeText}>
            {online ? t('home.online_badge') : t('home.offline_badge')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
          <Text style={styles.primaryBtnText}>📷 {t('home.take_photo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromGallery}>
          <Text style={styles.secondaryBtnText}>🖼 {t('home.from_gallery')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('home.recent_diagnoses')}</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>{t('home.no_recent')}</Text>
        ) : (
          recent.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.card}
              onPress={() => navigation.navigate('Result', { diagnosisId: d.id })}
            >
              <Image source={{ uri: d.imageUri }} style={styles.thumb} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{d.diseaseName}</Text>
                <Text style={styles.cardSub}>
                  {new Date(d.createdAt).toLocaleDateString()} · {(d.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.row}>
          <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('FarmLog')}>
            <Text style={styles.tileText}>📘 {t('home.view_log')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.tileText}>⚙️ {t('home.settings')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  header: { padding: 12, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeOnline: { backgroundColor: '#2e7d32' },
  badgeOffline: { backgroundColor: '#616161' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 48 },
  primaryBtn: {
    backgroundColor: '#1b5e20',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#aed581',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryBtnText: { color: '#1b5e20', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#1b5e20' },
  empty: { color: '#757575', fontStyle: 'italic', marginBottom: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee' },
  cardBody: { marginLeft: 12, flex: 1 },
  cardTitle: { fontWeight: '600', color: '#1b5e20' },
  cardSub: { color: '#757575', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', marginTop: 16, gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tileText: { color: '#1b5e20', fontWeight: '600' },
});
