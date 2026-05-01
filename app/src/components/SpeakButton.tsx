import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isSpeechSupported, speak, stopSpeaking } from '@/services/speech';
import type { LanguageCode } from '@/types';

interface Props {
  text: string;
  language: LanguageCode;
  /** Optional override label, e.g. "Read aloud" / "Read comparison" */
  label?: string;
  style?: object;
}

export default function SpeakButton({ text, language, label, style }: Props) {
  const { t } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const supported = isSpeechSupported(language);

  // Stop on unmount
  useEffect(() => {
    return () => {
      stopSpeaking().catch(() => {});
    };
  }, []);

  const onPress = async () => {
    if (!supported) {
      Alert.alert(t('speech.unavailable_title'), t('speech.unavailable_body'));
      return;
    }
    if (speaking) {
      await stopSpeaking();
      setSpeaking(false);
      return;
    }
    try {
      setSpeaking(true);
      await speak(text, language);
      // expo-speech doesn't give us a clean "done" callback in all versions —
      // poll for ~30s as a safety; the UI just shows ▶ until pressed again.
      setTimeout(() => setSpeaking(false), 30_000);
    } catch {
      setSpeaking(false);
    }
  };

  const icon = !supported ? '🔇' : speaking ? '⏹' : '🔊';
  const text_ = label ?? (speaking ? t('speech.stop') : t('speech.play'));

  return (
    <TouchableOpacity
      style={[styles.btn, !supported && styles.btnDisabled, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.txt}>
        {icon} {text_}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1b5e20',
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  btnDisabled: {
    borderColor: '#9e9e9e',
    backgroundColor: '#f5f5f5',
  },
  txt: { color: '#1b5e20', fontWeight: '600' },
});
