'use client';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getLevelData, getLevelIcon } from '@/data/lessons';

const TOTAL_LEVELS = 500;

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

function StatsHeader({ username, gems, xp, streak }: {
  username: string; gems: number; xp: number; streak: number;
}) {
  // Animación de pulso para la racha
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [streak, pulseAnim]);

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
            <Animated.Text style={[styles.statEmoji, streak > 0 && { transform: [{ scale: pulseAnim }] }]}>
              🔥
            </Animated.Text>
            <Text style={[styles.statValue, streak >= 3 && styles.statValueStreak]}>{streak}</Text>
            {streak >= 7 && <Text style={styles.streakLabel}>días</Text>}
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
  const { username, game } = useGame();
  const { xp, gems, streak, maxUnlockedLevel, levelProgress } = game;

  const levels = useMemo(() =>
    Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1),
    []
  );

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1117" />
      <StatsHeader
        username={username || 'Estudiante'}
        gems={gems}
        xp={xp}
        streak={streak}
      />

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
  container: { flex: 1, backgroundColor: '#0F1117' },
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
});
