import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getDailyWords, Word } from '@/data/lessons';

interface WordCardProps {
  word: Word;
  isLearned: boolean;
  onLearn: () => void;
}

function WordCard({ word, isLearned, onLearn }: WordCardProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(async () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(word.word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking, word.word]);

  return (
    <View style={[styles.wordCard, isLearned && styles.wordCardLearned]}>
      {/* Cabecera de la tarjeta */}
      <View style={styles.wordHeader}>
        <View style={styles.wordMain}>
          <Text style={styles.wordEnglish}>{word.word}</Text>
          <Text style={styles.wordPronunciation}>{word.pronunciation}</Text>
        </View>
        <TouchableOpacity
          style={[styles.speakBtn, speaking && styles.speakBtnActive]}
          onPress={handleSpeak}
        >
          <Text style={styles.speakBtnText}>{speaking ? '⏹' : '🔊'}</Text>
        </TouchableOpacity>
      </View>

      {/* Traducción */}
      <Text style={styles.wordTranslation}>{word.translation}</Text>

      {/* Ejemplo */}
      <View style={styles.exampleBox}>
        <Text style={styles.exampleEn}>"{word.example}"</Text>
        <Text style={styles.exampleEs}>{word.exampleEs}</Text>
      </View>

      {/* Botón marcar */}
      <TouchableOpacity
        style={[styles.learnBtn, isLearned && styles.learnBtnDone]}
        onPress={onLearn}
        disabled={isLearned}
      >
        <Text style={styles.learnBtnText}>
          {isLearned ? '✅ Aprendida' : 'Marcar como aprendida'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DailyScreen() {
  const insets = useSafeAreaInsets();
  const { daily, markWordLearned, finishDaily, resetDailyIfNeeded } = useGame();
  const [words] = useState<Word[]>(() => getDailyWords());

  useEffect(() => {
    resetDailyIfNeeded();
  }, []);

  const learnedCount = Object.values(daily.learnedWords).filter(Boolean).length;
  const progressPct = Math.round((learnedCount / 30) * 100);
  const allLearned = learnedCount >= 30;

  const handleLearn = useCallback(async (word: string) => {
    await markWordLearned(word);
  }, [markWordLearned]);

  const handleComplete = useCallback(async () => {
    if (!allLearned) {
      Alert.alert('Faltan palabras', `Aún te faltan ${30 - learnedCount} palabras por marcar como aprendidas.`);
      return;
    }
    if (daily.dailyCompleted) {
      Alert.alert('¡Ya completaste la tarea de hoy!', 'Vuelve mañana para nuevas palabras.');
      return;
    }
    await finishDaily();
    Alert.alert('🎉 ¡Tarea Completada!', '¡Ganaste +10 💎, +20 XP y +1 racha!\n\nVuelve mañana para nuevas palabras.');
  }, [allLearned, learnedCount, daily.dailyCompleted, finishDaily]);

  const renderItem = useCallback(({ item }: { item: Word }) => (
    <WordCard
      word={item}
      isLearned={!!daily.learnedWords[item.word]}
      onLearn={() => handleLearn(item.word)}
    />
  ), [daily.learnedWords, handleLearn]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📅 Tarea Diaria</Text>
          <Text style={styles.headerSub}>Aprende 30 palabras nuevas hoy</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 Racha</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progreso de hoy</Text>
          <Text style={styles.progressCount}>{learnedCount}/30 palabras</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
        </View>
        {daily.dailyCompleted && (
          <Text style={styles.completedLabel}>✅ ¡Tarea completada hoy!</Text>
        )}
      </View>

      {/* Lista de palabras */}
      <FlatList
        data={words}
        keyExtractor={(item) => item.word}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Botón completar */}
      {!daily.dailyCompleted && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.completeBtn, !allLearned && styles.completeBtnDisabled]}
            onPress={handleComplete}
          >
            <Text style={styles.completeBtnText}>
              {allLearned ? '🎉 Completar Tarea Diaria (+10 💎)' : `Faltan ${30 - learnedCount} palabras`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  streakBadge: {
    backgroundColor: '#FF960020',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF960040',
  },
  streakText: { color: '#FF9600', fontSize: 13, fontWeight: '700' },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  progressCount: { fontSize: 13, color: '#1CB0F6', fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#2D3148', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#1CB0F6', borderRadius: 4 },
  completedLabel: { color: '#58CC02', fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  list: { padding: 12, paddingBottom: 20 },
  wordCard: {
    backgroundColor: '#1A1D27',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D3148',
  },
  wordCardLearned: { borderColor: '#58CC0240', backgroundColor: '#1A2A1A' },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  wordMain: { flex: 1 },
  wordEnglish: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  wordPronunciation: { fontSize: 13, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' },
  speakBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1CB0F620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1CB0F640',
  },
  speakBtnActive: { backgroundColor: '#1CB0F640', borderColor: '#1CB0F6' },
  speakBtnText: { fontSize: 20 },
  wordTranslation: { fontSize: 18, fontWeight: '700', color: '#1CB0F6', marginBottom: 12 },
  exampleBox: {
    backgroundColor: '#0F1117',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8E5AF5',
  },
  exampleEn: { fontSize: 14, color: '#FFFFFF', fontStyle: 'italic', marginBottom: 4, lineHeight: 20 },
  exampleEs: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },
  learnBtn: {
    backgroundColor: '#58CC0220',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#58CC0240',
  },
  learnBtnDone: { backgroundColor: '#1A3A1A', borderColor: '#58CC02' },
  learnBtnText: { color: '#58CC02', fontSize: 14, fontWeight: '700' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D3148',
    backgroundColor: '#0F1117',
  },
  completeBtn: {
    backgroundColor: '#58CC02',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  completeBtnDisabled: { backgroundColor: '#2D3148' },
  completeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
