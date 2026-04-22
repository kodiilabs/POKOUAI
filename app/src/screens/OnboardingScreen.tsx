import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { setLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { markOnboarded } from '@/services/preferences';
import type { CropId, LanguageCode, RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const CROPS: CropId[] = ['cocoa', 'coffee', 'cashew', 'other'];

export default function OnboardingScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<LanguageCode>((i18n.language as LanguageCode) ?? 'fr');
  const [crop, setCrop] = useState<CropId>('cocoa');
  const [step, setStep] = useState<'lang' | 'crop' | 'consent'>('lang');

  const onLangPick = async (l: LanguageCode) => {
    setLang(l);
    await setLanguage(l);
  };

  const finish = async () => {
    await markOnboarded(lang, crop);
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>🌱 PokouAI</Text>
        <Text style={styles.title}>{t('onboarding.welcome')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

        {step === 'lang' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('onboarding.select_language')}</Text>
            {SUPPORTED_LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.choice, lang === l && styles.choiceActive]}
                onPress={() => onLangPick(l)}
              >
                <Text style={[styles.choiceText, lang === l && styles.choiceTextActive]}>
                  {t(`lang.${l}`)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cta} onPress={() => setStep('crop')}>
              <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'crop' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('onboarding.select_crop')}</Text>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.choice, crop === c && styles.choiceActive]}
                onPress={() => setCrop(c)}
              >
                <Text style={[styles.choiceText, crop === c && styles.choiceTextActive]}>
                  {t(`crop.${c}`)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cta} onPress={() => setStep('consent')}>
              <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'consent' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('onboarding.consent_title')}</Text>
            <Text style={styles.consentBody}>{t('onboarding.consent_body')}</Text>
            <TouchableOpacity style={styles.cta} onPress={finish}>
              <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b3d13' },
  scroll: { padding: 24, flexGrow: 1 },
  brand: { fontSize: 40, textAlign: 'center', marginTop: 24, color: '#fff' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 8 },
  subtitle: { color: '#c8e6c9', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  section: { marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  choice: {
    backgroundColor: '#1b5e20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choiceActive: { borderColor: '#ffca28', backgroundColor: '#2e7d32' },
  choiceText: { color: '#e8f5e9', fontSize: 16 },
  choiceTextActive: { color: '#fff', fontWeight: '700' },
  cta: { backgroundColor: '#ffca28', padding: 16, borderRadius: 12, marginTop: 16 },
  ctaText: { color: '#000', fontWeight: '700', textAlign: 'center', fontSize: 16 },
  consentBody: { color: '#c8e6c9', lineHeight: 22, marginBottom: 16 },
});
