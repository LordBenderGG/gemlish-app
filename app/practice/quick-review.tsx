'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Animated, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useAchievements } from '@/context/AchievementsContext';
import { savePracticeSession } from '@/lib/practice-history';
import { useSpeech } from '@/hooks/use-speech';
import { LESSONS } from '@/data/lessons';
import type { Word } from '@/data/lessons';

// ─── Constantes ───────────────────────────────────────────────────────────────

const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const TOTAL_WORDS = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeAnswer(str: string): string {
  return str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Selecciona 10 palabras mixtas:
 * - 5 de las más falladas (si existen)
 * - 5 de niveles recientes (nuevas)
 */
function selectMixedWords(
  levelErrors: Record<number, string[]>,
  maxUnlockedLevel: number,
): Word[] {
  // Palabras difíciles
  const errorCounts: Record<string, number> = {};
  Object.values(levelErrors).forEach(words => {
    words.forEach(w => {
      const key = w.toLowerCase();
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
  });
  const hardWordKeys = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key]) => key);

  const hardWords: Word[] = [];
  for (const key of hardWordKeys) {
    for (const lesson of LESSONS) {
      const found = lesson.words.find(w => w.word.toLowerCase() === key);
      if (found) { hardWords.push(found); break; }
    }
  }

  // Palabras nuevas de los últimos niveles desbloqueados
  const recentLevelStart = Math.max(1, maxUnlockedLevel - 10);
  const recentWords: Word[] = [];
  for (const lesson of LESSONS) {
    if (lesson.id >= recentLevelStart && lesson.id <= maxUnlockedLevel) {
      recentWords.push(...lesson.words);
    }
  }
  // Mezclar y tomar 5
  for (let i = recentWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [recentWords[i], recentWords[j]] = [recentWords[j], recentWords[i]];
  }
  const newWords = recentWords
    .filter(w => !hardWords.some(h => h.word === w.word))
    .slice(0, TOTAL_WORDS - hardWords.length);

  // Combinar y mezclar
  const combined = [...hardWords, ...newWords];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.slice(0, TOTAL_WORDS);
}

// ─── Tarjeta de pregunta ─────────────────────────────────────────────────────

function QuestionCard({
  word,
  onAnswer,
  questionNumber,
  total,
}: {
  word: Word;
  onAnswer: (correct: boolean) => void;
  questionNumber: number;
  total: number;
}) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { speaking, speak, toggle } = useSpeech();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    // Pronunciar automáticamente
    const timer = setTimeout(() => speak(word.word), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || submitted) return;
    const userAns = normalizeAnswer(input);
    const correct = userAns === normalizeAnswer(word.word);
    setIsCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 900);
  };

  return (
    <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
      <Text style={styles.questionCounter}>{questionNumber} / {total}</Text>

      {/* Pronunciación */}
      <TouchableOpacity
        style={[styles.speakBtn, speaking && styles.speakBtnActive]}
        onPress={() => toggle(word.word)}
        activeOpacity={0.8}
      >
        <Text style={styles.speakBtnEmoji}>{speaking ? '⏹' : '🔊'}</Text>
        <Text style={styles.speakBtnText}>{speaking ? 'Reproduciendo...' : 'Escuchar'}</Text>
      </TouchableOpacity>

      <Text style={styles.questionLabel}>Traduce al inglés:</Text>
      <Text style={styles.questionWord}>{word.translation}</Text>
      {word.pronunciation ? (
        <Text style={styles.questionPhonetic}>{word.pronunciation}</Text>
      ) : null}

      <TextInput
        style={[
          styles.input,
          submitted && (isCorrect ? styles.inputCorrect : styles.inputWrong),
        ]}
        placeholder="Escribe en inglés..."
        placeholderTextColor="#6B7280"
        value={input}
        onChangeText={setInput}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        editable={!submitted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {submitted && (
        <Text style={[styles.feedbackText, { color: isCorrect ? '#58CC02' : '#FF4B4B' }]}>
          {isCorrect ? '✅ ¡Correcto!' : `❌ Era: ${word.word}`}
        </Text>
      )}

      {!submitted && (
        <TouchableOpacity
          style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>Verificar</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function QuickReviewScreen() {
  const insets = useSafeAreaInsets();
  const { username, game } = useGame();
  const { checkAchievements } = useAchievements();

  const words = useMemo(
    () => selectMixedWords(game.levelErrors, game.maxUnlockedLevel),
    [],
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
  const [timedOut, setTimedOut] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  // Temporizador de 5 minutos
  useEffect(() => {
    if (showResult) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          setTimedOut(true);
          setShowResult(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showResult]);

  // Animación de la barra del temporizador
  useEffect(() => {
    Animated.timing(timerAnim, {
      toValue: timeLeft / SESSION_DURATION_MS,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) setCorrect(c => c + 1);
    const next = currentIdx + 1;
    if (next >= words.length) {
      Animated.timing(progressAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
      setShowResult(true);
    } else {
      Animated.timing(progressAnim, { toValue: next / words.length, duration: 400, useNativeDriver: false }).start();
      setCurrentIdx(next);
    }
  }, [currentIdx, words.length, progressAnim]);

  const handleFinish = useCallback(async () => {
    if (username) {
      const totalAnswered = currentIdx + (showResult && !timedOut ? 1 : 0);
      await savePracticeSession(username, {
        wordsCount: words.length,
        correct,
        total: Math.max(totalAnswered, 1),
        durationMs: Date.now() - sessionStartRef.current,
      });
      const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
      await checkAchievements(username, {
        levelsCompleted,
        streak: game.streak,
        totalWordsLearned: 0,
        gems: game.gems,
        xp: game.xp,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 1,
      });
    }
    router.back();
  }, [username, game, words, correct, currentIdx, showResult, timedOut, checkAchievements]);

  const timerColor = timeLeft > 60000 ? '#58CC02' : timeLeft > 30000 ? '#FF9600' : '#FF4B4B';

  // ─── Resultado ───────────────────────────────────────────────────────────

  if (showResult) {
    const accuracy = words.length > 0 ? Math.round((correct / words.length) * 100) : 0;
    const accuracyColor = accuracy >= 80 ? '#58CC02' : accuracy >= 60 ? '#FF9600' : '#FF4B4B';
    const elapsed = Date.now() - sessionStartRef.current;

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>
            {timedOut ? '⏰' : accuracy >= 80 ? '🏆' : accuracy >= 60 ? '💪' : '📚'}
          </Text>
          <Text style={styles.resultTitle}>
            {timedOut ? '¡Tiempo agotado!' : '¡Sesión completada!'}
          </Text>
          <Text style={styles.resultSubtitle}>Repaso rápido de 5 minutos</Text>

          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={[styles.resultStatNum, { color: accuracyColor }]}>{accuracy}%</Text>
              <Text style={styles.resultStatLabel}>Acierto</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={[styles.resultStatNum, { color: '#58CC02' }]}>{correct}/{words.length}</Text>
              <Text style={styles.resultStatLabel}>Correctas</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={[styles.resultStatNum, { color: '#1CB0F6' }]}>
                {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')}
              </Text>
              <Text style={styles.resultStatLabel}>Tiempo</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.finishBtnText}>✓ Volver al mapa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Ejercicio ───────────────────────────────────────────────────────────

  if (words.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>Sin palabras disponibles</Text>
          <Text style={styles.emptySubtitle}>Completa algunos niveles para activar el repaso rápido.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚡ Repaso Rápido</Text>
          <Text style={styles.headerSub}>{TOTAL_WORDS} palabras mixtas</Text>
        </View>
        {/* Temporizador */}
        <View style={[styles.timerBadge, { borderColor: timerColor + '60' }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Barra de tiempo */}
      <View style={styles.timerBarBg}>
        <Animated.View
          style={[
            styles.timerBarFill,
            {
              width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: timerColor,
            },
          ]}
        />
      </View>

      {/* Barra de progreso de palabras */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      {/* Pregunta */}
      <View style={styles.content}>
        <QuestionCard
          key={currentIdx}
          word={words[currentIdx]}
          onAnswer={handleAnswer}
          questionNumber={currentIdx + 1}
          total={words.length}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  backBtn: {
    backgroundColor: '#1A1D27', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#2D3148',
  },
  backBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  timerBadge: {
    backgroundColor: '#1A1D27', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5,
  },
  timerText: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerBarBg: { height: 4, backgroundColor: '#2D3148' },
  timerBarFill: { height: 4, borderRadius: 2 },
  progressBarBg: { height: 3, backgroundColor: '#2D3148' },
  progressBarFill: { height: 3, backgroundColor: '#8E5AF5', borderRadius: 2 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  // Tarjeta de pregunta
  questionCard: {
    backgroundColor: '#1A1D27', borderRadius: 20, padding: 24,
    borderWidth: 1.5, borderColor: '#2D3148', gap: 14,
  },
  questionCounter: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', textAlign: 'center' },
  speakBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1CB0F620', borderRadius: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#1CB0F640',
  },
  speakBtnActive: { backgroundColor: '#1CB0F640', borderColor: '#1CB0F6' },
  speakBtnEmoji: { fontSize: 18 },
  speakBtnText: { fontSize: 14, fontWeight: '700', color: '#1CB0F6' },
  questionLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  questionWord: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 34 },
  questionPhonetic: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },
  input: {
    backgroundColor: '#0F1117', borderRadius: 14, borderWidth: 1.5, borderColor: '#2D3148',
    color: '#FFFFFF', fontSize: 16, fontWeight: '600',
    paddingHorizontal: 16, paddingVertical: 14,
    textAlign: 'center',
  },
  inputCorrect: { borderColor: '#58CC02', backgroundColor: '#58CC0210' },
  inputWrong: { borderColor: '#FF4B4B', backgroundColor: '#FF4B4B10' },
  feedbackText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#8E5AF5', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#2D3148' },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  // Resultado
  resultContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 24, gap: 16,
  },
  resultEmoji: { fontSize: 64 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  resultSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  resultStats: {
    flexDirection: 'row', gap: 16, marginVertical: 8,
  },
  resultStat: {
    alignItems: 'center', backgroundColor: '#1A1D27',
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14,
    borderWidth: 1, borderColor: '#2D3148', minWidth: 80,
  },
  resultStatNum: { fontSize: 22, fontWeight: '800' },
  resultStatLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  finishBtn: {
    backgroundColor: '#8E5AF5', borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 40, alignItems: 'center', marginTop: 8,
  },
  finishBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  // Vacío
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 12,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
