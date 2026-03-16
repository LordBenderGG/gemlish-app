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
import { useThemeStyles } from '@/hooks/use-theme-styles';

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
  const t = useThemeStyles();
  const handleShare = useCallback(async () => {
    if (!unlocked) return;
    try {
      const msg = `🏆 Desbloquee el logro "${achievement.title}" en Gemlish!\n${achievement.emoji} ${achievement.description}\n\n📱 Aprende inglés jugando con Gemlish`;
      await Share.share({ message: msg, title: `Logro: ${achievement.title}` });
    } catch { /* cancelado */ }
  }, [achievement, unlocked]);

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, !unlocked && styles.cardLocked]}>
      <View style={[styles.emojiBox, !unlocked && { borderColor: t.border, backgroundColor: t.bg }]}>
        <Text style={styles.emoji}>{unlocked ? achievement.emoji : '🔒'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: t.text }, !unlocked && { color: t.muted }]}>
          {achievement.title}
        </Text>
        <Text style={[styles.desc, !unlocked && { color: t.muted }]}>
          {achievement.description}
        </Text>
        {unlocked && date && (
          <Text style={styles.date}>📅 {formatDate(date)}</Text>
        )}
      </View>
      {unlocked && (
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: t.bg }]} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
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
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backIcon, { color: t.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.text }]}>Logros</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Progreso global */}
      <View style={styles.progressBox}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>🏆 {unlockedCount} / {ACHIEVEMENTS.length} logros</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: t.border }]}>
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
              style={[styles.chip, { backgroundColor: t.surface, borderColor: t.border }, selectedCategory === item && styles.chipActive]}
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
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#1E293B' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },

  progressBox: { marginHorizontal: 16, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: '#64748B' },
  progressPct: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }, // dynamic in JSX
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },

  filterWrap: { marginBottom: 8 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardLocked: { opacity: 0.5 },
  emojiBox: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#4F46E5',
  },
  emojiBoxLocked: { borderColor: '#CBD5E1', backgroundColor: '#F1F5F9' },
  emoji: { fontSize: 26 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  titleLocked: { color: '#94A3B8' },
  desc: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  descLocked: { color: '#94A3B8' },
  date: { fontSize: 11, color: '#4F46E5', marginTop: 4, fontWeight: '600' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { fontSize: 16 },
});
