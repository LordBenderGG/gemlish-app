'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Animated, StatusBar, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useAchievements } from '@/context/AchievementsContext';
import { savePracticeSession } from '@/lib/practice-history';
import { useSpeech } from '@/hooks/use-speech';
import { useFeedbackSounds } from '@/hooks/use-feedback-sounds';
import { LESSONS } from '@/data/lessons';
import type { Word } from '@/data/lessons';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Algoritmo de Repetición Espaciada ───────────────────────────────────────
//
// Cada palabra tiene un peso proporcional a su número de errores.
// Se construye una lista ponderada: si "cat" falló 3 veces y "dog" 1 vez,
// la lista es [cat, cat, cat, dog]. Se mezcla y se recorre en orden.
// Al terminar la ronda, se regenera la lista (las que siguen fallando
// aparecen más veces en la siguiente ronda).

interface PracticeWord {
  word: Word;
  failCount: number;         // errores históricos
  sessionFails: number;      // errores en esta sesión
  sessionCorrect: number;    // aciertos en esta sesión
}

function buildWeightedQueue(words: PracticeWord[]): PracticeWord[] {
  const queue: PracticeWord[] = [];
  for (const pw of words) {
    // Peso = errores históricos + errores de sesión + 1 (mínimo 1)
    const weight = pw.failCount + pw.sessionFails + 1;
    for (let i = 0; i < weight; i++) {
      queue.push(pw);
    }
  }
  // Mezclar
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  // Limitar a máximo 15 por ronda para no agotar al usuario
  return queue.slice(0, 15);
}

function findWord(wordEn: string): Word | null {
  for (const lesson of LESSONS) {
    const found = lesson.words.find(w => w.word.toLowerCase() === wordEn.toLowerCase());
    if (found) return found;
  }
  return null;
}

function normalizeAnswer(str: string): string {
  return str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─── Tarjeta de pregunta ─────────────────────────────────────────────────────

type QuestionType = 'translate-to-en' | 'translate-to-es' | 'listen-write';

function getQuestionType(idx: number): QuestionType {
  const types: QuestionType[] = ['translate-to-en', 'translate-to-es', 'listen-write'];
  return types[idx % types.length];
}

interface QuestionCardProps {
  pw: PracticeWord;
  questionType: QuestionType;
  onAnswer: (correct: boolean) => void;
  questionNumber: number;
  total: number;
}

function QuestionCard({ pw, questionType, onAnswer, questionNumber, total }: QuestionCardProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { speaking, speak, toggle } = useSpeech();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [pw.word.word, questionType]);

  useEffect(() => {
    if (questionType === 'listen-write') {
      const t = setTimeout(() => speak(pw.word.word), 500);
      return () => clearTimeout(t);
    }
  }, [pw.word.word, questionType]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || submitted) return;
    let correct = false;
    if (questionType === 'translate-to-en') {
      correct = normalizeAnswer(input) === normalizeAnswer(pw.word.word);
    } else if (questionType === 'translate-to-es') {
      correct = normalizeAnswer(input) === normalizeAnswer(pw.word.translation);
    } else {
      correct = normalizeAnswer(input) === normalizeAnswer(pw.word.word);
    }
    setIsCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1200);
  }, [input, submitted, questionType, pw.word, onAnswer]);

  const question = useMemo(() => {
    if (questionType === 'translate-to-en') {
      return { label: '🇬🇧 Escribe en inglés:', prompt: pw.word.translation };
    } else if (questionType === 'translate-to-es') {
      return { label: '🇪🇸 Escribe en español:', prompt: pw.word.word };
    } else {
      return { label: '🎧 Escucha y escribe en inglés:', prompt: null };
    }
  }, [questionType, pw.word]);

  const failBadgeColor = pw.failCount >= 5 ? '#FF4B4B' : pw.failCount >= 3 ? '#FF9600' : '#38BDF8';

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Progreso */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{questionNumber} / {total}</Text>
        <View style={[styles.failBadge, { backgroundColor: failBadgeColor + '20', borderColor: failBadgeColor }]}>
          <Text style={[styles.failBadgeText, { color: failBadgeColor }]}>
            {pw.failCount} {pw.failCount === 1 ? 'error previo' : 'errores previos'}
          </Text>
        </View>
      </View>

      {/* Pregunta */}
      <Text style={styles.questionLabel}>{question.label}</Text>

      {question.prompt && (
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>{question.prompt}</Text>
          {pw.word.pronunciation && questionType === 'translate-to-es' && (
            <Text style={styles.promptPhonetic}>{pw.word.pronunciation}</Text>
          )}
        </View>
      )}

      {questionType === 'listen-write' && (
        <TouchableOpacity
          style={[styles.listenBtn, speaking && styles.listenBtnActive]}
          onPress={() => toggle(pw.word.word)}
          activeOpacity={0.8}
        >
          <Text style={styles.listenBtnEmoji}>{speaking ? '⏹' : '🔊'}</Text>
          <Text style={styles.listenBtnText}>
            {speaking ? 'Reproduciendo...' : 'Escuchar de nuevo'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Input */}
      <TextInput
        style={[
          styles.input,
          submitted && (isCorrect ? styles.inputCorrect : styles.inputWrong),
        ]}
        placeholder="Escribe tu respuesta..."
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

      {/* Feedback */}
      {submitted && (
        <View style={[styles.feedbackBox, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={[styles.feedbackText, { color: isCorrect ? '#58CC02' : '#FF4B4B' }]}>
            {isCorrect ? '✅ ¡Correcto!' : `❌ Era: "${questionType === 'translate-to-es' ? pw.word.translation : pw.word.word}"`}
          </Text>
          {!isCorrect && pw.word.example && (
            <Text style={styles.feedbackExample}>"{pw.word.example}" — {pw.word.exampleEs}</Text>
          )}
        </View>
      )}

      {/* Botón verificar */}
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

// ─── Pantalla de Resultado de Ronda ─────────────────────────────────────────

function RoundResult({
  words,
  onContinue,
  onFinish,
  round,
}: {
  words: PracticeWord[];
  onContinue: () => void;
  onFinish: () => void;
  round: number;
}) {
  const mastered = words.filter(w => w.sessionCorrect > 0 && w.sessionFails === 0);
  const stillHard = words.filter(w => w.sessionFails > 0);

  return (
    <View style={styles.resultContainer}>
      <Text style={styles.resultEmoji}>{mastered.length === words.length ? '🏆' : '💪'}</Text>
      <Text style={styles.resultTitle}>Ronda {round} completada</Text>

      <View style={styles.resultStats}>
        <View style={[styles.resultStat, { borderColor: '#58CC0240' }]}>
          <Text style={styles.resultStatValue}>{mastered.length}</Text>
          <Text style={[styles.resultStatLabel, { color: '#58CC02' }]}>Dominadas</Text>
        </View>
        <View style={[styles.resultStat, { borderColor: '#FF4B4B40' }]}>
          <Text style={styles.resultStatValue}>{stillHard.length}</Text>
          <Text style={[styles.resultStatLabel, { color: '#FF4B4B' }]}>Pendientes</Text>
        </View>
      </View>

      {stillHard.length > 0 && (
        <View style={styles.hardListBox}>
          <Text style={styles.hardListTitle}>Palabras que necesitan más práctica:</Text>
          {stillHard.map(pw => (
            <View key={pw.word.word} style={styles.hardListItem}>
              <Text style={styles.hardListEn}>{pw.word.word}</Text>
              <Text style={styles.hardListEs}>{pw.word.translation}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.resultBtns}>
        {stillHard.length > 0 && (
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>🔄 Practicar pendientes</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.finishBtn} onPress={onFinish} activeOpacity={0.85}>
          <Text style={styles.finishBtnText}>✓ Terminar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function HardWordsPracticeScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { username, game } = useGame();
  const { checkAchievements } = useAchievements();
  const sessionStartRef = useRef(Date.now());

  // Construir lista de palabras difíciles con sus conteos
  const practiceWords = useMemo((): PracticeWord[] => {
    const counts: Record<string, number> = {};
    Object.values(game.levelErrors).forEach(words => {
      words.forEach(w => {
        const key = w.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20) // máximo 20 palabras difíciles
      .map(([wordKey, failCount]) => {
        const wordData = findWord(wordKey);
        if (!wordData) return null;
        return { word: wordData, failCount, sessionFails: 0, sessionCorrect: 0 };
      })
      .filter(Boolean) as PracticeWord[];
  }, [game.levelErrors]);

  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState<PracticeWord[]>(() => buildWeightedQueue(practiceWords));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback((to: number) => {
    Animated.timing(progressAnim, {
      toValue: to,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const { playCorrect, playWrong, playLevelComplete } = useFeedbackSounds();

  const handleAnswer = useCallback((correct: boolean) => {
    const current = queue[currentIdx];
    // Reproducir sonido de feedback
    if (correct) {
      playCorrect();
    } else {
      playWrong();
    }
    // Actualizar contadores de sesión
    if (correct) {
      current.sessionCorrect += 1;
    } else {
      current.sessionFails += 1;
    }

    const next = currentIdx + 1;
    if (next >= queue.length) {
      animateProgress(1);
      setShowResult(true);
      playLevelComplete();
    } else {
      animateProgress(next / queue.length);
      setCurrentIdx(next);
    }
  }, [queue, currentIdx, animateProgress, playCorrect, playWrong, playLevelComplete]);

  const handleContinue = useCallback(() => {
    // Construir nueva ronda solo con las palabras que siguen fallando
    const stillHard = practiceWords.map(pw => {
      const inQueue = queue.find(q => q.word.word === pw.word.word);
      if (inQueue && inQueue.sessionFails > 0) {
        return { ...pw, failCount: pw.failCount + inQueue.sessionFails, sessionFails: 0, sessionCorrect: 0 };
      }
      return null;
    }).filter(Boolean) as PracticeWord[];

    if (stillHard.length === 0) {
      router.back();
      return;
    }

    const newQueue = buildWeightedQueue(stillHard);
    setQueue(newQueue);
    setCurrentIdx(0);
    setRound(r => r + 1);
    setShowResult(false);
    progressAnim.setValue(0);
  }, [practiceWords, queue, progressAnim]);

  const handleFinish = useCallback(async () => {
    // Guardar historial de sesión
    if (username) {
      const totalAnswers = queue.reduce((acc, pw) => acc + pw.sessionCorrect + pw.sessionFails, 0);
      const correctAnswers = queue.reduce((acc, pw) => acc + pw.sessionCorrect, 0);
      const uniqueWords = new Set(queue.map(pw => pw.word.word)).size;
      await savePracticeSession(username, {
        wordsCount: uniqueWords,
        correct: correctAnswers,
        total: Math.max(totalAnswers, 1),
        durationMs: Date.now() - sessionStartRef.current,
      });
      // Verificar logros de práctica
      const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
      await checkAchievements(username, {
        levelsCompleted,
        streak: game.streak,
        totalWordsLearned: 0,
        gems: game.gems,
        xp: game.xp,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 1, // Al menos 1 sesión completada
      });
    }
    router.back();
  }, [username, game, queue, checkAchievements]);

  if (practiceWords.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0D0D18' }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyTitle}>¡Sin palabras difíciles!</Text>
          <Text style={styles.emptySubtitle}>Completa algunos niveles para que aparezcan aquí las palabras que más te cuestan.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0D0D18' }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => {
          Alert.alert('¿Salir?', 'Tu progreso de esta sesión no se guardará.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', onPress: () => router.back() },
          ]);
        }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🎯 Palabras Difíciles</Text>
          <Text style={styles.headerSubtitle}>Ronda {round} · {practiceWords.length} palabras</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Barra de progreso */}
      {!showResult && (
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}

      {/* Contenido */}
      <View style={styles.content}>
        {showResult ? (
          <RoundResult
            words={practiceWords}
            onContinue={handleContinue}
            onFinish={handleFinish}
            round={round}
          />
        ) : (
          <QuestionCard
            pw={queue[currentIdx]}
            questionType={getQuestionType(currentIdx)}
            onAnswer={handleAnswer}
            questionNumber={currentIdx + 1}
            total={queue.length}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2D3148', justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: '#2D3148' },
  progressBarFill: { height: 6, backgroundColor: '#FF4B4B', borderRadius: 3 },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  // Tarjeta de pregunta
  card: {
    backgroundColor: '#111122', borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: '#2D3148', gap: 14,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  failBadge: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  failBadgeText: { fontSize: 11, fontWeight: '700' },
  questionLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  promptBox: {
    backgroundColor: '#0F1117', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D3148',
  },
  promptText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  promptPhonetic: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1CB0F620', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#1CB0F640', gap: 8,
  },
  listenBtnActive: { backgroundColor: '#FF960020', borderColor: '#FF960040' },
  listenBtnEmoji: { fontSize: 20 },
  listenBtnText: { fontSize: 15, color: '#1CB0F6', fontWeight: '700' },
  input: {
    backgroundColor: '#0F1117', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, color: '#FFFFFF', borderWidth: 1.5, borderColor: '#2D3148',
    fontWeight: '600',
  },
  inputCorrect: { borderColor: '#58CC02', backgroundColor: '#58CC0210' },
  inputWrong: { borderColor: '#FF4B4B', backgroundColor: '#FF4B4B10' },
  feedbackBox: {
    borderRadius: 14, padding: 14, borderWidth: 1, gap: 6,
  },
  feedbackCorrect: { backgroundColor: '#58CC0210', borderColor: '#58CC0240' },
  feedbackWrong: { backgroundColor: '#FF4B4B10', borderColor: '#FF4B4B40' },
  feedbackText: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  feedbackExample: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  submitBtn: {
    backgroundColor: '#FF4B4B', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#2D3148' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  // Resultado de ronda
  resultContainer: { alignItems: 'center', gap: 20 },
  resultEmoji: { fontSize: 64 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  resultStats: { flexDirection: 'row', gap: 16 },
  resultStat: {
    flex: 1, backgroundColor: '#111122', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1.5,
  },
  resultStatValue: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  resultStatLabel: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  hardListBox: {
    width: '100%', backgroundColor: '#111122', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FF4B4B30', gap: 8,
  },
  hardListTitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  hardListItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  hardListEn: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  hardListEs: { fontSize: 13, color: '#9CA3AF' },
  resultBtns: { width: '100%', gap: 10 },
  continueBtn: {
    backgroundColor: '#FF4B4B', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  finishBtn: {
    backgroundColor: '#2D3148', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#4B5563',
  },
  finishBtnText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  // Pantalla vacía
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  backBtn: {
    backgroundColor: '#2D3148', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
    marginTop: 8,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
