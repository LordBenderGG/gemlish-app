'use client';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { getOrCreateDailyChallenge, completeDailyChallenge, type DailyChallenge } from '@/lib/daily-challenge';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView, TextInput, Modal,
} from 'react-native';
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

  const bgColor = !isUnlocked ? '#1A1D27' : isCompleted ? '#1A3A1A' : levelData.color + '22';
  const borderColor = !isUnlocked ? '#2D3148' : isCompleted ? '#58CC02' : levelData.color;
  const textColor = !isUnlocked ? '#4B5563' : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[styles.levelCard, { backgroundColor: bgColor, borderColor }]}
      onPress={isUnlocked ? onPress : onPressLocked}
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
            style={[styles.challengeCard, isCompleted && styles.challengeCardDone]}
            onPress={handleChallengePress}
            activeOpacity={0.88}
          >
            {/* Fondo de brillo animado */}
            {!isCompleted && (
              <Reanimated.View
                style={[StyleSheet.absoluteFill, styles.challengeShine, challengeShineStyle]}
                pointerEvents="none"
              />
            )}
            <View style={styles.challengeLeft}>
              <View style={[styles.challengeIconBg, { backgroundColor: challengeLevelData.color + '33' }]}>
                <Text style={styles.challengeIcon}>
                  {isCompleted ? '✅' : '🎯'}
                </Text>
              </View>
              <View style={styles.challengeInfo}>
                <View style={styles.challengeTitleRow}>
                  <Text style={styles.challengeLabel}>Desafío del día</Text>
                  {!isCompleted && (
                    <View style={styles.challengeX2Badge}>
                      <Text style={styles.challengeX2Text}>×2 XP</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.challengeLevelName, { color: challengeLevelData.color }]} numberOfLines={1}>
                  Nivel {dailyChallenge.levelId}: {challengeLevelData.name}
                </Text>
                {isCompleted ? (
                  <Text style={styles.challengeCompletedText}>✨ ¡Completado! +{dailyChallenge.xpEarned} XP · +{dailyChallenge.gemsEarned} 💎</Text>
                ) : (
                  <Text style={styles.challengeRewardText}>+{dailyChallenge.xpEarned} XP · +{dailyChallenge.gemsEarned} 💎 al completar</Text>
                )}
                {countdownText ? (
                  <Text style={styles.challengeCountdown}>⏱ Caduca en {countdownText}</Text>
                ) : null}
              </View>
            </View>
            <Text style={[styles.challengeArrow, { color: isCompleted ? '#58CC02' : challengeLevelData.color }]}>
              {isCompleted ? '✓' : '›'}
            </Text>
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
      <View style={styles.practiceRow}>
        <TouchableOpacity
          style={styles.quickReviewBtn}
          onPress={() => router.push('/practice/quick-review' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.quickReviewLeft}>
            <Text style={styles.quickReviewEmoji}>⚡</Text>
            <View>
              <Text style={styles.quickReviewTitle}>Repaso Rápido</Text>
              <Text style={styles.quickReviewSub}>10 palabras · 5 min</Text>
            </View>
          </View>
          <Text style={styles.quickReviewArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickReviewBtn, { flex: 1 }]}
          onPress={() => router.push('/practice/listen-mode' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.quickReviewLeft}>
            <Text style={styles.quickReviewEmoji}>🎧</Text>
            <View>
              <Text style={styles.quickReviewTitle}>Solo Escucha</Text>
              <Text style={styles.quickReviewSub}>10 ejercicios</Text>
            </View>
          </View>
          <Text style={styles.quickReviewArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickReviewBtn, { flex: 1 }]}
          onPress={() => router.push('/practice/order-mode' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.quickReviewLeft}>
            <Text style={styles.quickReviewEmoji}>📝</Text>
            <View>
              <Text style={styles.quickReviewTitle}>Solo Ordenar</Text>
              <Text style={styles.quickReviewSub}>10 ejercicios</Text>
            </View>
          </View>
          <Text style={styles.quickReviewArrow}>›</Text>
        </TouchableOpacity>
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
  // ─── Desafío del día ─────────────────────────────────────────────────────
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
    backgroundColor: '#FFD700',
    borderRadius: 16,
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  challengeIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIcon: { fontSize: 24 },
  challengeInfo: { flex: 1 },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  challengeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeX2Badge: {
    backgroundColor: '#FFD70025',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD70060',
  },
  challengeX2Text: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
  },
  challengeLevelName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  challengeRewardText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  challengeCompletedText: {
    fontSize: 11,
    color: '#58CC02',
    fontWeight: '600',
  },
  challengeArrow: {
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 8,
  },
  challengeCountdown: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});

