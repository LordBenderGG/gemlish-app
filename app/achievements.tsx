import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Share, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import {
  ACHIEVEMENTS, getAchievementDates,
  type Achievement, type AchievementStats,
} from '@/lib/achievements';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CATEGORY_LABELS: Record<string, string> = {
  all: '🏆 Todos',
  levels: '🎯 Niveles',
  streak: '🔥 Racha',
  words: '📖 Palabras',
  gems: '💎 Gemas',
  game: '⭐ XP',
  practice: '💪 Práctica',
};

const CATEGORIES = ['all', 'levels', 'streak', 'words', 'gems', 'game', 'practice'] as const;

// ─── Tarjeta de logro ─────────────────────────────────────────────────────────

interface AchievementItemProps {
  achievement: Achievement;
  unlocked: boolean;
  date?: string;
  username: string;
}

function AchievementItem({ achievement, unlocked, date, username }: AchievementItemProps) {
  const handleShare = useCallback(async () => {
    if (!unlocked) return;
    try {
      const msg = `🏆 Desbloquee el logro "${achievement.title}" en Gemlish!\n${achievement.emoji} ${achievement.description}\n\n📱 Aprende inglés jugando con Gemlish`;
      await Share.share({ message: msg, title: `Logro: ${achievement.title}` });
    } catch { /* cancelado */ }
  }, [achievement, unlocked]);

  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <View style={[styles.emojiBox, !unlocked && styles.emojiBoxLocked]}>
        <Text style={styles.emoji}>{unlocked ? achievement.emoji : '🔒'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, !unlocked && styles.titleLocked]}>
          {achievement.title}
        </Text>
        <Text style={[styles.desc, !unlocked && styles.descLocked]}>
          {achievement.description}
        </Text>
        {unlocked && date && (
          <Text style={styles.date}>📅 {formatDate(date)}</Text>
        )}
      </View>
      {unlocked && (
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { username, game, daily } = useGame();
  const [dates, setDates] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (username) {
      getAchievementDates(username).then(setDates);
    }
  }, [username]);

  const stats: AchievementStats = useMemo(() => {
    const levelsCompleted = Math.max(0, game.maxUnlockedLevel - 1);
    const totalWordsLearned = Object.values(daily.learnedWords).filter(Boolean).length;
    return {
      levelsCompleted,
      streak: game.streak,
      totalWordsLearned,
      gems: game.gems,
      xp: game.xp,
      totalDaysCompleted: daily.totalDaysCompleted ?? 0,
      practiceSessionsCompleted: 0,
    };
  }, [game, daily]);

  const unlockedIds = useMemo(
    () => new Set(ACHIEVEMENTS.filter(a => a.check(stats)).map(a => a.id)),
    [stats],
  );

  const filtered = useMemo(() => {
    const list = selectedCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter(a => a.category === selectedCategory);
    // Desbloqueados primero, luego bloqueados
    return [...list].sort((a, b) => {
      const ua = unlockedIds.has(a.id) ? 0 : 1;
      const ub = unlockedIds.has(b.id) ? 0 : 1;
      return ua - ub;
    });
  }, [selectedCategory, unlockedIds]);

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).length,
    [unlockedIds],
  );

  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Logros</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Progreso global */}
      <View style={styles.progressBox}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>🏆 {unlockedCount} / {ACHIEVEMENTS.length} logros</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
      </View>

      {/* Filtros de categoría */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategory === item && styles.chipActive]}
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>
                {CATEGORY_LABELS[item]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista de logros */}
      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AchievementItem
            achievement={item}
            unlocked={unlockedIds.has(item.id)}
            date={dates[item.id]}
            username={username ?? ''}
          />
        )}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#151718' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#ECEDEE' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ECEDEE' },

  progressBox: { marginHorizontal: 16, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: '#8B9CC8' },
  progressPct: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  progressTrack: { height: 8, backgroundColor: '#2A2D2E', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },

  filterWrap: { marginBottom: 8 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#2A2D2E', borderWidth: 1, borderColor: '#3A3D3E',
  },
  chipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  chipText: { fontSize: 13, color: '#8B9CC8', fontWeight: '500' },
  chipTextActive: { color: '#F0F4FF', fontWeight: '700' },

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E2022', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2A2D2E',
  },
  cardLocked: { opacity: 0.45 },
  emojiBox: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#2A2D2E',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#38BDF8',
  },
  emojiBoxLocked: { borderColor: '#3A3D3E' },
  emoji: { fontSize: 26 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#ECEDEE', marginBottom: 2 },
  titleLocked: { color: '#687076' },
  desc: { fontSize: 12, color: '#8B9CC8', lineHeight: 16 },
  descLocked: { color: '#4A4D4E' },
  date: { fontSize: 11, color: '#38BDF8', marginTop: 4, fontWeight: '600' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2D2E',
    alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { fontSize: 16 },
});
