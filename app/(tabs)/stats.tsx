import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';

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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>📊 Estadísticas</Text>

        {/* Estadísticas */}
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

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', flex: 1, minWidth: 90,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#DBEAFE',
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textAlign: 'center' },
  englishLevelCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  englishLevelTitle: { fontSize: 13, color: '#64748B', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  englishLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  englishLevelBadge: {
    width: 56, height: 56, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  englishLevelBadgeText: { fontSize: 20, fontWeight: '900' },
  englishLevelInfo: { flex: 1 },
  englishLevelName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  englishLevelSub: { fontSize: 12, color: '#64748B' },
  englishLevelBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  englishLevelBarFill: { height: 8, borderRadius: 4 },
  englishLevelScale: { flexDirection: 'row', justifyContent: 'space-between' },
  englishLevelScaleLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  heatmapContainer: { marginVertical: 8 },
  heatmapGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  heatmapWeek: { flexDirection: 'column', gap: 3, flex: 1 },
  heatmapCell: {
    aspectRatio: 1, borderRadius: 2, marginHorizontal: 1.5,
    backgroundColor: '#E2E8F0',
  },
  heatmapCellActive: { backgroundColor: '#4ADE80' },
  heatmapLegend: { fontSize: 11, color: '#64748B', marginTop: 8, textAlign: 'center' },
});
