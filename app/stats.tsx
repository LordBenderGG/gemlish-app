import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useGame } from '@/context/GameContext';
import { getPracticeHistory } from '@/lib/practice-history';
import type { PracticeSession } from '@/lib/practice-history';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return labels[d.getDay()];
}

// ─── Componente de gráfica de barras ─────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue: number;
  height?: number;
  unit?: string;
  isDark: boolean;
}

function BarChart({ data, maxValue, height = 140, unit = '', isDark }: BarChartProps) {
  const chartW = 320;
  const chartH = height;
  const barW = Math.floor((chartW - 16) / data.length) - 6;
  const textColor = isDark ? '#9BA1A6' : '#687076';
  const lineColor = isDark ? '#2D3148' : '#E5E7EB';

  return (
    <Svg width={chartW} height={chartH + 32} viewBox={`0 0 ${chartW} ${chartH + 32}`}>
      {/* Líneas de referencia */}
      {[0, 0.5, 1].map((ratio, i) => (
        <Line
          key={i}
          x1={8}
          y1={chartH - ratio * chartH + 4}
          x2={chartW - 8}
          y2={chartH - ratio * chartH + 4}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray={i === 0 ? undefined : '4,4'}
        />
      ))}
      {/* Barras */}
      {data.map((item, i) => {
        const barH = maxValue > 0 ? Math.max((item.value / maxValue) * (chartH - 8), item.value > 0 ? 4 : 0) : 0;
        const x = 8 + i * (barW + 6);
        const y = chartH - barH + 4;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={item.value > 0 ? item.color : lineColor}
              opacity={item.value > 0 ? 1 : 0.4}
            />
            {item.value > 0 && (
              <SvgText
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fill={item.color}
                fontWeight="700"
              >
                {item.value}{unit}
              </SvgText>
            )}
            <SvgText
              x={x + barW / 2}
              y={chartH + 20}
              textAnchor="middle"
              fontSize={11}
              fill={textColor}
            >
              {item.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Tarjeta de estadística ───────────────────────────────────────────────────

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <View style={[cardStyles.container, { borderColor: color + '40' }]}>
      <Text style={cardStyles.emoji}>{emoji}</Text>
      <Text style={[cardStyles.value, { color }]}>{value}</Text>
      <Text style={cardStyles.label}>{label}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', padding: 14,
    borderRadius: 16, borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  emoji: { fontSize: 24, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
});

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { username, game, daily } = useGame();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    getPracticeHistory(username).then(h => {
      setSessions(h);
      setLoading(false);
    });
  }, [username]);

  const last7Days = useMemo(() => getLast7Days(), []);

  // Niveles completados por día (últimos 7 días) — usa levelCompletedDates registrado en completeLevel
  const levelsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    last7Days.forEach(d => { counts[d] = 0; });
    const dates = game.levelCompletedDates ?? {};
    last7Days.forEach(d => {
      if (dates[d] !== undefined) counts[d] = dates[d];
    });
    return counts;
  }, [last7Days, game.levelCompletedDates]);

  // Sesiones de práctica por día (últimos 7 días)
  const sessionsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    last7Days.forEach(d => { counts[d] = 0; });
    sessions.forEach(s => {
      if (counts[s.date] !== undefined) counts[s.date]++;
    });
    return counts;
  }, [last7Days, sessions]);

  // Tasa de acierto por día (últimos 7 días)
  const accuracyByDay = useMemo(() => {
    const data: Record<string, { correct: number; total: number }> = {};
    last7Days.forEach(d => { data[d] = { correct: 0, total: 0 }; });
    sessions.forEach(s => {
      if (data[s.date]) {
        data[s.date].correct += s.correct;
        data[s.date].total += s.total;
      }
    });
    const result: Record<string, number> = {};
    last7Days.forEach(d => {
      result[d] = data[d].total > 0 ? Math.round((data[d].correct / data[d].total) * 100) : 0;
    });
    return result;
  }, [last7Days, sessions]);

  // Palabras practicadas por día (últimos 7 días)
  const wordsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    last7Days.forEach(d => { counts[d] = 0; });
    sessions.forEach(s => {
      if (counts[s.date] !== undefined) counts[s.date] += s.wordsCount;
    });
    return counts;
  }, [last7Days, sessions]);

  // Estadísticas globales
  const totalLevels = Object.values(game.levelProgress).filter(p => p.completed).length;
  const totalErrors = Object.values(game.levelErrors).reduce((acc, arr) => acc + arr.length, 0);
  const totalSessions = sessions.length;
  const avgAccuracy = useMemo(() => {
    if (sessions.length === 0) return 0;
    const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0);
    const totalAnswered = sessions.reduce((a, s) => a + s.total, 0);
    return totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  }, [sessions]);

  const barColor = '#1CB0F6';
  const accuracyColor = '#58CC02';
  const wordsColor = '#FF9600';

  const sessionBarData = last7Days.map(d => ({
    label: getDayLabel(d),
    value: sessionsByDay[d],
    color: barColor,
  }));

  const accuracyBarData = last7Days.map(d => ({
    label: getDayLabel(d),
    value: accuracyByDay[d],
    color: accuracyColor,
  }));

  const wordsBarData = last7Days.map(d => ({
    label: getDayLabel(d),
    value: wordsByDay[d],
    color: wordsColor,
  }));

  const maxSessions = Math.max(...Object.values(sessionsByDay), 1);
  const maxWords = Math.max(...Object.values(wordsByDay), 1);
  const maxLevels = Math.max(...Object.values(levelsByDay), 1);

  const levelsBarData = last7Days.map(d => ({
    label: getDayLabel(d),
    value: levelsByDay[d],
    color: '#FF9600',
  }));

  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textMuted = isDark ? '#9BA1A6' : '#687076';
  const cardBg = isDark ? '#111122' : '#F5F5F5';
  const borderColor = isDark ? '#2D3148' : '#E5E7EB';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#0D0D18', paddingTop: insets.top }]}>
        <ActivityIndicator color="#1CB0F6" size="large" style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0D0D18', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backBtnText, { color: textPrimary }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>📊 Estadísticas</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tarjetas de resumen */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Resumen general</Text>
        <View style={styles.statsRow}>
          <StatCard emoji="🏆" label="Niveles" value={String(totalLevels)} color="#FF9600" />
          <StatCard emoji="🔥" label="Racha" value={`${game.streak}d`} color="#FF4B4B" />
          <StatCard emoji="💎" label="Gemas" value={String(game.gems)} color="#1CB0F6" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard emoji="🎯" label="Sesiones" value={String(totalSessions)} color="#58CC02" />
          <StatCard emoji="📈" label="Acierto" value={`${avgAccuracy}%`} color="#38BDF8" />
          <StatCard emoji="⚡" label="XP total" value={String(game.xp)} color="#F59E0B" />
        </View>

        {/* Gráfica: Niveles completados */}
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textPrimary }]}>Niveles completados</Text>
          <Text style={[styles.chartSubtitle, { color: textMuted }]}>Últimos 7 días · Datos reales por día</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={levelsBarData}
              maxValue={maxLevels}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Gráfica: Sesiones de práctica */}
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textPrimary }]}>Sesiones de práctica</Text>
          <Text style={[styles.chartSubtitle, { color: textMuted }]}>Últimos 7 días</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={sessionBarData}
              maxValue={maxSessions}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Gráfica: Palabras practicadas */}
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textPrimary }]}>Palabras practicadas</Text>
          <Text style={[styles.chartSubtitle, { color: textMuted }]}>Últimos 7 días</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={wordsBarData}
              maxValue={maxWords}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Gráfica: Tasa de acierto */}
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textPrimary }]}>Tasa de acierto (%)</Text>
          <Text style={[styles.chartSubtitle, { color: textMuted }]}>Últimos 7 días · Solo días con práctica</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={accuracyBarData}
              maxValue={100}
              unit="%"
              isDark={isDark}
            />
          </View>
        </View>

        {/* Datos adicionales */}
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.chartTitle, { color: textPrimary }]}>Datos del progreso</Text>
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: textMuted }]}>Tarea diaria completada</Text>
            <Text style={[styles.dataValue, { color: '#58CC02' }]}>{daily.totalDaysCompleted} días</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: textMuted }]}>Palabras con errores</Text>
            <Text style={[styles.dataValue, { color: '#FF4B4B' }]}>{totalErrors} palabras</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: textMuted }]}>Nivel máximo alcanzado</Text>
            <Text style={[styles.dataValue, { color: '#FF9600' }]}>Nivel {game.maxUnlockedLevel}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: textMuted }]}>XP total acumulado</Text>
            <Text style={[styles.dataValue, { color: '#F59E0B' }]}>{game.xp} XP</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  chartCard: {
    borderRadius: 16, padding: 16, marginTop: 16,
    borderWidth: 1,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  chartSubtitle: { fontSize: 12, marginBottom: 12 },
  chartContainer: { alignItems: 'center' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dataLabel: { fontSize: 14 },
  dataValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1 },
});
