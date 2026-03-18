import React, { useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLevelData, getLevelIcon, Word } from '@/data/lessons';
import { useGame } from '@/context/GameContext';
import { useSpeech } from '@/hooks/use-speech';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';

function WordReviewCard({ word, t }: { word: Word; t: ReturnType<typeof useThemeStyles> }) {
  const { speaking, toggle, currentWord } = useSpeech();
  const isThisWordSpeaking = speaking && currentWord === word.word;

  return (
    <View style={[styles.wordCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.wordRow}>
        <View style={styles.wordInfo}>
          <Text style={[styles.wordEn, { color: t.text }]}>{word.word}</Text>
          <Text style={[styles.wordPron, { color: t.muted }]}>{word.pronunciation}</Text>
          <Text style={styles.wordEs}>{word.translation}</Text>
        </View>
        <TouchableOpacity
          style={[styles.speakBtn, isThisWordSpeaking && styles.speakBtnActive]}
          onPress={() => toggle(word.word)}
          activeOpacity={0.7}
        >
          <Text style={styles.speakBtnText}>{isThisWordSpeaking ? '⏹' : '🔊'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.exampleBox, { backgroundColor: '#F8FAFF', borderLeftColor: '#38BDF8' }]}>
        <Text style={[styles.exampleEn, { color: t.text }]}>"{word.example}"</Text>
        <Text style={[styles.exampleEs, { color: t.muted }]}>{word.exampleEs}</Text>
      </View>
    </View>
  );
}

export default function LevelDetailScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const levelNum = parseInt(levelId || '1', 10);
  const { game } = useGame();

  const levelData = useMemo(() => getLevelData(levelNum), [levelNum]);
  const icon = useMemo(() => getLevelIcon(levelNum), [levelNum]);
  const levelProgress = game.levelProgress[levelNum];
  const isCompleted = !!levelProgress?.completed;
  const levelScore = levelProgress?.score;

  // Sistema de estrellas: 1 = <70%, 2 = 70-99%, 3 = 100% perfecto
  const starRating = isCompleted
    ? (levelScore === undefined || levelScore === null) ? 1
      : levelScore >= 100 ? 3
      : levelScore >= 70 ? 2
      : 1
    : 0;

  const handleStartLevel = useCallback((mode?: 'hard' | 'listen') => {
    const params = mode ? `?mode=${mode}` : '';
    router.replace(`/exercise/${levelNum}${params}` as any);
  }, [levelNum]);

  const renderItem = useCallback(({ item }: { item: Word }) => (
    <WordReviewCard word={item} t={t} />
  ), [t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#F8FAFF' }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={[styles.levelBadge, { backgroundColor: levelData.color + '22', borderColor: levelData.color }]}>
          <Text style={[styles.levelBadgeText, { color: levelData.color }]}>{icon} Nivel {levelNum}</Text>
        </View>
      </View>

      {/* Info del nivel */}
      <View style={[styles.levelInfo, { borderBottomColor: levelData.color + '40' }]}>
        <Text style={[styles.levelName, { color: levelData.color }]}>{levelData.name}</Text>
        <View style={styles.levelMeta}>
          <View style={[styles.metaChip, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.metaText, { color: t.muted }]}>📝 {levelData.words.length} palabras</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.metaText, { color: t.muted }]}>⭐ {levelData.xp} XP</Text>
          </View>
          {isCompleted && (
            <View style={[styles.metaChip, styles.metaCompleted]}>
              <Text style={[styles.metaText, { color: '#4ADE80' }]}>✅ Completado</Text>
            </View>
          )}
          {isCompleted && (
            <View style={[styles.metaChip, { backgroundColor: starRating === 3 ? '#78350F' : t.surface, borderColor: starRating === 3 ? '#F59E0B' : t.border }]}>
              <Text style={[styles.metaText, { color: starRating === 3 ? '#F59E0B' : t.muted }]}>
                {starRating === 3 ? '★★★ Perfecto' : starRating === 2 ? '★★☆ Bien' : '★☆☆ Completado'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.levelDesc, { color: t.muted }]}>
          Repasa las palabras de este nivel y practica su pronunciación antes de empezar.
        </Text>
      </View>

      {/* Lista de palabras */}
      <FlatList
        data={levelData.words}
        keyExtractor={(item) => item.word}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: t.text }]}>📚 Palabras del nivel</Text>
        }
      />

      {/* Botón de acción */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8, borderTopColor: t.border, backgroundColor: '#F8FAFF' }]}>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: levelData.color }]}
          onPress={() => handleStartLevel()}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>
            {isCompleted ? '🔄 Repetir nivel' : '▶ Empezar nivel'}
          </Text>
        </TouchableOpacity>
        {isCompleted && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.startBtn, { flex: 1, backgroundColor: '#1CB0F6' }]}
              onPress={() => handleStartLevel('listen')}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>🎧 Solo escucha</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startBtn, { flex: 1, backgroundColor: '#FF4B4B' }]}
              onPress={() => handleStartLevel('hard')}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>🔥 Modo difícil</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backText: { color: '#1CB0F6', fontSize: 15, fontWeight: '600' },
  levelBadge: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 13, fontWeight: '700' },
  levelInfo: {
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  levelName: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  levelMeta: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  metaChip: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1,
  },
  metaCompleted: { borderColor: '#4ADE80', backgroundColor: '#1A3A1A' },
  metaText: { fontSize: 12, fontWeight: '600' },
  levelDesc: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: 16 },
  list: { paddingTop: 16, paddingBottom: 20 },
  wordCard: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    marginHorizontal: 16, borderWidth: 1,
  },
  wordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  wordInfo: { flex: 1 },
  wordEn: { fontSize: 20, fontWeight: '800' },
  wordPron: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  wordEs: { fontSize: 15, fontWeight: '600', color: '#1CB0F6', marginTop: 4 },
  speakBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1CB0F620', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1CB0F640',
  },
  speakBtnActive: { backgroundColor: '#1CB0F640', borderColor: '#1CB0F6' },
  speakBtnText: { fontSize: 20 },
  exampleBox: {
    borderRadius: 8, padding: 10,
    borderLeftWidth: 3,
  },
  exampleEn: { fontSize: 13, fontStyle: 'italic', marginBottom: 3, lineHeight: 18 },
  exampleEs: { fontSize: 12, lineHeight: 17 },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1,
  },
  startBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
