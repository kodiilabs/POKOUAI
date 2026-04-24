import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  getHubModel,
  getHubUrl,
  HUB_MODEL_OPTIONS,
  setHubModel,
  setHubUrl,
  type HubModel,
} from '@/services/preferences';
import { isHubReachable } from '@/services/NetworkService';

type ProbeState = 'idle' | 'probing' | 'ok' | 'fail';

const MODEL_HINTS: Record<HubModel, string> = {
  'gemma4:27b': 'hub.model_27b_hint',
  'gemma4:e4b': 'hub.model_e4b_hint',
};

export default function HubSettingsScreen() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [model, setModel] = useState<HubModel>('gemma4:27b');
  const [probe, setProbe] = useState<ProbeState>('idle');

  useEffect(() => {
    (async () => {
      setUrl(await getHubUrl());
      setModel(await getHubModel());
    })();
  }, []);

  const pickModel = async (m: HubModel) => {
    setModel(m);
    await setHubModel(m);
  };

  const save = async () => {
    await setHubUrl(url.trim());
    setProbe('probing');
    setProbe((await isHubReachable()) ? 'ok' : 'fail');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.body}>
        <Text style={styles.label}>{t('hub.url_label')}</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.100:11434"
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.help}>{t('hub.help')}</Text>

        <TouchableOpacity style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>{t('hub.save_and_test')}</Text>
        </TouchableOpacity>

        {probe === 'probing' && <Text style={styles.status}>…</Text>}
        {probe === 'ok' && <Text style={[styles.status, styles.ok]}>✓ {t('hub.reachable')}</Text>}
        {probe === 'fail' && (
          <Text style={[styles.status, styles.fail]}>✗ {t('hub.unreachable')}</Text>
        )}

        <Text style={[styles.label, styles.labelSpaced]}>{t('hub.model_label')}</Text>
        {HUB_MODEL_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modelRow, model === m && styles.modelRowActive]}
            onPress={() => pickModel(m)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.modelName}>{m}</Text>
              <Text style={styles.modelHint}>{t(MODEL_HINTS[m])}</Text>
            </View>
            {model === m && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        <View style={styles.snippet}>
          <Text style={styles.snippetTitle}>{t('hub.setup_title')}</Text>
          <Text style={styles.code}>curl -fsSL https://ollama.com/install.sh | sh</Text>
          <Text style={styles.code}>ollama pull {model}</Text>
          <Text style={styles.code}>ollama serve</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  body: { padding: 16 },
  label: { fontWeight: '700', color: '#1b5e20', marginBottom: 6 },
  labelSpaced: { marginTop: 20 },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelRowActive: { borderColor: '#1b5e20' },
  modelName: { color: '#212121', fontWeight: '700', fontFamily: 'Courier' },
  modelHint: { color: '#616161', fontSize: 12, marginTop: 2 },
  check: { color: '#1b5e20', fontWeight: '700', fontSize: 18 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  help: { color: '#757575', fontSize: 12, marginTop: 6, marginBottom: 16 },
  btn: { backgroundColor: '#1b5e20', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  status: { textAlign: 'center', marginTop: 12, fontSize: 15 },
  ok: { color: '#2e7d32' },
  fail: { color: '#c62828' },
  snippet: {
    backgroundColor: '#263238',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  snippetTitle: { color: '#b3e5fc', fontWeight: '700', marginBottom: 6 },
  code: { color: '#fff', fontFamily: 'Courier', fontSize: 12, marginBottom: 2 },
});
