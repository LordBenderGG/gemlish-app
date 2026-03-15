import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  StatusBar, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useSpeech } from '@/hooks/use-speech';
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

export default function ListenModeScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { game } = useGame();
  const { speak } = useSpeech();
  const { playCorrect, playWrong, playLevelComplete } = useFeedbackSounds();

  // Seleccionar 10 palabras de los niveles desbloqueados
  const words = useMemo(() => {
    const maxLevel = Math.max(1, Object.values(game.levelProgress).filter(p => p.completed).length);
    const availableLessons = LESSONS.slice(0, Math.min(maxLevel + 2, LESSONS.length));
    const allWords = availableLessons.flatMap(l => l.words);
    return shuffleArray(allWords).slice(0, TOTAL);
  }, [game.levelProgress]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);

  const word = words[currentIdx];

  const handleSpeak = useCallback(() => {
    if (word) {
      speak(word.word);
      setHasSpoken(true);
    }
  }, [word, speak]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || submitted || !word) return;
    const correct = normalizeAnswer(input) === normalizeAnswer(word.word);
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
        setInput('');
        setSubmitted(false);
        setIsCorrect(false);
        setHasSpoken(false);
      }
    }, 1200);
  }, [input, submitted, word, currentIdx, playCorrect, playWrong, playLevelComplete]);

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
        <Text style={styles.headerTitle}>🎧 Solo Escucha</Text>
        <Text style={styles.counter}>{currentIdx + 1}/{TOTAL}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.instruction}>Escucha la palabra y escríbela en inglés</Text>

          {/* Botón de escucha */}
          <TouchableOpacity
            style={[styles.speakBtn, hasSpoken && styles.speakBtnActive]}
            onPress={handleSpeak}
            activeOpacity={0.8}
          >
            <Text style={styles.speakBtnEmoji}>🔊</Text>
            <Text style={styles.speakBtnText}>{hasSpoken ? 'Escuchar de nuevo' : 'Escuchar palabra'}</Text>
          </TouchableOpacity>

          {/* Input */}
          <TextInput
            style={[
              styles.input,
              submitted && (isCorrect ? styles.inputCorrect : styles.inputWrong),
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe la palabra aquí..."
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            editable={!submitted}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {submitted && (
            <Text style={[styles.feedback, { color: isCorrect ? '#4ADE80' : '#FF4B4B' }]}>
              {isCorrect ? '¡Correcto! ✅' : `La palabra era: "${word?.word}" ❌`}
            </Text>
          )}

          {!submitted && (
            <TouchableOpacity
              style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!input.trim()}
            >
              <Text style={styles.submitBtnText}>Verificar</Text>
            </TouchableOpacity>
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
  counter: { fontSize: 14, color: '#38BDF8', fontWeight: '700' },
  scroll: { padding: 20, flexGrow: 1 },
  card: {
    backgroundColor: '#161B27', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#2A3450',
  },
  instruction: {
    fontSize: 15, color: '#8B9CC8', textAlign: 'center', marginBottom: 24,
  },
  speakBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#1CB0F620', borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 24,
    borderWidth: 2, borderColor: '#1CB0F6',
    marginBottom: 24,
  },
  speakBtnActive: { backgroundColor: '#1CB0F640' },
  speakBtnEmoji: { fontSize: 32 },
  speakBtnText: { fontSize: 16, color: '#1CB0F6', fontWeight: '700' },
  input: {
    backgroundColor: '#0D0F18', borderRadius: 12, padding: 16,
    fontSize: 18, color: '#FFFFFF', borderWidth: 2, borderColor: '#2A3450',
    marginBottom: 16, textAlign: 'center',
  },
  inputCorrect: { borderColor: '#4ADE80', backgroundColor: '#1A3A1A' },
  inputWrong: { borderColor: '#FF4B4B', backgroundColor: '#3A1A1A' },
  feedback: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  submitBtn: {
    backgroundColor: '#38BDF8', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#2A3450' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultEmoji: { fontSize: 72, marginBottom: 16 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  resultScore: { fontSize: 48, fontWeight: '900', color: '#38BDF8', marginBottom: 4 },
  resultPct: { fontSize: 18, color: '#8B9CC8', marginBottom: 32 },
  doneBtn: {
    backgroundColor: '#38BDF8', borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 40,
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
