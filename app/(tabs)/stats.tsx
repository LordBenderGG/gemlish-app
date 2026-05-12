import React, { useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
} from 'react-native';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { LESSONS } from '@/data/lessons';
import { router } from 'expo-router';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface HardWord {
  word: string;
  translation: string;
  pronunciation?: string;
  failCount: number;
}

// ─── Función auxiliar ─────────────────────────────────────────────────────────

function findWordTranslation(word: string): { translation: string; pronunciation?: string } {
  for (const lesson of LESSONS) {
    const found = lesson.words.find(w => w.word.toLowerCase() === word.toLowerCase());
    if (found) return { translation: found.translation, pronunciation: found.pronunciation };
  }
  return { translation: 'No encontrado', pronunciation: undefined };
}

// ─── Sección Palabras Difíciles ────────────────────────────────────────────────

function HardWordsSection({ levelErrors }: { levelErrors: Record<number, string[]> }) {
  const hardWords = useMemo((): HardWord[] => {
    const counts: Record<string, number> = {};
    Object.values(levelErrors).forEach(words => {
      words.forEach(word => {
        const key = word.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, failCount]) => {
        const { translation, pronunciation } = findWordTranslation(word);
        return {
          word: word.charAt(0).toUpperCase() + word.slice(1),
          translation,
          pronunciation,
          failCount,
        };
      });
  }, [levelErrors]);

  const handlePractice = useCallback(() => {
    router.push('/practice/hard-words' as any);
  }, []);

  if (hardWords.length === 0) {
    return (
      <View style={styles.hardWordsSection}>
        <Text style={styles.sectionTitle}>🎯 Palabras Difíciles</Text>
        <View style={styles.hardWordsEmpty}>
          <Text style={styles.hardWordsEmptyEmoji}>🌟</Text>
          <Text style={styles.hardWordsEmptyText}>¡Sin errores registrados!</Text>
          <Text style={styles.hardWordsEmptySubtext}>Completa niveles para ver las palabras que más te cuestan.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.hardWordsSection}>
      <View style={styles.hardWordsHeader}>
        <Text style={styles.sectionTitle}>🎯 Palabras Difíciles</Text>
        <Text style={styles.hardWordsSubtitle}>Top 5 más falladas</Text>
      </View>

      <View style={styles.hardWordsList}>
        {hardWords.map((item, idx) => (
          <View key={item.word} style={styles.hardWordRow}>
            <View style={[
              styles.hardWordRank,
              idx === 0 && styles.hardWordRank1,
              idx === 1 && styles.hardWordRank2,
              idx === 2 && styles.hardWordRank3,
            ]}>
              <Text style={styles.hardWordRankText}>{idx + 1}</Text>
            </View>

            <View style={styles.hardWordInfo}>
              <View style={styles.hardWordNameRow}>
                <Text style={styles.hardWordEn}>{item.word}</Text>
                {item.pronunciation ? (
                  <Text style={styles.hardWordPhonetic}>{item.pronunciation}</Text>
                ) : null}
              </View>
              <Text style={styles.hardWordEs}>{item.translation}</Text>
            </View>
            <View style={styles.hardWordFails}>
              <Text style={styles.hardWordFailCount}>{item.failCount}</Text>
              <Text style={styles.hardWordFailLabel}>{item.failCount === 1 ? 'error' : 'errores'}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.practiceBtn} onPress={handlePractice} activeOpacity={0.8}>
        <Text style={styles.practiceBtnText}>📚 Practicar palabras difíciles</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { game, daily } = useGame();

  const stats = useMemo(() => {
    const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
    const totalWordsLearned = Object.keys(daily.allLearnedWords ?? {}).length;
    return {
      levelsCompleted,
      streak: game.streak,
      totalWordsLearned,
      gems: game.gems,
      xp: game.xp,
      totalDaysCompleted: daily.totalDaysCompleted,
    };
  }, [game, daily]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>📊 Estadísticas</Text>

        {/* Nivel de inglés estimado A1-B2 */}
        <View style={styles.englishLevelCard}>
          <Text style={styles.englishLevelTitle}>Nivel de Inglés Estimado</Text>
          {(() => {
            const lvls = stats.levelsCompleted;
            let cefr = 'A1', cefrColor = '#64748B', cefrDesc = 'Principiante absoluto', cefrPct = 0;
            if (lvls >= 400) { cefr = 'B2'; cefrColor = '#38BDF8'; cefrDesc = 'Independiente avanzado'; cefrPct = 95; }
            else if (lvls >= 250) { cefr = 'B1'; cefrColor = '#38BDF8'; cefrDesc = 'Independiente intermedio'; cefrPct = 70; }
            else if (lvls >= 100) { cefr = 'A2'; cefrColor = '#4ADE80'; cefrDesc = 'Usuario básico'; cefrPct = 40; }
            else if (lvls >= 10) { cefr = 'A1+'; cefrColor = '#FBBF24'; cefrDesc = 'Principiante avanzado'; cefrPct = 15; }
            else { cefrPct = Math.round((lvls / 10) * 15); }
            return (
              <View>
                <View style={styles.englishLevelRow}>
                  <View style={[styles.englishLevelBadge, { backgroundColor: cefrColor + '22', borderColor: cefrColor }]}>
                    <Text style={[styles.englishLevelBadgeText, { color: cefrColor }]}>{cefr}</Text>
                  </View>
                  <View style={styles.englishLevelInfo}>
                    <Text style={styles.englishLevelName}>{cefrDesc}</Text>
                    <Text style={styles.englishLevelSub}>{lvls} niveles completados</Text>
                  </View>
                </View>
                <View style={styles.englishLevelBarBg}>
                  <View style={[styles.englishLevelBarFill, { width: `${cefrPct}%` as any, backgroundColor: cefrColor }]} />
                </View>
                <View style={styles.englishLevelScale}>
                  {['A1', 'A2', 'B1', 'B2'].map(l => (
                    <Text key={l} style={[styles.englishLevelScaleLabel, l === cefr.replace('+','') && { color: cefrColor, fontWeight: '700' }]}>{l}</Text>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>

        {/* Estadísticas - Grid con ancho y alto fijo */}
        <View>
          <Text style={styles.sectionTitle}>📊 Resumen</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Niveles', value: stats.levelsCompleted, emoji: '🎯', color: '#38BDF8' },
              { label: 'Racha', value: `${stats.streak} días`, emoji: '🔥', color: '#FBBF24' },
              { label: 'Palabras', value: stats.totalWordsLearned, emoji: '📖', color: '#4ADE80' },
              { label: 'Diamantes', value: stats.gems, emoji: '💎', color: '#38BDF8' },
              { label: 'XP Total', value: stats.xp.toLocaleString(), emoji: '⭐', color: '#38BDF8' },
              { label: 'Días Tarea', value: stats.totalDaysCompleted, emoji: '📅', color: '#EF4444' },
              { label: 'Desafíos', value: game.dailyChallengesCompleted ?? 0, emoji: '🏆', color: '#F59E0B' },
            ].map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mapa de calor de actividad */}
        {(() => {
          const today = new Date();
          const days: { date: string; active: boolean }[] = [];
          const completedDates = game.levelCompletedDates ?? {};
          const todayStr = today.toISOString().split('T')[0];
          for (let i = 89; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const hasLevelActivity = (completedDates[key] ?? 0) > 0;
            const hasDailyToday = key === todayStr && daily.dailyCompleted;
            days.push({ date: key, active: hasLevelActivity || hasDailyToday });
          }
          const weeks: typeof days[] = [];
          for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
          return (
            <View style={styles.heatmapContainer}>
              <Text style={styles.sectionTitle}>🗓 Actividad (90 días)</Text>
              <View style={styles.heatmapGrid}>
                {weeks.map((week, wi) => (
                  <View key={wi} style={styles.heatmapWeek}>
                    {week.map((day, di) => (
                      <View
                        key={di}
                        style={[styles.heatmapCell, day.active && styles.heatmapCellActive]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={styles.heatmapLegend}>
                {days.filter(d => d.active).length} días activos de los últimos 90
              </Text>
            </View>
           );
        })()}

        {/* Palabras Difíciles */}
        <HardWordsSection levelErrors={game.levelErrors} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: 16, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  statCard: {
    width: '23%',
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 9, color: '#64748B', fontWeight: '600', textAlign: 'center' },
  englishLevelCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  englishLevelTitle: { fontSize: 11, color: '#64748B', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  englishLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  englishLevelBadge: {
    width: 48, height: 48, borderRadius: 10, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  englishLevelBadgeText: { fontSize: 18, fontWeight: '900' },
  englishLevelInfo: { flex: 1 },
  englishLevelName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 1 },
  englishLevelSub: { fontSize: 11, color: '#64748B' },
  englishLevelBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  englishLevelBarFill: { height: 6, borderRadius: 3 },
  englishLevelScale: { flexDirection: 'row', justifyContent: 'space-between' },
  englishLevelScaleLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  heatmapContainer: { marginVertical: 4 },
  heatmapGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 1, gap: 2 },
  heatmapWeek: { flexDirection: 'column', gap: 2, flex: 1 },
  heatmapCell: {
    aspectRatio: 1, borderRadius: 1,
    backgroundColor: '#E2E8F0',
  },
  heatmapCellActive: { backgroundColor: '#4ADE80' },
  heatmapLegend: { fontSize: 10, color: '#64748B', marginTop: 6, textAlign: 'center' },
  // Hard Words Section
  hardWordsSection: { gap: 10 },
  hardWordsHeader: { marginBottom: 8 },
  hardWordsSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  hardWordsList: { gap: 8 },
  hardWordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  hardWordRank: { width: 32, height: 32, borderRadius: 100, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  hardWordRank1: { backgroundColor: '#FFD700', borderWidth: 2, borderColor: '#FFA500' },
  hardWordRank2: { backgroundColor: '#C0C0C0', borderWidth: 2, borderColor: '#A9A9A9' },
  hardWordRank3: { backgroundColor: '#CD7F32', borderWidth: 2, borderColor: '#8B4513' },
  hardWordRankText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  hardWordInfo: { flex: 1 },
  hardWordNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  hardWordEn: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  hardWordPhonetic: { fontSize: 11, color: '#64748B', fontStyle: 'italic' },
  hardWordEs: { fontSize: 12, color: '#64748B' },
  hardWordFails: { alignItems: 'center' },
  hardWordFailCount: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  hardWordFailLabel: { fontSize: 9, color: '#64748B', marginTop: 1 },
  hardWordsEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  hardWordsEmptyEmoji: { fontSize: 40, marginBottom: 8 },
  hardWordsEmptyText: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  hardWordsEmptySubtext: { fontSize: 12, color: '#64748B', textAlign: 'center', paddingHorizontal: 16 },
  practiceBtn: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#3B82F6', borderRadius: 12, alignItems: 'center', marginTop: 8 },
  practiceBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
