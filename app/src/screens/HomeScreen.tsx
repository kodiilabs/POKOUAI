import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { recentDiagnoses, type DiagnosisRow } from '@/services/db';
import { isHubReachable, isOnline } from '@/services/NetworkService';
import { listPendingLoops } from '@/services/loops';
import type { Loop } from '@/types';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [recent, setRecent] = useState<DiagnosisRow[]>([]);
  const [online, setOnline] = useState(false);

  const [hubReady, setHubReady] = useState(false);
  const [overdue, setOverdue] = useState<Loop[]>([]);

  const refresh = useCallback(async () => {
    const [rows, net, hub, pending] = await Promise.all([
      recentDiagnoses(3),
      isOnline(),
      isHubReachable(),
      listPendingLoops(),
    ]);
    setRecent(rows);
    setOnline(net);
    setHubReady(hub);
    const now = Date.now();
    setOverdue(pending.filter((l) => new Date(l.scheduledFor).getTime() <= now));
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
        <View style={[styles.badge, styles.badgeLocal]}>
          <Text style={styles.badgeText}>📱 {t('tier.local')}</Text>
        </View>
        {hubReady && (
          <View style={[styles.badge, styles.badgeHub]}>
            <Text style={styles.badgeText}>🛰 {t('tier.hub')}</Text>
          </View>
        )}
        <View style={[styles.badge, online ? styles.badgeOnline : styles.badgeOffline]}>
          <Text style={styles.badgeText}>
            ☁️ {online ? t('home.online_badge') : t('home.offline_badge')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {overdue.length > 0 && (
          <TouchableOpacity
            style={styles.overdueBanner}
            onPress={() =>
              overdue[0] && navigation.navigate('FollowUp', { loopId: overdue[0].id })
            }
          >
            <Text style={styles.overdueTitle}>
              ⏰ {t('home.overdue_title', { count: overdue.length })}
            </Text>
            <Text style={styles.overdueBody}>{t('home.overdue_body')}</Text>
          </TouchableOpacity>
        )}

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

        <Text style={styles.sectionTitle}>{t('home.learn_section')}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.tile}
            onPress={() => navigation.navigate('PreventionCalendar')}
          >
            <Text style={styles.tileText}>📅 {t('home.calendar')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Quiz', {})}>
            <Text style={styles.tileText}>🧠 {t('home.quiz')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.intelTile}
          onPress={() => navigation.navigate('IntelligenceLog')}
        >
          <Text style={styles.intelTitle}>🔬 {t('home.intel_log')}</Text>
          <Text style={styles.intelSub}>{t('home.intel_sub')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.groupBtn}
          onPress={() => navigation.navigate('GroupMode')}
        >
          <Text style={styles.groupBtnText}>👥 {t('home.group_mode')}</Text>
          <Text style={styles.groupBtnSub}>{t('home.group_mode_sub')}</Text>
        </TouchableOpacity>

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
  header: { padding: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeLocal: { backgroundColor: '#1b5e20' },
  badgeHub: { backgroundColor: '#00838f' },
  badgeOnline: { backgroundColor: '#2e7d32' },
  badgeOffline: { backgroundColor: '#616161' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
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
  groupBtn: {
    backgroundColor: '#00838f',
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  groupBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  groupBtnSub: { color: '#b2ebf2', fontSize: 12, marginTop: 2 },
  intelTile: {
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  intelTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  intelSub: { color: '#bbdefb', fontSize: 12, marginTop: 2 },
  overdueBanner: {
    backgroundColor: '#c62828',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  overdueTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overdueBody: { color: '#ffcdd2', fontSize: 12, marginTop: 2 },
});
