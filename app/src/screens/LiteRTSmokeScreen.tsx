import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/types';

/** LiteRT-LM smoke test. Prefers a sideloaded cocoa_v1_e2b.litertlm
 *  (the fine-tune from notebook 04) when it's present on disk; falls
 *  back to downloading the upstream Gemma 3n E2B INT4 base only if
 *  the fine-tune isn't sideloaded. */
type Props = NativeStackScreenProps<RootStackParamList, 'LiteRTSmoke'>;

type Phase = 'idle' | 'downloading' | 'loading' | 'ready' | 'inferring' | 'done' | 'error';

const FINETUNE_FILENAME = 'cocoa_v1_e2b.litertlm';
const UPSTREAM_FILENAME = 'gemma-3n-e2b-int4.litertlm';
const PROMPT_FR = 'En une phrase: quelle maladie cause des taches noires sur les cabosses de cacao?';

function docDir(): string {
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error('FileSystem.documentDirectory is null');
  return dir;
}
/** Path WITH `file://` scheme — for expo-file-system APIs. */
function finetunePath(): string { return `${docDir()}${FINETUNE_FILENAME}`; }
/** Path WITHOUT `file://` scheme — for the native LiteRT-LM engine, which
 *  passes the string straight to stat(2) and fails with errno 2 (ENOENT)
 *  if the URI scheme prefix is left in. */
function finetuneNativePath(): string { return finetunePath().replace(/^file:\/\//, ''); }

async function fileExists(path: string, minSize = 1_000_000): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists && info.size !== undefined && info.size > minSize;
  } catch {
    return false;
  }
}

export default function LiteRTSmokeScreen({}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [stats, setStats] = useState<string | null>(null);
  const [memory, setMemory] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [moduleAvailable, setModuleAvailable] = useState<boolean | null>(null);
  const [finetuneOnDisk, setFinetuneOnDisk] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const llmRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('react-native-litert-lm');
        modRef.current = mod;
        setModuleAvailable(true);
        console.log('[LiteRT] module loaded; recommended backend =', mod.getRecommendedBackend());
      } catch (e) {
        setModuleAvailable(false);
        setErrorMsg(`Module import failed: ${(e as Error).message}`);
      }
      setFinetuneOnDisk(await fileExists(finetunePath()));
    })();
    return () => {
      if (llmRef.current) {
        llmRef.current.close().catch(() => {});
      }
    };
  }, []);

  /** Load whatever's on disk — sideloaded fine-tune preferred, upstream fallback. */
  const loadSideloaded = async () => {
    if (!modRef.current) return;
    setErrorMsg(null);
    try {
      if (!(await fileExists(finetunePath()))) {
        setErrorMsg(
          `${FINETUNE_FILENAME} not found in Documents — sideload via Finder → iPhone → Files → PokouAI, ` +
            `or use the download button below to grab the upstream Gemma 3n base.`,
        );
        setPhase('error');
        return;
      }
      const llm = modRef.current.createLLM({ enableMemoryTracking: true });
      llmRef.current = llm;

      setPhase('loading');
      setModelPath(finetuneNativePath());
      // Force 'gpu' (Metal on iOS) — getRecommendedBackend() returns 'cpu'
      // as a "safe default" per the binding docs, but CPU OOMs on a 2.5 GB
      // model on iPhone 14 Pro / 6 GB RAM. GPU uses a separate memory pool
      // and is what Google Edge AI's reference app uses for Gemma 4 E2B.
      const backend = 'gpu';
      console.log('[LiteRT] loadModel (sideloaded fine-tune) backend=', backend, finetuneNativePath());
      await llm.loadModel(finetuneNativePath(), { backend, maxTokens: 200, temperature: 0.2 });
      console.log('[LiteRT] ✓ fine-tune loaded');
      pollMemory();
      setPhase('ready');
    } catch (e) {
      console.error('[LiteRT] sideloaded load failed', e);
      setErrorMsg((e as Error).message);
      setPhase('error');
    }
  };

  const downloadAndLoad = async () => {
    if (!modRef.current) return;
    setPhase('downloading');
    setProgress(0);
    setErrorMsg(null);
    try {
      const llm = modRef.current.createLLM({ enableMemoryTracking: true });
      llmRef.current = llm;

      const url = modRef.current.GEMMA_3N_E2B_IT_INT4 as string;
      console.log('[LiteRT] download', url);
      const path = await llm.downloadModel(url, UPSTREAM_FILENAME, (p: number) => {
        setProgress(p);
      });
      console.log('[LiteRT] downloaded to', path);
      setModelPath(path);

      setPhase('loading');
      const backend = 'gpu';
      console.log('[LiteRT] loadModel (upstream) backend=', backend);
      await llm.loadModel(path, { backend, maxTokens: 200, temperature: 0.2 });
      console.log('[LiteRT] ✓ model loaded');
      pollMemory();
      setPhase('ready');
    } catch (e) {
      console.error('[LiteRT] download/load failed', e);
      setErrorMsg((e as Error).message);
      setPhase('error');
    }
  };

  const runInference = async () => {
    if (!llmRef.current) return;
    setPhase('inferring');
    setResponse('');
    setStats(null);
    try {
      const t0 = Date.now();
      const text = await llmRef.current.sendMessage(PROMPT_FR);
      const elapsed = Date.now() - t0;
      const s = llmRef.current.getStats();
      setResponse(text);
      setStats(
        `${s.completionTokens} tok in ${elapsed} ms · ${s.tokensPerSecond.toFixed(1)} tok/s · TTFT ${s.timeToFirstToken} ms`,
      );
      pollMemory();
      setPhase('done');
    } catch (e) {
      setErrorMsg((e as Error).message);
      setPhase('error');
    }
  };

  const release = async () => {
    if (llmRef.current) {
      await llmRef.current.close().catch(() => {});
      llmRef.current = null;
    }
    setPhase('idle');
    setMemory(null);
    setResponse('');
    setStats(null);
    setModelPath(null);
  };

  const pollMemory = () => {
    if (!llmRef.current) return;
    try {
      const m = llmRef.current.getMemoryUsage();
      const rss = (m.residentBytes / 1024 / 1024).toFixed(0);
      const heap = (m.nativeHeapBytes / 1024 / 1024).toFixed(0);
      const free = (m.availableMemoryBytes / 1024 / 1024).toFixed(0);
      setMemory(
        `RSS ${rss} MB · native heap ${heap} MB · free ${free} MB${m.isLowMemory ? ' · ⚠ LOW' : ''}`,
      );
    } catch {
      /* memory API may not be wired on all backends */
    }
  };

  if (moduleAvailable === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>LiteRT-LM smoke test</Text>
        <Text style={styles.error}>Native binding not available.</Text>
        <Text style={styles.muted}>{errorMsg ?? 'Make sure pod install ran and the app was rebuilt with `pnpm ios` after adding react-native-litert-lm.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>LiteRT-LM smoke test</Text>
        <Text style={styles.subtitle}>
          {finetuneOnDisk
            ? `✓ ${FINETUNE_FILENAME} on disk (sideloaded fine-tune)`
            : finetuneOnDisk === false
            ? `✗ ${FINETUNE_FILENAME} not sideloaded — will fall back to upstream Gemma 3n base`
            : 'checking for sideloaded model…'}
        </Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>State</Text>
          <Text style={styles.statusValue}>{phase}</Text>
          {phase === 'downloading' && (
            <Text style={styles.muted}>{(progress * 100).toFixed(0)}%</Text>
          )}
          {modelPath && <Text style={styles.muted} numberOfLines={1}>📁 {modelPath}</Text>}
          {memory && <Text style={styles.muted}>{memory}</Text>}
          {stats && <Text style={styles.muted}>{stats}</Text>}
        </View>

        {(phase === 'downloading' || phase === 'loading' || phase === 'inferring') && (
          <ActivityIndicator size="large" color="#1b5e20" style={{ marginVertical: 16 }} />
        )}

        {response && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Response</Text>
            <Text style={styles.body}>{response}</Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorBody}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {finetuneOnDisk ? (
            <TouchableOpacity
              style={[styles.btn, phase === 'loading' && styles.btnDisabled]}
              onPress={loadSideloaded}
              disabled={phase === 'loading'}
            >
              <Text style={styles.btnText}>📦 Load sideloaded fine-tune</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, (phase === 'downloading' || phase === 'loading') && styles.btnDisabled]}
              onPress={downloadAndLoad}
              disabled={phase === 'downloading' || phase === 'loading'}
            >
              <Text style={styles.btnText}>↓ Download upstream Gemma 3n + load</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, phase !== 'ready' && phase !== 'done' && styles.btnDisabled]}
            onPress={runInference}
            disabled={phase !== 'ready' && phase !== 'done'}
          >
            <Text style={styles.btnText}>▶ Run inference</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnGhost} onPress={release}>
            <Text style={styles.btnGhostText}>Release model</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  scroll: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1b5e20' },
  subtitle: { fontSize: 13, color: '#558b2f', marginBottom: 16 },
  statusBox: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  statusLabel: { fontSize: 11, color: '#558b2f', textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginVertical: 4 },
  muted: { fontSize: 12, color: '#616161', marginTop: 2 },
  section: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1b5e20', marginBottom: 6 },
  body: { color: '#212121', lineHeight: 20 },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
    marginBottom: 12,
  },
  errorTitle: { fontWeight: '700', color: '#c62828', marginBottom: 4 },
  errorBody: { color: '#5d4037', lineHeight: 18, fontSize: 12 },
  actions: { gap: 8, marginTop: 12 },
  btn: {
    backgroundColor: '#1b5e20',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#9e9e9e' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: { padding: 12, alignItems: 'center' },
  btnGhostText: { color: '#1b5e20' },
  error: { color: '#c62828', fontWeight: '700', marginTop: 8, marginHorizontal: 16 },
});
