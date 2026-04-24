import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listDiagnoses, type DiagnosisRow } from '@/services/db';
import { pickQuizQuestion, type QuizQuestion } from '@/services/knowledge';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ route }: Props) {
  const { t, i18n } = useTranslation();
  const [diagnosis, setDiagnosis] = useState<DiagnosisRow | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await listDiagnoses(10);
    const target = route.params.diagnosisId
      ? rows.find((r) => r.id === route.params.diagnosisId) ?? rows[0]
      : rows[0];
    if (!target) {
      setDiagnosis(null);
      return;
    }
    setDiagnosis(target);
    setQuestion(pickQuizQuestion(target.disease, i18n.language));
    setAnswer('');
    setFeedback(null);
  }, [route.params.diagnosisId, i18n.language]);

  useEffect(() => {
    load();
  }, [load]);

  const check = () => {
    if (!question) return;
    const normalized = answer.toLowerCase();
    const match = question.keywords.some((k) => normalized.includes(k.toLowerCase()));
    setFeedback(match ? t('quiz.correct') : t('quiz.try_again'));
  };

  if (!diagnosis) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.empty}>{t('quiz.empty')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.scroll}>
        <Text style={styles.context}>
          {t('quiz.context_prefix')} <Text style={styles.disease}>{diagnosis.diseaseName}</Text>
        </Text>
        <View style={styles.qCard}>
          <Text style={styles.qText}>{question?.text}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder={t('quiz.your_answer')}
          multiline
        />
        <TouchableOpacity style={styles.btn} onPress={check} disabled={!answer.trim()}>
          <Text style={styles.btnText}>{t('quiz.check')}</Text>
        </TouchableOpacity>
        {feedback && <Text style={styles.feedback}>{feedback}</Text>}
        <TouchableOpacity style={styles.btnGhost} onPress={load}>
          <Text style={styles.btnGhostText}>{t('quiz.next')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#757575', fontStyle: 'italic' },
  context: { color: '#558b2f', marginBottom: 8 },
  disease: { fontWeight: '700', color: '#1b5e20' },
  qCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  qText: { fontSize: 17, color: '#212121', lineHeight: 24 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  btn: { backgroundColor: '#1b5e20', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: { padding: 12, alignItems: 'center' },
  btnGhostText: { color: '#1b5e20' },
  feedback: { textAlign: 'center', marginTop: 10, fontSize: 16, color: '#1b5e20' },
});
