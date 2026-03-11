'use client';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getLevelData, getLevelIcon } from '@/data/lessons';
import { useThemeStyles } from '@/hooks/use-theme-styles';

const TOTAL_LEVELS = 500;

// Categorías de temas para el filtro
const CATEGORIES = [
  { id: 'all', label: '🌍 Todos', levels: null },
  { id: 'saludos', label: '👋 Saludos', levels: [1] },
  { id: 'numeros', label: '🔢 Números', levels: [2, 18] },
  { id: 'colores', label: '🎨 Colores', levels: [3] },
  { id: 'animales', label: '🐾 Animales', levels: [4] },
  { id: 'familia', label: '👨‍👩‍👧 Familia', levels: [5] },
  { id: 'cuerpo', label: '💪 Cuerpo', levels: [6, 23] },
  { id: 'comida', label: '🍎 Comida', levels: [7, 21, 36] },
  { id: 'casa', label: '🏠 Casa', levels: [8] },
  { id: 'ropa', label: '👗 Ropa', levels: [9] },
  { id: 'tiempo', label: '⛅ Tiempo', levels: [10] },
  { id: 'transporte', label: '🚗 Transporte', levels: [11] },
  { id: 'profesiones', label: '💼 Profesiones', levels: [12, 29] },
  { id: 'deportes', label: '⚽ Deportes', levels: [13] },
  { id: 'tecnologia', label: '💻 Tecnología', levels: [14, 35] },
  { id: 'naturaleza', label: '🌿 Naturaleza', levels: [15] },
  { id: 'emociones', label: '😊 Emociones', levels: [16] },
  { id: 'verbos', label: '🏃 Verbos', levels: [17, 27] },
  { id: 'tiempo2', label: '📅 Días/Meses', levels: [19] },
  { id: 'adjetivos', label: '✨ Adjetivos', levels: [20] },
  { id: 'viajes', label: '✈️ Viajes', levels: [28, 32, 33] },
  { id: 'frases', label: '💬 Frases', levels: [26, 30, 34] },
  { id: 'negocios', label: '🏢 Negocios', levels: [31, 38] },
  { id: 'phrasal', label: '🔗 Phrasal Verbs', levels: [39, 40] },
];

function OfflineBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://1.1.1.1', { signal: controller.signal, mode: 'no-cors' });
        clearTimeout(timeout);
        if (!cancelled) setIsOnline(true);
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <View style={[
      styles.offlineBadge,
      isOnline ? styles.offlineBadgeOk : styles.offlineBadgeNoConn,
    ]}>
      <Text style={styles.offlineDot}>{isOnline ? '🟢' : '🔴'}</Text>
      <Text style={[
        styles.offlineText,
        { color: isOnline ? '#58CC02' : '#FF9600' },
      ]}>
        {isOnline ? '100% Offline — Sin internet requerido' : 'Sin internet · Modo offline activo'}
      </Text>
    </View>
  );
}

function FireAnimation({ streak }: { streak: number }) {
  // Animación de llama cuando la racha es > 3 días
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (streak > 3) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(1.0, { duration: 400, easing: Easing.in(Easing.quad) }),
        ),
        -1, true
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 300 }),
          withTiming(8, { duration: 300 }),
          withTiming(0, { duration: 200 }),
        ),
        -1, false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1, true
      );
    } else if (streak > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1.0, { duration: 600 }),
        ),
        -1, true
      );
    }
  }, [streak]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.Text style={[styles.statEmoji, animStyle]}>
      {streak > 3 ? '🔥' : '🔥'}
    </Reanimated.Text>
  );
}

function StatsHeader({ username, gems, xp, streak }: {
  username: string; gems: number; xp: number; streak: number;
}) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>¡Hola, {username}! 👋</Text>
          <View style={styles.progressRow}>
            <Text style={styles.xpText}>⭐ {xp} XP</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statBadge}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={styles.statValue}>{gems}</Text>
          </View>
          <View style={[styles.statBadge, streak >= 3 && styles.statBadgeStreak]}>
            <FireAnimation streak={streak} />
            <Text style={[styles.statValue, streak >= 3 && styles.statValueStreak]}>{streak}</Text>
            {streak >= 7 && <Text style={styles.streakLabel}>días</Text>}
            {streak > 3 && <Text style={styles.streakHot}>🌡️</Text>}
          </View>
        </View>
      </View>
      <OfflineBadge />
    </View>
  );
}

interface LevelCardProps {
  levelNum: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  onPress: () => void;
}

function LevelCard({ levelNum, isCompleted, isUnlocked, onPress }: LevelCardProps) {
  const levelData = useMemo(() => getLevelData(levelNum), [levelNum]);
  const icon = useMemo(() => getLevelIcon(levelNum), [levelNum]);

  const bgColor = !isUnlocked ? '#1A1D27' : isCompleted ? '#1A3A1A' : levelData.color + '22';
  const borderColor = !isUnlocked ? '#2D3148' : isCompleted ? '#58CC02' : levelData.color;
  const textColor = !isUnlocked ? '#4B5563' : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[styles.levelCard, { backgroundColor: bgColor, borderColor }]}
      onPress={onPress}
      disabled={!isUnlocked}
      activeOpacity={0.75}
    >
      <View style={styles.levelLeft}>
        <View style={[styles.levelIconBg, { backgroundColor: isUnlocked ? levelData.color + '33' : '#2D3148' }]}>
          <Text style={styles.levelIconText}>{isUnlocked ? icon : '🔒'}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelNum, { color: textColor }]}>Nivel {levelNum}</Text>
          <Text style={[styles.levelTopic, { color: isUnlocked ? levelData.color : '#4B5563' }]} numberOfLines={1}>
            {levelData.name}
          </Text>
        </View>
      </View>
      <View style={styles.levelRight}>
        {isCompleted && <Text style={styles.completedBadge}>✅</Text>}
        {isUnlocked && !isCompleted && (
          <View style={[styles.playBtn, { backgroundColor: levelData.color }]}>
            <Text style={styles.playBtnText}>▶</Text>
          </View>
        )}
        {!isUnlocked && <Text style={styles.lockedText}>🔒</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function LevelsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { username, game } = useGame();
  const { xp, gems, streak, maxUnlockedLevel, levelProgress } = game;
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allLevels = useMemo(() =>
    Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1),
    []
  );

  const levels = useMemo(() => {
    if (selectedCategory === 'all') return allLevels;
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat || !cat.levels) return allLevels;
    // Filtrar niveles que corresponden a esas lecciones
    return allLevels.filter(levelNum => {
      const lessonId = ((levelNum - 1) % 40) + 1;
      return cat.levels!.includes(lessonId);
    });
  }, [selectedCategory, allLevels]);

  const handleLevelPress = useCallback((levelNum: number) => {
    const isCompleted = !!game.levelProgress[levelNum]?.completed;
    if (isCompleted) {
      router.push(`/level/${levelNum}` as any);
    } else {
      router.push(`/exercise/${levelNum}` as any);
    }
  }, [game.levelProgress]);

  const renderItem = useCallback(({ item: levelNum }: { item: number }) => {
    const isCompleted = !!levelProgress[levelNum]?.completed;
    const isUnlocked = levelNum <= maxUnlockedLevel;
    return (
      <LevelCard
        levelNum={levelNum}
        isCompleted={isCompleted}
        isUnlocked={isUnlocked}
        onPress={() => handleLevelPress(levelNum)}
      />
    );
  }, [levelProgress, maxUnlockedLevel, handleLevelPress]);

  const completedCount = Object.values(levelProgress).filter(v => v?.completed).length;
  const progressPct = Math.round((completedCount / TOTAL_LEVELS) * 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.bg === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={t.bg} />
      <StatsHeader
        username={username || 'Estudiante'}
        gems={gems}
        xp={xp}
        streak={streak}
      />

      {/* Filtro de categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botón de Repaso Rápido */}
      <TouchableOpacity
        style={styles.quickReviewBtn}
        onPress={() => router.push('/practice/quick-review' as any)}
        activeOpacity={0.85}
      >
        <View style={styles.quickReviewLeft}>
          <Text style={styles.quickReviewEmoji}>⚡</Text>
          <View>
            <Text style={styles.quickReviewTitle}>Repaso Rápido</Text>
            <Text style={styles.quickReviewSub}>10 palabras · 5 minutos</Text>
          </View>
        </View>
        <Text style={styles.quickReviewArrow}>›</Text>
      </TouchableOpacity>

      {/* Barra de progreso global */}
      <View style={styles.globalProgress}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progreso del curso</Text>
          <Text style={styles.progressPct}>{completedCount}/{TOTAL_LEVELS} niveles · {progressPct}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
        </View>
      </View>

      <FlatList
        data={levels}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        getItemLayout={(_, index) => ({ length: 76, offset: 76 * index, index })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  xpText: { fontSize: 13, color: '#FFD700', fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 8 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D27',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2D3148',
    gap: 4,
  },
  statEmoji: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  globalProgress: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  progressPct: { fontSize: 12, color: '#58CC02', fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: '#2D3148', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#58CC02', borderRadius: 3 },
  list: { padding: 12, paddingBottom: 20 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    height: 68,
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  levelIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelIconText: { fontSize: 22 },
  levelInfo: { flex: 1 },
  levelNum: { fontSize: 14, fontWeight: '700' },
  levelTopic: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  levelRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  completedBadge: { fontSize: 22 },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: { color: '#FFFFFF', fontSize: 12, marginLeft: 2 },
  lockedText: { fontSize: 18 },
  statBadgeStreak: {
    backgroundColor: '#FF6B0022',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statValueStreak: { color: '#FF9500' },
  streakLabel: { fontSize: 9, color: '#FF9500', fontWeight: '600', marginLeft: 2 },
  streakHot: { fontSize: 10, marginLeft: 1 },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  offlineBadgeOk: { backgroundColor: '#58CC0210' },
  offlineBadgeNoConn: { backgroundColor: '#FF960015' },
  offlineDot: { fontSize: 9 },
  offlineText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  // Botón de repaso rápido
  quickReviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#8E5AF520', borderRadius: 0,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#8E5AF540',
  },
  quickReviewLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickReviewEmoji: { fontSize: 20 },
  quickReviewTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  quickReviewSub: { fontSize: 11, color: '#8E5AF5', fontWeight: '600', marginTop: 1 },
  quickReviewArrow: { fontSize: 22, color: '#8E5AF5', fontWeight: '700' },
  // Filtro de categorías
  categoryScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1D27',
    borderWidth: 1.5,
    borderColor: '#2D3148',
  },
  categoryChipActive: {
    backgroundColor: '#8E5AF520',
    borderColor: '#8E5AF5',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryChipTextActive: {
    color: '#8E5AF5',
    fontWeight: '700',
  },
});
