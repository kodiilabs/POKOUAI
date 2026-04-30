import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupMode'>;

export default function GroupModeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const start = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!result.canceled && result.assets[0]) {
        navigation.navigate('Diagnosis', { imageUri: result.assets[0].uri, groupMode: true });
      }
    } catch {
      // Simulator fallback — open gallery instead
      try {
        const lib = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
        if (!lib.canceled && lib.assets[0]) {
          navigation.navigate('Diagnosis', {
            imageUri: lib.assets[0].uri,
            groupMode: true,
          });
        }
      } catch {
        /* user cancelled or no permission */
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.body}>
        <Text style={styles.brand}>👥</Text>
        <Text style={styles.title}>{t('group.title')}</Text>
        <Text style={styles.subtitle}>{t('group.subtitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('group.how_it_works')}</Text>
          <Text style={styles.bullet}>• {t('group.step_1')}</Text>
          <Text style={styles.bullet}>• {t('group.step_2')}</Text>
          <Text style={styles.bullet}>• {t('group.step_3')}</Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={start}>
          <Text style={styles.ctaText}>📷 {t('group.start')}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>{t('group.note_no_save')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00838f' },
  body: { flex: 1, padding: 24, justifyContent: 'space-between' },
  brand: { fontSize: 48, textAlign: 'center', marginTop: 24 },
  title: { fontSize: 28, color: '#fff', fontWeight: '700', textAlign: 'center', marginTop: 8 },
  subtitle: { color: '#b2ebf2', textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 14,
    marginTop: 24,
  },
  cardTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  bullet: { color: '#e0f7fa', lineHeight: 22 },
  cta: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#00838f', fontWeight: '700', fontSize: 18 },
  note: { color: '#b2ebf2', textAlign: 'center', marginTop: 12, fontSize: 12 },
});
