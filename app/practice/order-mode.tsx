import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { LESSONS } from '@/data/lessons';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useFeedbackSounds } from '@/hooks/use-feedback-sounds';
import { AdBanner } from '@/components/AdBanner';

const TOTAL = 10;

function normalizeAnswer(str: string): string {
  return str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '');
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Plantillas de oraciones simples por nivel de dificultad
function buildSentence(word: string, translation: string, levelIdx: number): { sentence: string; sentenceEs: string } {
  const templates = [
    { en: `I see a ${word}.`, es: `Veo un/a ${translation}.` },
    { en: `This is ${word}.`, es: `Esto es ${translation}.` },
    { en: `I like ${word}.`, es: `Me gusta ${translation}.` },
    { en: `I have a ${word}.`, es: `Tengo un/a ${translation}.` },
    { en: `The ${word} is here.`, es: `El/La ${translation} está aquí.` },
  ];
  const t = templates[levelIdx % templates.length];
  return { sentence: t.en, sentenceEs: t.es };
}

export default function OrderModeScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { game } = useGame();
  const { playCorrect, playWrong, playLevelComplete } = useFeedbackSounds();

  const exercises = useMemo(() => {
    const maxLevel = Math.max(1, Object.values(game.levelProgress).filter(p => p.completed).length);
    const availableLessons = LESSONS.slice(0, Math.min(maxLevel + 2, LESSONS.length));
    const allWords = availableLessons.flatMap(l => l.words);
    const selected = shuffleArray(allWords).slice(0, TOTAL);
    return selected.map((w, i) => {
      const { sentence, sentenceEs } = buildSentence(w.word, w.translation, i);
      return {
        sentence,
        sentenceEs,
        shuffledWords: shuffleArray(sentence.replace(/[.,!?]/g, '').split(' ')),
      };
    });
  }, [game.levelProgress]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>(exercises[0]?.shuffledWords ?? []);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const ex = exercises[currentIdx];

  const handleSelectWord = (word: string, idx: number) => {
    if (submitted) return;
    const newAvail = [...availableWords];
    newAvail.splice(idx, 1);
    setAvailableWords(newAvail);
    setSelectedWords(prev => [...prev, word]);
  };

  const handleRemoveWord = (word: string, idx: number) => {
    if (submitted) return;
    const newSel = [...selectedWords];
    newSel.splice(idx, 1);
    setSelectedWords(newSel);
    setAvailableWords(prev => [...prev, word]);
  };

  const handleReset = () => {
    if (submitted) return;
    setAvailableWords(ex.shuffledWords);
    setSelectedWords([]);
  };

  const handleVerify = useCallback(() => {
    if (selectedWords.length === 0 || submitted) return;
    const userSentence = normalizeAnswer(selectedWords.join(' '));
    const correctSentence = normalizeAnswer(ex.sentence);
    const correct = userSentence === correctSentence;
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) {
      playCorrect();
      setScore(s => s + 1);
    } else {
      playWrong();
    }
    setTimeout(() => {
      const next = currentIdx + 1;
      if (next >= TOTAL) {
        playLevelComplete();
        setShowResult(true);
      } else {
        setCurrentIdx(next);
        setAvailableWords(exercises[next].shuffledWords);
        setSelectedWords([]);
        setSubmitted(false);
        setIsCorrect(false);
      }
    }, 1400);
  }, [selectedWords, submitted, ex, currentIdx, exercises, playCorrect, playWrong, playLevelComplete]);

  if (showResult) {
    const pct = Math.round((score / TOTAL) * 100);
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0E1117' }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</Text>
          <Text style={styles.resultTitle}>¡Sesión completada!</Text>
          <Text style={styles.resultScore}>{score}/{TOTAL} correctas</Text>
          <Text style={styles.resultPct}>{pct}% de acierto</Text>
          <AdBanner style={{ marginVertical: 16 }} />
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0E1117' }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Solo Ordenar</Text>
        <Text style={styles.counter}>{currentIdx + 1}/{TOTAL}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.instruction}>📝 Ordena la oración:</Text>

          {/* Traducción */}
          <View style={styles.translationBox}>
            <Text style={styles.translationText}>🇪🇸 {ex.sentenceEs}</Text>
          </View>

          {/* Área de construcción */}
          <View style={styles.builderArea}>
            {selectedWords.length === 0 ? (
              <Text style={styles.placeholder}>Toca las palabras para ordenarlas aquí...</Text>
            ) : (
              <View style={styles.wordRow}>
                {selectedWords.map((word, idx) => (
                  <TouchableOpacity
                    key={`sel-${idx}-${word}`}
                    style={[
                      styles.chip, styles.chipSelected,
                      submitted && (isCorrect ? styles.chipCorrect : styles.chipWrong),
                    ]}
                    onPress={() => handleRemoveWord(word, idx)}
                    disabled={submitted}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      submitted && (isCorrect ? { color: '#4ADE80' } : { color: '#FF4B4B' }),
                    ]}>{word}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Palabras disponibles */}
          <View style={styles.wordRow}>
            {availableWords.map((word, idx) => (
              <TouchableOpacity
                key={`avail-${idx}-${word}`}
                style={styles.chip}
                onPress={() => handleSelectWord(word, idx)}
                disabled={submitted}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {submitted && (
            <Text style={[styles.feedback, { color: isCorrect ? '#4ADE80' : '#FF4B4B', marginTop: 16 }]}>
              {isCorrect ? '¡Correcto! ✅' : `Oración correcta: "${ex.sentence}" ❌`}
            </Text>
          )}

          {!submitted && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <Text style={styles.resetBtnText}>↺ Reiniciar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, selectedWords.length === 0 && styles.submitBtnDisabled]}
                onPress={handleVerify}
                disabled={selectedWords.length === 0}
              >
                <Text style={styles.submitBtnText}>Verificar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2A3450',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#161B27', justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { color: '#8B9CC8', fontSize: 16, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  counter: { fontSize: 14, color: '#FF9500', fontWeight: '700' },
  scroll: { padding: 20, flexGrow: 1 },
  card: {
    backgroundColor: '#161B27', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#2A3450',
  },
  instruction: { fontSize: 16, color: '#8B9CC8', marginBottom: 12 },
  translationBox: {
    backgroundColor: '#0D0F18', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#FF9500',
  },
  translationText: { fontSize: 13, color: '#FFB347', fontStyle: 'italic' },
  builderArea: {
    minHeight: 80, backgroundColor: '#0D0F18', borderRadius: 12,
    padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A3450',
    justifyContent: 'center',
  },
  placeholder: { color: '#3D4F6E', fontSize: 14, textAlign: 'center' },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#2A3450', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: '#3D4168',
  },
  chipSelected: { backgroundColor: '#3D2A6A', borderColor: '#38BDF8' },
  chipCorrect: { borderColor: '#4ADE80', backgroundColor: '#1A3A1A' },
  chipWrong: { borderColor: '#FF4B4B', backgroundColor: '#3A1A1A' },
  chipText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#2A3450', marginVertical: 14 },
  feedback: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resetBtn: {
    backgroundColor: '#161B27', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#2A3450',
  },
  resetBtnText: { color: '#8B9CC8', fontSize: 14, fontWeight: '600' },
  submitBtn: {
    flex: 1, backgroundColor: '#FF9500', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#2A3450' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  resultScore: { fontSize: 48, fontWeight: '900', color: '#FF9500', marginBottom: 4 },
  resultPct: { fontSize: 18, color: '#8B9CC8', marginBottom: 32 },
  doneBtn: {
    backgroundColor: '#FF9500', borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 40,
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
