'use client';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { getOrCreateDailyChallenge, completeDailyChallenge, type DailyChallenge } from '@/lib/daily-challenge';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getLevelData, getLevelIcon } from '@/data/lessons';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useFeedbackSounds } from '@/hooks/use-feedback-sounds';
import { ConfettiOverlay } from '@/components/confetti-overlay';

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
    <LinearGradient
      colors={['#1A0A2E', '#0D0D1F', '#0A0A14']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>¡Hola, {username}! 👋</Text>
          <View style={styles.progressRow}>
            <Text style={styles.xpText}>⭐ {xp.toLocaleString()} XP</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <LinearGradient
            colors={['#0891B2', '#22D3EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statBadgeGradient}
          >
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={styles.statValueWhite}>{gems}</Text>
          </LinearGradient>
          <LinearGradient
            colors={streak >= 3 ? ['#DC2626', '#F97316'] : ['#2D1B4E', '#3D2B5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statBadgeGradient}
          >
            <FireAnimation streak={streak} />
            <Text style={styles.statValueWhite}>{streak}</Text>
            {streak >= 7 && <Text style={styles.streakLabel}>d</Text>}
          </LinearGradient>
        </View>
      </View>
      <OfflineBadge />
    </LinearGradient>
  );
}

// ─── Modal de vista previa de nivel bloqueado ───────────────────────────────
function LevelPreviewModal({
  levelNum, visible, onClose,
}: { levelNum: number; visible: boolean; onClose: () => void }) {
  const levelData = useMemo(() => getLevelData(levelNum), [levelNum]);
  const icon = useMemo(() => getLevelIcon(levelNum), [levelNum]);
  const words = levelData.words.slice(0, 10);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalCard, { borderColor: levelData.color }]}
          onPress={() => {}}
        >
          {/* Header del modal */}
          <View style={[styles.modalHeader, { borderBottomColor: levelData.color + '40' }]}>
            <View style={[styles.modalIconBg, { backgroundColor: levelData.color + '22' }]}>
              <Text style={styles.modalIcon}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Nivel {levelNum}</Text>
              <Text style={[styles.modalSubtitle, { color: levelData.color }]}>{levelData.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <Text style={styles.modalDesc}>
            🔒 Completa el nivel anterior para desbloquear este nivel y aprender:
          </Text>

          {/* Lista de palabras */}
          <View style={styles.modalWordGrid}>
            {words.map((w, i) => (
              <View key={i} style={[styles.modalWordChip, { borderColor: levelData.color + '60' }]}>
                <Text style={[styles.modalWordEn, { color: levelData.color }]}>{w.word}</Text>
                <Text style={styles.modalWordEs}>{w.translation}</Text>
              </View>
            ))}
            {levelData.words.length > 10 && (
              <View style={[styles.modalWordChip, { borderColor: '#4B5563' }]}>
                <Text style={[styles.modalWordEn, { color: '#9CA3AF' }]}>+{levelData.words.length - 10} más</Text>
              </View>
            )}
          </View>

          {/* XP disponible */}
          <View style={styles.modalFooter}>
            <Text style={styles.modalXp}>⭐ {levelData.xp} XP al completar</Text>
            <Text style={styles.modalExercises}>📝 20 ejercicios</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

interface LevelCardProps {
  levelNum: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  onPress: () => void;
  onPressLocked?: () => void;
}

function LevelCard({ levelNum, isCompleted, isUnlocked, onPress, onPressLocked }: LevelCardProps) {
  const levelData = useMemo(() => getLevelData(levelNum), [levelNum]);
  const icon = useMemo(() => getLevelIcon(levelNum), [levelNum]);

  if (!isUnlocked) {
    return (
      <TouchableOpacity
        style={styles.levelCardLocked}
        onPress={onPressLocked}
        activeOpacity={0.7}
      >
        <View style={styles.levelLeft}>
          <View style={styles.levelIconBgLocked}>
            <Text style={styles.levelIconText}>🔒</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelNumLocked}>Nivel {levelNum}</Text>
            <Text style={styles.levelTopicLocked} numberOfLines={1}>{levelData.name}</Text>
          </View>
        </View>
        <Text style={styles.lockedText}>🔒</Text>
      </TouchableOpacity>
    );
  }

  if (isCompleted) {
    return (
      <TouchableOpacity
        style={styles.levelCardCompleted}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[levelData.color + '30', levelData.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.levelCardGradientInner}
        >
          <View style={styles.levelLeft}>
            <View style={[styles.levelIconBgCompleted, { backgroundColor: levelData.color + '40' }]}>
              <Text style={styles.levelIconText}>{icon}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelNum, { color: '#F0EEFF' }]}>Nivel {levelNum}</Text>
              <Text style={[styles.levelTopic, { color: levelData.color }]} numberOfLines={1}>{levelData.name}</Text>
            </View>
          </View>
          <View style={styles.completedRight}>
            <LinearGradient
              colors={['#059669', '#34D399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completedBadgeGradient}
            >
              <Text style={styles.completedBadgeText}>✓</Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Nivel desbloqueado sin completar
  return (
    <TouchableOpacity
      style={styles.levelCardUnlocked}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#1A1535', '#12121F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.levelCardGradientInner}
      >
        <View style={styles.levelLeft}>
          <LinearGradient
            colors={[levelData.color + '60', levelData.color + '30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelIconBgGradient}
          >
            <Text style={styles.levelIconText}>{icon}</Text>
          </LinearGradient>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelNum, { color: '#F0EEFF' }]}>Nivel {levelNum}</Text>
            <Text style={[styles.levelTopic, { color: levelData.color }]} numberOfLines={1}>{levelData.name}</Text>
          </View>
        </View>
        <LinearGradient
          colors={[levelData.color, levelData.color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.playBtnGradient}
        >
          <Text style={styles.playBtnText}>▶</Text>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function LevelsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { username, game } = useGame();
  const { xp, gems, streak, maxUnlockedLevel, levelProgress } = game;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLevel, setPreviewLevel] = useState<number | null>(null);
  const [unlockAnim, setUnlockAnim] = useState<{ levelNum: number; levelData: ReturnType<typeof getLevelData> } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const unlockScale = useSharedValue(0);
  const unlockOpacity = useSharedValue(0);
  const { playUnlock } = useFeedbackSounds();

  // ─── Desafío del día ─────────────────────────────────────────────────────
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [challengeReward, setChallengeReward] = useState<{ xp: number; gems: number } | null>(null);
  const challengeShineAnim = useSharedValue(0);

  // Contador regresivo hasta medianoche
  const [countdownText, setCountdownText] = useState('');
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdownText(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDailyChallenge = useCallback(async () => {
    if (!username) return;
    const levelData = getLevelData(maxUnlockedLevel > 0 ? maxUnlockedLevel : 1);
    const challenge = await getOrCreateDailyChallenge(
      username,
      maxUnlockedLevel,
      levelData.xp,
      5, // gemas base (igual que nivel perfecto)
    );
    setDailyChallenge(challenge);
    // Animación de brillo si no está completado
    if (!challenge.completed) {
      challengeShineAnim.value = withDelay(600, withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, false,
      ));
    }
  }, [username, maxUnlockedLevel, challengeShineAnim]);

  useEffect(() => {
    loadDailyChallenge();
  }, [loadDailyChallenge]);

  const handleChallengePress = useCallback(async () => {
    if (!dailyChallenge || !username) return;
    if (dailyChallenge.completed) {
      // Si ya está completado, ir al detalle del nivel
      router.push(`/level/${dailyChallenge.levelId}` as any);
      return;
    }
    // Ir al ejercicio del nivel del desafío
    router.push(`/exercise/${dailyChallenge.levelId}` as any);
  }, [dailyChallenge, username]);

  const challengeShineStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + challengeShineAnim.value * 0.25,
  }));

  const showUnlockAnimation = useCallback((levelNum: number) => {
    const levelData = getLevelData(levelNum);
    setUnlockAnim({ levelNum, levelData });
    setShowConfetti(true);
    playUnlock();
    unlockScale.value = 0;
    unlockOpacity.value = 0;
    unlockScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    unlockOpacity.value = withTiming(1, { duration: 200 });
    setTimeout(() => {
      unlockOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(() => {
        setUnlockAnim(null);
        setShowConfetti(false);
      }, 450);
    }, 2200);
  }, [unlockScale, unlockOpacity, playUnlock]);

  // Detectar nuevo nivel desbloqueado al volver al mapa + recargar desafío del día
  const prevMaxUnlockedRef = useRef(maxUnlockedLevel);
  useFocusEffect(
    useCallback(() => {
      const prev = prevMaxUnlockedRef.current;
      if (maxUnlockedLevel > prev && maxUnlockedLevel > 1) {
        showUnlockAnimation(maxUnlockedLevel);
      }
      prevMaxUnlockedRef.current = maxUnlockedLevel;
      // Recargar desafío del día al volver al mapa
      loadDailyChallenge();
    }, [maxUnlockedLevel, showUnlockAnimation, loadDailyChallenge])
  );

  const unlockAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: unlockScale.value }],
    opacity: unlockOpacity.value,
  }));

  const allLevels = useMemo(() =>
    Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1),
    []
  );

  const levels = useMemo(() => {
    let filtered = allLevels;
    // Filtro por categoría
    if (selectedCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (cat && cat.levels) {
        filtered = filtered.filter(levelNum => {
          const lessonId = ((levelNum - 1) % 40) + 1;
          return cat.levels!.includes(lessonId);
        });
      }
    }
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(levelNum => {
        const data = getLevelData(levelNum);
        return (
          String(levelNum).includes(q) ||
          data.name.toLowerCase().includes(q)
        );
      });
    }
    return filtered;
  }, [selectedCategory, searchQuery, allLevels]);

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
        onPressLocked={() => setPreviewLevel(levelNum)}
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

      {/* ─── Desafío del día ─── */}
      {dailyChallenge && (() => {
        const challengeLevelData = getLevelData(dailyChallenge.levelId);
        const isCompleted = dailyChallenge.completed;
        return (
          <TouchableOpacity
            style={styles.challengeCardOuter}
            onPress={handleChallengePress}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={isCompleted
                ? ['#064E3B', '#065F46', '#059669']
                : ['#78350F', '#92400E', '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.challengeGradient}
            >
              {/* Brillo animado */}
              {!isCompleted && (
                <Reanimated.View
                  style={[StyleSheet.absoluteFill, styles.challengeShine, challengeShineStyle]}
                  pointerEvents="none"
                />
              )}
              <View style={styles.challengeLeft}>
                <View style={styles.challengeIconBgNew}>
                  <Text style={styles.challengeIcon}>
                    {isCompleted ? '🏆' : '🎯'}
                  </Text>
                </View>
                <View style={styles.challengeInfo}>
                  <View style={styles.challengeTitleRow}>
                    <Text style={styles.challengeLabelNew}>DESAFÍO DEL DÍA</Text>
                    {!isCompleted && (
                      <View style={styles.challengeX2BadgeNew}>
                        <Text style={styles.challengeX2TextNew}>×2 XP</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.challengeLevelNameNew} numberOfLines={1}>
                    Nivel {dailyChallenge.levelId}: {challengeLevelData.name}
                  </Text>
                  {isCompleted ? (
                    <Text style={styles.challengeCompletedTextNew}>✨ ¡Completado! +{dailyChallenge.xpEarned} XP · +{dailyChallenge.gemsEarned} 💎</Text>
                  ) : (
                    <Text style={styles.challengeRewardTextNew}>+{dailyChallenge.xpEarned} XP · +{dailyChallenge.gemsEarned} 💎 al completar</Text>
                  )}
                  {countdownText ? (
                    <Text style={styles.challengeCountdownNew}>⏱ {countdownText}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.challengeArrowContainer}>
                <Text style={styles.challengeArrowNew}>{isCompleted ? '✓' : '›'}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        );
      })()}

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

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar nivel o tema..."
          placeholderTextColor="#4B5563"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modos de práctica */}
      <View style={styles.practiceSection}>
        <Text style={styles.practiceSectionTitle}>Modos de práctica</Text>
        <View style={styles.practiceGrid}>
          <TouchableOpacity
            style={styles.practiceTile}
            onPress={() => router.push('/practice/quick-review' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.practiceTileEmoji}>⚡</Text>
            <Text style={styles.practiceTileTitle}>Repaso Rápido</Text>
            <Text style={styles.practiceTileSub}>10 palabras · 5 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.practiceTile}
            onPress={() => router.push('/practice/listen-mode' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.practiceTileEmoji}>🎧</Text>
            <Text style={styles.practiceTileTitle}>Solo Escucha</Text>
            <Text style={styles.practiceTileSub}>10 ejercicios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.practiceTile}
            onPress={() => router.push('/practice/order-mode' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.practiceTileEmoji}>📝</Text>
            <Text style={styles.practiceTileTitle}>Solo Ordenar</Text>
            <Text style={styles.practiceTileSub}>10 ejercicios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.practiceTile}
            onPress={() => router.push('/practice/hard-words' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.practiceTileEmoji}>🔥</Text>
            <Text style={styles.practiceTileTitle}>Palabras Difíciles</Text>
            <Text style={styles.practiceTileSub}>Repaso de errores</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Modal de vista previa de nivel bloqueado */}
      {previewLevel !== null && (
        <LevelPreviewModal
          levelNum={previewLevel}
          visible={previewLevel !== null}
          onClose={() => setPreviewLevel(null)}
        />
      )}

      {/* Confeti de desbloqueo */}
      <ConfettiOverlay visible={showConfetti} />

      {/* Overlay de animación de desbloqueo */}
      {unlockAnim && (
        <Reanimated.View style={[styles.unlockOverlay, unlockAnimStyle]} pointerEvents="none">
          <View style={[styles.unlockCard, { borderColor: unlockAnim.levelData.color }]}>
            <Text style={styles.unlockEmoji}>🔓</Text>
            <Text style={[styles.unlockTitle, { color: unlockAnim.levelData.color }]}>
              ¡Nivel {unlockAnim.levelNum} desbloqueado!
            </Text>
            <Text style={styles.unlockSubtitle}>{unlockAnim.levelData.name}</Text>
            <Text style={styles.unlockDesc}>Sigue así — ¡estás progresando! 🚀</Text>
          </View>
        </Reanimated.View>
      )}
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
  statBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  statEmoji: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  statValueWhite: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
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
  list: { padding: 10, paddingBottom: 20 },
  // Tarjeta bloqueada
  levelCardLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1B3A',
    backgroundColor: '#0D0D1A',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 6,
    opacity: 0.5,
  },
  // Tarjeta completada
  levelCardCompleted: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#34D39940',
    marginBottom: 6,
    overflow: 'hidden',
  },
  // Tarjeta desbloqueada
  levelCardUnlocked: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2D1B5E',
    marginBottom: 6,
    overflow: 'hidden',
  },
  levelCardGradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  levelIconBgLocked: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#1E1B3A',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  levelIconBgCompleted: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  levelIconBgGradient: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  levelIconText: { fontSize: 22 },
  levelInfo: { flex: 1 },
  levelNum: { fontSize: 14, fontWeight: '700' },
  levelNumLocked: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
  levelTopic: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  levelTopicLocked: { fontSize: 12, fontWeight: '500', marginTop: 2, color: '#374151' },
  levelRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  completedRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  completedBadge: { fontSize: 22 },
  completedBadgeGradient: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  completedBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  playBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  playBtnGradient: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
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
  // Sección de modos de práctica (grid 2x2)
  practiceSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  practiceSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  practiceTile: {
    width: '47.5%',
    backgroundColor: '#1A1D2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D3148',
    alignItems: 'flex-start',
  },
  practiceTileEmoji: { fontSize: 26, marginBottom: 8 },
  practiceTileTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  practiceTileSub: { fontSize: 11, color: '#8E5AF5', fontWeight: '600' },
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2D3148',
    borderWidth: 1.5,
    borderColor: '#4A5080',
  },
  categoryChipActive: {
    backgroundColor: '#8E5AF5',
    borderColor: '#8E5AF5',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1D27', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#2D3148',
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1, color: '#FFFFFF', fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: { padding: 4 },
  searchClearText: { color: '#9CA3AF', fontSize: 14 },
  practiceRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexWrap: 'wrap',
  },
  // ─── Modal de vista previa ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1A1D27',
    borderRadius: 20,
    borderWidth: 1.5,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: { fontSize: 26 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  modalSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  modalClose: { padding: 6 },
  modalCloseText: { fontSize: 16, color: '#9CA3AF', fontWeight: '700' },
  modalDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    lineHeight: 18,
  },
  modalWordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 14,
  },
  modalWordChip: {
    backgroundColor: '#252836',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 80,
  },
  modalWordEn: { fontSize: 13, fontWeight: '700' },
  modalWordEs: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D3148',
  },
  modalXp: { fontSize: 13, fontWeight: '700', color: '#FFD700' },
  modalExercises: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  // ─── Animación de desbloqueo ──────────────────────────────────────────
  unlockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  unlockCard: {
    backgroundColor: '#1A1D27',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#58CC02',
    padding: 32,
    alignItems: 'center',
    width: 280,
  },
  unlockEmoji: { fontSize: 56, marginBottom: 12 },
  unlockTitle: { fontSize: 22, fontWeight: '900', color: '#58CC02', marginBottom: 6 },
  unlockSubtitle: { fontSize: 15, color: '#FFFFFF', fontWeight: '600', marginBottom: 4 },
  unlockDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  //  // ─── Desafío del día (nuevo diseño) ─────────────────────────────────────
  challengeCardOuter: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  challengeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD70050',
    backgroundColor: '#FFD70010',
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  challengeCardDone: {
    borderColor: '#58CC0250',
    backgroundColor: '#58CC0210',
  },
  challengeShine: {
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
    borderRadius: 20,
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  challengeIconBg: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  challengeIconBgNew: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  challengeIcon: { fontSize: 26 },
  challengeInfo: { flex: 1 },
  challengeTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3,
  },
  challengeLabel: {
    fontSize: 11, fontWeight: '800', color: '#FFD700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  challengeLabelNew: {
    fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  challengeX2Badge: {
    backgroundColor: '#FFD70025', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#FFD70060',
  },
  challengeX2BadgeNew: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  challengeX2Text: { fontSize: 10, fontWeight: '900', color: '#FFD700' },
  challengeX2TextNew: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  challengeLevelName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  challengeLevelNameNew: {
    fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 2,
  },
  challengeRewardText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  challengeRewardTextNew: {
    fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600',
  },
  challengeCompletedText: { fontSize: 11, color: '#58CC02', fontWeight: '600' },
  challengeCompletedTextNew: {
    fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700',
  },
  challengeArrow: { fontSize: 26, fontWeight: '700', marginLeft: 8 },
  challengeArrowContainer: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  challengeArrowNew: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  challengeCountdown: {
    fontSize: 10, color: '#9CA3AF', marginTop: 2, fontVariant: ['tabular-nums'],
  },
  challengeCountdownNew: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontVariant: ['tabular-nums'],
  },
});

