'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ScrollView, Platform,
} from 'react-native';
import { useRewardedAd, AD_UNIT_IDS } from '@/hooks/useAdMob';
import { AdBanner } from '@/components/AdBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getDailyWords, Word, LESSONS } from '@/data/lessons';
import { useSpeech } from '@/hooks/use-speech';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeedbackSounds } from '@/hooks/use-feedback-sounds';

// ─── SM-2 Repaso Espaciado ────────────────────────────────────────────────────

interface SM2Card {
  word: string;
  easiness: number;   // EF: 1.3 - 2.5
  interval: number;   // días hasta próxima revisión
  repetitions: number;
  nextReview: string; // ISO date
}

const SM2_KEY = (username: string) => `gemlish_sm2_${username}`;

function sm2Update(card: SM2Card, quality: number): SM2Card {
  // quality: 0-5 (0-2 = fail, 3-5 = pass)
  let { easiness, interval, repetitions } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easiness);
    repetitions += 1;
  }
  easiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return { ...card, easiness, interval, repetitions, nextReview: next.toISOString().split('T')[0] };
}

async function loadSM2Cards(username: string): Promise<Record<string, SM2Card>> {
  try {
    const raw = await AsyncStorage.getItem(SM2_KEY(username));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveSM2Cards(username: string, cards: Record<string, SM2Card>): Promise<void> {
  await AsyncStorage.setItem(SM2_KEY(username), JSON.stringify(cards));
}

function getDueWords(cards: Record<string, SM2Card>): string[] {
  const today = new Date().toISOString().split('T')[0];
  return Object.values(cards)
    .filter(c => c.nextReview <= today)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
    .map(c => c.word);
}

// ─── WordCard ─────────────────────────────────────────────────────────────────

interface WordCardProps {
  word: Word;
  isLearned: boolean;
  onLearn: () => void;
}

function WordCard({ word, isLearned, onLearn }: WordCardProps) {
  const { speaking, toggle, currentWord } = useSpeech();
  const isThisWordSpeaking = speaking && currentWord === word.word;

  return (
    <View style={[styles.wordCard, isLearned && styles.wordCardLearned]}>
      <View style={styles.wordHeader}>
        <View style={styles.wordMain}>
          <Text style={styles.wordEnglish}>{word.word}</Text>
          <Text style={styles.wordPronunciation}>{word.pronunciation}</Text>
        </View>
        <TouchableOpacity
          style={[styles.speakBtn, isThisWordSpeaking && styles.speakBtnActive]}
          onPress={() => toggle(word.word)}
          activeOpacity={0.7}
        >
          <Text style={styles.speakBtnText}>{isThisWordSpeaking ? '⏹' : '🔊'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.wordTranslation}>{word.translation}</Text>
      <View style={styles.exampleBox}>
        <Text style={styles.exampleEn}>"{word.example}"</Text>
        <Text style={styles.exampleEs}>{word.exampleEs}</Text>
      </View>
      <TouchableOpacity
        style={[styles.learnBtn, isLearned && styles.learnBtnDone]}
        onPress={onLearn}
        disabled={isLearned}
        activeOpacity={0.8}
      >
        <Text style={styles.learnBtnText}>
          {isLearned ? '✅ Aprendida' : 'Marcar como aprendida'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Mini Quiz ────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizQuestion {
  word: Word;
  options: string[];
  correct: string;
}

function buildQuiz(words: Word[]): QuizQuestion[] {
  const allWords = LESSONS.flatMap(l => l.words);
  return shuffleArray(words).slice(0, 5).map(word => {
    const distractors = shuffleArray(
      allWords.filter(w => w.word !== word.word)
    ).slice(0, 3).map(w => w.translation);
    return {
      word,
      correct: word.translation,
      options: shuffleArray([word.translation, ...distractors]),
    };
  });
}

interface MiniQuizProps {
  words: Word[];
  onComplete: (score: number) => void;
}

function MiniQuiz({ words, onComplete }: MiniQuizProps) {
  const { playCorrect, playWrong } = useFeedbackSounds();
  const questions = useMemo(() => buildQuiz(words), [words]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[idx];

  const handleSelect = useCallback((option: string) => {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === q.correct;
    if (correct) { playCorrect(); setScore(s => s + 1); }
    else playWrong();
    setTimeout(() => {
      const next = idx + 1;
      if (next >= questions.length) {
        onComplete(correct ? score + 1 : score);
      } else {
        setIdx(next);
        setSelected(null);
      }
    }, 1200);
  }, [selected, q, idx, questions.length, score, playCorrect, playWrong, onComplete]);

  return (
    <View style={styles.quizContainer}>
      <Text style={styles.quizTitle}>🧠 Mini Quiz — {idx + 1}/{questions.length}</Text>
      <Text style={styles.quizInstruction}>¿Cómo se traduce?</Text>
      <View style={styles.quizWordBox}>
        <Text style={styles.quizWord}>{q.word.word}</Text>
        <Text style={styles.quizPhonetic}>{q.word.pronunciation}</Text>
      </View>
      <View style={styles.quizOptions}>
        {q.options.map(opt => {
          let bg = '#FFFFFF', border = '#E2E8F0', textColor = '#1E293B';
          if (selected !== null) {
            if (opt === q.correct) { bg = '#F0FDF4'; border = '#4ADE80'; textColor = '#166534'; }
            else if (opt === selected && opt !== q.correct) { bg = '#FEE2E2'; border = '#FF4B4B'; textColor = '#991B1B'; }
          }
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.quizOption, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleSelect(opt)}
              disabled={selected !== null}
              activeOpacity={0.8}
            >
              <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Pantalla Principal ───────────────────────────────────────────────────────

type Phase = 'study' | 'quiz' | 'spaced-review' | 'done';

export default function DailyScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { username, daily, markWordLearned, finishDaily, resetDailyIfNeeded, game } = useGame();
  const [words] = useState<Word[]>(() => getDailyWords());
  const [phase, setPhase] = useState<Phase>('study');
  const { showAd: showDailyRetryAd, loaded: dailyRetryAdLoaded } = useRewardedAd(
    AD_UNIT_IDS.REWARDED_DAILY_RETRY,
    () => {
      // Recompensa: permitir repetir el quiz del día
      setPhase('quiz');
    }
  );
  const [sm2Cards, setSm2Cards] = useState<Record<string, SM2Card>>({});
  const [dueWords, setDueWords] = useState<Word[]>([]);

  useEffect(() => {
    resetDailyIfNeeded();
    if (username) {
      loadSM2Cards(username).then(cards => {
        setSm2Cards(cards);
        const dueKeys = getDueWords(cards);
        const allWords = LESSONS.flatMap(l => l.words);
        const due = dueKeys
          .map(k => allWords.find(w => w.word === k))
          .filter(Boolean) as Word[];
        setDueWords(due.slice(0, 10));
      });
    }
  }, [username]);

  const learnedCount = Object.values(daily.learnedWords).filter(Boolean).length;
  const progressPct = Math.round((learnedCount / 30) * 100);
  const allLearned = learnedCount >= 30;

  const handleLearn = useCallback(async (wordStr: string) => {
    await markWordLearned(wordStr);
    // Inicializar carta SM-2 si es nueva
    if (username && !sm2Cards[wordStr]) {
      const newCard: SM2Card = {
        word: wordStr, easiness: 2.5, interval: 1, repetitions: 0,
        nextReview: new Date().toISOString().split('T')[0],
      };
      const updated = { ...sm2Cards, [wordStr]: newCard };
      setSm2Cards(updated);
      await saveSM2Cards(username, updated);
    }
  }, [markWordLearned, username, sm2Cards]);

  const handleQuizComplete = useCallback(async (score: number) => {
    if (dueWords.length > 0) {
      setPhase('spaced-review');
    } else {
      await finishDaily();
      setPhase('done');
      Alert.alert('🎉 ¡Tarea Completada!', `Quiz: ${score}/5\n\n¡Ganaste +10 💎, +20 XP y +1 racha!`);
    }
  }, [dueWords.length, finishDaily]);

  const handleSpacedReviewAnswer = useCallback(async (word: Word, quality: number) => {
    if (!username) return;
    const card = sm2Cards[word.word] ?? {
      word: word.word, easiness: 2.5, interval: 1, repetitions: 0,
      nextReview: new Date().toISOString().split('T')[0],
    };
    const updated = { ...sm2Cards, [word.word]: sm2Update(card, quality) };
    setSm2Cards(updated);
    await saveSM2Cards(username, updated);
  }, [username, sm2Cards]);

  const renderItem = useCallback(({ item }: { item: Word }) => (
    <WordCard
      word={item}
      isLearned={!!daily.learnedWords[item.word]}
      onLearn={() => handleLearn(item.word)}
    />
  ), [daily.learnedWords, handleLearn]);

  // ─── Fase: Quiz ───────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📅 Tarea Diaria</Text>
          <TouchableOpacity onPress={() => setPhase('study')} activeOpacity={0.7}>
            <Text style={{ color: '#64748B', fontSize: 14 }}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <MiniQuiz words={words} onComplete={handleQuizComplete} />
        </ScrollView>
      </View>
    );
  }

  // ─── Fase: Repaso Espaciado ───────────────────────────────────────────────
  if (phase === 'spaced-review') {
    return (
      <SpacedReviewPhase
        words={dueWords}
        insets={insets}
        t={t}
        onAnswer={handleSpacedReviewAnswer}
        onDone={async () => {
          await finishDaily();
          setPhase('done');
          Alert.alert('🎉 ¡Tarea Completada!', '¡Ganaste +10 💎, +20 XP y +1 racha!');
        }}
      />
    );
  }

  // ─── Fase: Completado ─────────────────────────────────────────────────────
  if (phase === 'done' || daily.dailyCompleted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>¡Tarea de hoy completada!</Text>
          <Text style={styles.doneSub}>Racha actual: 🔥 {game.streak} días</Text>
          <Text style={styles.doneSub2}>Vuelve mañana para nuevas palabras</Text>
          {dueWords.length > 0 && (
            <TouchableOpacity
              style={[styles.completeBtn, { marginTop: 20 }]}
              onPress={() => setPhase('spaced-review')}
            >
              <Text style={styles.completeBtnText}>🔄 Repasar {dueWords.length} palabras pendientes</Text>
            </TouchableOpacity>
          )}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.completeBtn, { marginTop: 12, backgroundColor: '#1E2A3A', borderWidth: 1, borderColor: '#38BDF840' }]}
              onPress={() => { if (!showDailyRetryAd()) setPhase('quiz'); }}
            >
              <Text style={[styles.completeBtnText, { color: '#38BDF8' }]}>
                {dailyRetryAdLoaded ? '🎥 Ver anuncio para repetir quiz' : '🔄 Repetir quiz'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ─── Fase: Estudio ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📅 Tarea Diaria</Text>
          <Text style={styles.headerSub}>Aprende 30 palabras nuevas hoy</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {game.streak} días</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progreso de hoy</Text>
          <Text style={styles.progressCount}>{learnedCount}/30 palabras</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
        </View>
        {dueWords.length > 0 && (
          <Text style={styles.dueLabel}>📚 {dueWords.length} palabras pendientes de repaso</Text>
        )}
      </View>

      {/* Banner AdMob — Tarea Diaria */}
      <AdBanner style={{ marginBottom: 4 }} />

      <FlatList
        data={words}
        keyExtractor={(item) => item.word}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
      />

      {!daily.dailyCompleted && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.completeBtn, !allLearned && styles.completeBtnDisabled]}
            onPress={() => {
              if (!allLearned) {
                Alert.alert('Faltan palabras', `Aún te faltan ${30 - learnedCount} palabras por marcar como aprendidas.`);
                return;
              }
              setPhase('quiz');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.completeBtnText, !allLearned && styles.completeBtnTextDisabled]}>
              {allLearned ? '🧠 Hacer Mini Quiz (5 preguntas)' : `Faltan ${30 - learnedCount} palabras`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Repaso Espaciado ─────────────────────────────────────────────────────────

function SpacedReviewPhase({
  words, insets, t, onAnswer, onDone,
}: {
  words: Word[];
  insets: ReturnType<typeof import('react-native-safe-area-context').useSafeAreaInsets>;
  t: ReturnType<typeof import('@/hooks/use-theme-styles').useThemeStyles>;
  onAnswer: (word: Word, quality: number) => Promise<void>;
  onDone: () => Promise<void>;
}) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (idx >= words.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>¡Repaso completado!</Text>
          <TouchableOpacity style={styles.completeBtn} onPress={onDone}>
            <Text style={styles.completeBtnText}>Finalizar tarea →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const word = words[idx];

  const handleRate = async (quality: number) => {
    await onAnswer(word, quality);
    setIdx(i => i + 1);
    setRevealed(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔄 Repaso Espaciado</Text>
        <Text style={{ color: '#64748B', fontSize: 14 }}>{idx + 1}/{words.length}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.spacedCard}>
          <Text style={styles.spacedWord}>{word.word}</Text>
          <Text style={styles.spacedPhonetic}>{word.pronunciation}</Text>
          {!revealed ? (
            <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(true)}>
              <Text style={styles.revealBtnText}>👁 Mostrar traducción</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.spacedTranslation}>{word.translation}</Text>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleEn}>"{word.example}"</Text>
                <Text style={styles.exampleEs}>{word.exampleEs}</Text>
              </View>
              <Text style={styles.rateLabel}>¿Qué tan bien la sabías?</Text>
              <View style={styles.rateRow}>
                <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#FF4B4B20', borderColor: '#FF4B4B' }]} onPress={() => handleRate(1)}>
                  <Text style={styles.rateBtnEmoji}>😰</Text>
                  <Text style={[styles.rateBtnText, { color: '#FF4B4B' }]}>No la sabía</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]} onPress={() => handleRate(3)}>
                  <Text style={styles.rateBtnEmoji}>🤔</Text>
                  <Text style={[styles.rateBtnText, { color: '#F59E0B' }]}>Más o menos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#58CC0220', borderColor: '#4ADE80' }]} onPress={() => handleRate(5)}>
                  <Text style={styles.rateBtnEmoji}>😄</Text>
                  <Text style={[styles.rateBtnText, { color: '#4ADE80' }]}>¡La sabía!</Text>
                </TouchableOpacity>
              </View>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  streakBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  streakText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },
  progressSection: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  progressCount: { fontSize: 13, color: '#4F46E5', fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#4F46E5', borderRadius: 4 },
  dueLabel: { color: '#F59E0B', fontSize: 12, fontWeight: '600', marginTop: 8 },
  list: { padding: 12, paddingBottom: 20 },
  wordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  wordCardLearned: { borderColor: '#BBF7D0', backgroundColor: '#DCFCE7' },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  wordMain: { flex: 1 },
  wordEnglish: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  wordPronunciation: { fontSize: 13, color: '#64748B', marginTop: 2, fontStyle: 'italic' },
  speakBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#BFDBFE',
  },
  speakBtnActive: { backgroundColor: '#BFDBFE', borderColor: '#4F46E5' },
  speakBtnText: { fontSize: 22 },
  wordTranslation: { fontSize: 18, fontWeight: '700', color: '#4F46E5', marginBottom: 12 },
  exampleBox: {
    backgroundColor: '#F0F9FF', borderRadius: 10, padding: 12, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#BFDBFE',
  },
  exampleEn: { fontSize: 14, color: '#1E293B', fontStyle: 'italic', marginBottom: 4 },
  exampleEs: { fontSize: 12, color: '#64748B' },
  learnBtn: {
    backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE',
  },
  learnBtnDone: { backgroundColor: '#58CC0220', borderColor: '#BBF7D0' },
  learnBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
    backgroundColor: '#F0F9FF',
  },
  completeBtn: {
    backgroundColor: '#4ADE80', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  completeBtnDisabled: { backgroundColor: '#E2E8F0' },
  completeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  completeBtnTextDisabled: { color: '#94A3B8', fontSize: 16, fontWeight: '700' },
  // Done
  doneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  doneSub: { fontSize: 16, color: '#F59E0B', fontWeight: '700', marginBottom: 4 },
  doneSub2: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  // Quiz
  quizContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  quizTitle: { fontSize: 14, color: '#64748B', fontWeight: '700', marginBottom: 4 },
  quizInstruction: { fontSize: 18, color: '#1E293B', fontWeight: '700', marginBottom: 16 },
  quizWordBox: {
    backgroundColor: '#F0F9FF', borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 20,
  },
  quizWord: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  quizPhonetic: { fontSize: 14, color: '#64748B', fontStyle: 'italic' },
  quizOptions: { gap: 10 },
  quizOption: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, alignItems: 'center',
  },
  quizOptionText: { fontSize: 16, fontWeight: '600' },
  // Spaced Review
  spacedCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  spacedWord: { fontSize: 36, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  spacedPhonetic: { fontSize: 14, color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginBottom: 20 },
  spacedTranslation: { fontSize: 24, fontWeight: '800', color: '#4F46E5', textAlign: 'center', marginBottom: 16 },
  revealBtn: {
    backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE',
  },
  revealBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  rateLabel: { fontSize: 14, color: '#64748B', textAlign: 'center', marginVertical: 12 },
  rateRow: { flexDirection: 'row', gap: 8 },
  rateBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1,
  },
  rateBtnEmoji: { fontSize: 24, marginBottom: 4 },
  rateBtnText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
