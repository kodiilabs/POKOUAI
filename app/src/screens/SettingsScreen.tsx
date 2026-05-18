import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { isDraftLanguage, setLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { isModelReady as isLlamaReady } from '@/services/LlamaService';
import { isModelReady as isLiteRTReady } from '@/services/LiteRTService';
import { clearAllDiagnoses } from '@/services/db';
import {
  getCloudSyncEnabled,
  getLastSync,
  setCloudSyncEnabled,
} from '@/services/preferences';
import { SKILL_LEVELS, type SkillLevel } from '@/services/farmerAgent';
import { useSkillLevel } from '@/hooks/useSkillLevel';
import { syncPending } from '@/services/SyncService';
import type { LanguageCode, RootStackParamList } from '@/types';

const MODEL_VERSION = 'cocoa_v1_e2b';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SKILL_LABEL: Record<SkillLevel, string> = {
  novice: 'Novice',
  practitioner: 'Practitioner',
  expert: 'Expert',
};

export default function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [lastSync, setLastSyncState] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [modelReady, setModelReady] = useState<boolean | null>(null);
  const [skillLevel, setSkillLevelState] = useSkillLevel();

  useEffect(() => {
    (async () => {
      setCloudEnabled(await getCloudSyncEnabled());
      setLastSyncState(await getLastSync());
      const [litert, llama] = await Promise.all([isLiteRTReady(), isLlamaReady()]);
      setModelReady(litert || llama);
    })();
  }, []);

  const toggleCloud = async (v: boolean) => {
    setCloudEnabled(v);
    await setCloudSyncEnabled(v);
  };

  const pickLang = async (l: LanguageCode) => {
    await setLanguage(l);
  };

  const syncNow = async () => {
    setSyncing(true);
    await syncPending();
    setLastSyncState(await getLastSync());
    setSyncing(false);
  };

  const confirmClearDiagnoses = () => {
    Alert.alert(
      t('settings.clear_diagnoses'),
      t('settings.clear_diagnoses_confirm'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearAllDiagnoses();
            Alert.alert(t('settings.clear_diagnoses_done'));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title={t('settings.language')}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.row, i18n.language === l && styles.rowActive]}
              onPress={() => pickLang(l)}
            >
              <Text style={styles.rowText}>
                {t(`lang.${l}`)}
                {isDraftLanguage(l) ? `  ${t('lang.draft_label')}` : ''}
              </Text>
              {i18n.language === l && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Section>

        <Section title={t('settings.model_version')}>
          <View style={styles.row}>
            <Text style={styles.rowText}>{MODEL_VERSION}</Text>
            <Text style={styles.rowMeta}>
              {modelReady === null ? '…' : modelReady ? `✓ ${t('settings.model_ready')}` : `⚠ ${t('settings.model_missing')}`}
            </Text>
          </View>
          {modelReady === false && (
            <View style={styles.row}>
              <Text style={styles.hint}>{t('settings.model_sideload_hint')}</Text>
            </View>
          )}
        </Section>

        <Section title={t('settings.hub')}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('HubSettings')}>
            <Text style={styles.rowText}>🛰 {t('settings.hub_config')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Agent skill level">
          {SKILL_LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv}
              style={[styles.row, skillLevel === lv && styles.rowActive]}
              onPress={() => void setSkillLevelState(lv)}
            >
              <Text style={styles.rowText}>{SKILL_LABEL[lv]}</Text>
              {skillLevel === lv && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
          <View style={styles.row}>
            <Text style={styles.hint}>
              Adapts every prompt, treatment, and follow-up. Auto-inference from behavioural
              signals is the next milestone.
            </Text>
          </View>
        </Section>

        {__DEV__ && (
          <Section title="Dev">
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('LiteRTSmoke')}>
              <Text style={styles.rowText}>🧪 LiteRT-LM smoke test</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={confirmClearDiagnoses}>
              <Text style={[styles.rowText, styles.danger]}>🗑 {t('settings.clear_diagnoses')}</Text>
            </TouchableOpacity>
          </Section>
        )}

        <Section title={t('settings.last_sync')}>
          <View style={styles.row}>
            <Text style={styles.rowText}>
              {lastSync ? new Date(lastSync).toLocaleString() : t('settings.never')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>☁️ Cloud sync</Text>
            <Switch value={cloudEnabled} onValueChange={toggleCloud} />
          </View>
          <TouchableOpacity style={styles.cta} onPress={syncNow} disabled={syncing || !cloudEnabled}>
            <Text style={styles.ctaText}>{syncing ? '…' : t('settings.sync_now')}</Text>
          </TouchableOpacity>
        </Section>

        <Section title={t('settings.about')}>
          <View style={styles.row}>
            <Text style={styles.rowText}>PokouAI v0.1.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Apache 2.0 · {t('settings.privacy')}</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e20',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionBody: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  rowActive: { backgroundColor: '#e8f5e9' },
  rowText: { color: '#212121', fontSize: 15 },
  rowMeta: { color: '#616161', fontSize: 13 },
  hint: { color: '#616161', fontSize: 13, lineHeight: 18 },
  danger: { color: '#c62828', fontWeight: '700' },
  check: { color: '#1b5e20', fontWeight: '700' },
  chevron: { color: '#9e9e9e', fontSize: 22 },
  cta: { backgroundColor: '#1b5e20', padding: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
