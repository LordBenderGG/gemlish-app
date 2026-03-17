'use client';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, cancelAnimation,
  withTiming, withSpring, withDelay, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getLevelData, getLevelIcon } from '@/data/lessons';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useFeedbackSounds } from '@/hooks/use-feedback-sounds';
import { ConfettiOverlay } from '@/components/confetti-overlay';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '@/hooks/useAdMob';
import { Platform } from 'react-native';

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
    // Cleanup: cancel animations on unmount
    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotate);
      cancelAnimation(opacity);
    };
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
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.header}>
        {/* Izquierda: saludo + nombre + XP */}
        <View style={styles.headerLeft}>
          <Text style={styles.greetingTime}>{timeGreeting} 👋</Text>
          <Text style={styles.greetingName}>{username}</Text>
          <View style={styles.xpRow}>
            <Text style={styles.xpStar}>⭐</Text>
            <Text style={styles.xpAmount}>{xp.toLocaleString()} XP</Text>
          </View>
        </View>
        {/* Derecha: gemas y racha */}
        <View style={styles.headerRight}>
          <View style={[styles.statPillGradient, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
            <Text style={styles.statPillEmoji}>💎</Text>
            <Text style={[styles.statPillValue, { color: '#0EA5E9' }]}>{gems}</Text>
          </View>
          <View style={[styles.statPillGradient, { backgroundColor: streak >= 3 ? '#FEF3C7' : '#F8FAFF', borderWidth: 1, borderColor: streak >= 3 ? '#FDE68A' : '#E2E8F0' }]}>
            <FireAnimation streak={streak} />
            <Text style={[styles.statPillValue, { color: streak >= 3 ? '#D97706' : '#64748B' }]}>{streak}</Text>
          </View>
        </View>
      </View>

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
              <View style={[styles.modalWordChip, { borderColor: '#3D4F6E' }]}>
                <Text style={[styles.modalWordEn, { color: '#64748B' }]}>+{levelData.words.length - 10} más</Text>
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
              <Text style={[styles.levelNum, { color: '#1E293B' }]}>Nivel {levelNum}</Text>
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
        colors={['#F0F9FF', '#F8FAFF']}
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
            <Text style={[styles.levelNum, { color: '#1E293B' }]}>Nivel {levelNum}</Text>
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
    }, [maxUnlockedLevel, showUnlockAnimation])
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

  const completedCount = useMemo(() => Object.values(levelProgress).filter(v => v?.completed).length, [levelProgress]);
  const progressPct = Math.round((completedCount / TOTAL_LEVELS) * 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />
      <StatsHeader
        username={username || 'Estudiante'}
        gems={gems}
        xp={xp}
        streak={streak}
      />

      {/* ─── Widget de Progreso del Curso ─── */}
      {(() => {
        const nextLevel = maxUnlockedLevel;
        const nextLevelData = getLevelData(nextLevel);
        const xpToday = Object.entries(game.levelCompletedDates ?? {}).reduce((acc, [date, count]) => {
          const today = new Date().toISOString().split('T')[0];
          return date === today ? acc + (count as number) * 20 : acc;
        }, 0);
        return (
          <View style={styles.progressWidget}>
            <LinearGradient
              colors={['#4F46E5', '#6366F1', '#818CF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.progressWidgetGradient}
            >
              {/* Fila superior: título y XP de hoy */}
              <View style={styles.progressWidgetTopRow}>
                <View style={styles.progressWidgetBadge}>
                  <Text style={styles.progressWidgetBadgeText}>📈 TU PROGRESO</Text>
                </View>
                {xpToday > 0 && (
                  <View style={styles.progressWidgetXpBadge}>
                    <Text style={styles.progressWidgetXpText}>+{xpToday} XP hoy</Text>
                  </View>
                )}
              </View>
              {/* Stats en fila */}
              <View style={styles.progressWidgetStats}>
                <View style={styles.progressWidgetStat}>
                  <Text style={styles.progressWidgetStatVal}>{completedCount}</Text>
                  <Text style={styles.progressWidgetStatLbl}>Niveles</Text>
                </View>
                <View style={styles.progressWidgetDivider} />
                <View style={styles.progressWidgetStat}>
                  <Text style={styles.progressWidgetStatVal}>{progressPct}%</Text>
                  <Text style={styles.progressWidgetStatLbl}>Completado</Text>
                </View>
                <View style={styles.progressWidgetDivider} />
                <View style={styles.progressWidgetStat}>
                  <Text style={styles.progressWidgetStatVal}>{streak}</Text>
                  <Text style={styles.progressWidgetStatLbl}>Racha 🔥</Text>
                </View>
                <View style={styles.progressWidgetDivider} />
                <View style={styles.progressWidgetStat}>
                  <Text style={styles.progressWidgetStatVal}>{xp}</Text>
                  <Text style={styles.progressWidgetStatLbl}>XP Total</Text>
                </View>
              </View>
              {/* Barra de progreso */}
              <View style={styles.progressWidgetBarBg}>
                <View style={[styles.progressWidgetBarFill, { width: `${progressPct}%` as any }]} />
              </View>
              {/* Próximo nivel */}
              <Text style={styles.progressWidgetNext} numberOfLines={1}>
                Siguiente: Nivel {nextLevel} — {nextLevelData.name}
              </Text>
            </LinearGradient>
          </View>
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

      {/* Modos de práctica — fila horizontal compacta */}
      <View style={styles.practiceSection}>
        <Text style={styles.practiceSectionLabel}>MODOS DE PRÁCTICA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.practiceRow}>
          {[
            { emoji: '⚡', title: 'Repaso', colors: ['#EFF6FF', '#DBEAFE'] as [string,string], accent: '#3B82F6', route: '/practice/quick-review' },
            { emoji: '🎧', title: 'Escucha', colors: ['#F0FDF4', '#DCFCE7'] as [string,string], accent: '#16A34A', route: '/practice/listen-mode' },
            { emoji: '📝', title: 'Ordenar', colors: ['#FFFBEB', '#FEF3C7'] as [string,string], accent: '#D97706', route: '/practice/order-mode' },
            { emoji: '🔥', title: 'Difíciles', colors: ['#FFF1F2', '#FFE4E6'] as [string,string], accent: '#E11D48', route: '/practice/hard-words' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.title}
              onPress={() => router.push(mode.route as any)}
              activeOpacity={0.75}
              style={[styles.practiceChipWrapper, { borderColor: mode.accent + '50' }]}
            >
              <LinearGradient
                colors={mode.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.practiceChip, { borderWidth: 1, borderColor: mode.accent + '40' }]}
              >
                <Text style={styles.practiceChipEmoji}>{mode.emoji}</Text>
                <Text style={[styles.practiceChipTitle, { color: mode.accent }]}>{mode.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

      {/* Banner AdMob — parte inferior */}
      {Platform.OS !== 'web' && (
        <BannerAd
          unitId={AD_UNIT_IDS.BANNER_HOME}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
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
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLeft: { flex: 1 },
  greetingTime: { fontSize: 12, fontWeight: '500', color: '#64748B', letterSpacing: 0.2 },
  greetingName: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 1, letterSpacing: -0.4, flexShrink: 1 },
  xpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  xpStar: { fontSize: 12 },
  xpAmount: { fontSize: 13, fontWeight: '700', color: '#4ADE80', marginLeft: 4 },
  xpLabel: { fontSize: 11, fontWeight: '600', color: '#A3E63580' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  statPillFire: {
    backgroundColor: '#2A1A0A',
    borderColor: '#92400E',
  },
  statPillEmoji: { fontSize: 14 },
  statPillValue: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  // Legacy aliases (keep for backward compat)
  greeting: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  xpText: { fontSize: 13, color: '#FFD700', fontWeight: '600' },
  statBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 4,
  },
  statBadgeGradient: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, gap: 5,
  },
  statEmoji: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  statValueWhite: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  globalProgress: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  progressPct: { fontSize: 12, color: '#4ADE80', fontWeight: '700' },
  progressBarBg: { height: 7, backgroundColor: '#EFF6FF', borderRadius: 4 },
  progressBarFill: { height: 7, backgroundColor: '#4ADE80', borderRadius: 4 },
  list: { padding: 10, paddingBottom: 20 },
  // Tarjeta bloqueada
  levelCardLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFF6FF',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    opacity: 0.75,
  },
  // Tarjeta completada
  levelCardCompleted: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#4ADE8050',
    marginBottom: 8,
    overflow: 'hidden',
  },
  // Tarjeta desbloqueada
  levelCardUnlocked: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#38BDF850',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  levelCardGradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  levelIconBgLocked: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  levelIconBgCompleted: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  levelIconBgGradient: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  levelIconText: { fontSize: 24 },
  levelInfo: { flex: 1 },
  levelNum: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  levelNumLocked: { fontSize: 15, fontWeight: '700', color: '#475569' },
  levelTopic: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  levelTopicLocked: { fontSize: 12, fontWeight: '500', marginTop: 2, color: '#64748B' },
  levelRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  completedRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  completedBadge: { fontSize: 22 },
  completedBadgeGradient: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  completedBadgeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  playBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  playBtnGradient: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  playBtnText: { color: '#FFFFFF', fontSize: 14, marginLeft: 2 },
  lockedText: { fontSize: 20 },
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

  // Sección de modos de práctica
  practiceSection: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  practiceSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  practiceRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  practiceTileNew: {
    width: 80,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceTileEmojiNew: { fontSize: 18, marginBottom: 4 },
  practiceTileTitleNew: { fontSize: 11, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center' },
  practiceTileSubNew: { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '500' },
  practiceRowContent: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  practiceChipWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  practiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderRadius: 20,
  },
  practiceChipEmoji: { fontSize: 16 },
  practiceChipTitle: { fontSize: 13, fontWeight: '800', letterSpacing: -0.1 },
  // Legacy grid styles (kept for compat)
  practiceSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  practiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  practiceTile: { width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'flex-start' },
  practiceTileWrapper: { width: '47.5%', borderRadius: 18, overflow: 'hidden' },
  practiceTileGradient: { padding: 18, alignItems: 'flex-start', minHeight: 110, justifyContent: 'space-between' },
  practiceTileEmojiLg: { fontSize: 32, marginBottom: 8 },
  practiceTileEmoji: { fontSize: 26, marginBottom: 8 },
  practiceTileTitle: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', marginBottom: 3, letterSpacing: -0.2 },
  practiceTileSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  // Filtro de categorías
  categoryScroll: {
    flexShrink: 0,
    flexGrow: 0,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexShrink: 0,
  },
  categoryChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#F8FAFF',
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    marginHorizontal: 16, marginVertical: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1, color: '#1E293B', fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: { padding: 4 },
  searchClearText: { color: '#64748B', fontSize: 14 },
  // ─── Modal de vista previa ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
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
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  modalSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  modalClose: { padding: 6 },
  modalCloseText: { fontSize: 16, color: '#64748B', fontWeight: '700' },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 80,
  },
  modalWordEn: { fontSize: 13, fontWeight: '700' },
  modalWordEs: { fontSize: 11, color: '#64748B', marginTop: 2 },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalXp: { fontSize: 13, fontWeight: '700', color: '#FFD700' },
  modalExercises: { fontSize: 13, fontWeight: '600', color: '#64748B' },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#4ADE80',
    padding: 32,
    alignItems: 'center',
    width: 280,
  },
  unlockEmoji: { fontSize: 56, marginBottom: 12 },
  unlockTitle: { fontSize: 22, fontWeight: '900', color: '#4ADE80', marginBottom: 6 },
  unlockSubtitle: { fontSize: 15, color: '#1E293B', fontWeight: '600', marginBottom: 4 },
  unlockDesc: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  //  // ─── Desafío del día (nuevo diseño) ─────────────────────────────────────
  challengeCardOuter: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  challengeGradient: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  challengeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  challengeDayBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  challengeDayText: {
    fontSize: 10, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  challengeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
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
  challengeRewardText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  challengeRewardTextNew: {
    fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600',
  },
  challengeCompletedText: { fontSize: 11, color: '#4ADE80', fontWeight: '600' },
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
    fontSize: 10, color: '#64748B', marginTop: 2, fontVariant: ['tabular-nums'],
  },
  challengeCountdownNew: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontVariant: ['tabular-nums'],
  },
  // ─── Widget de Progreso ───
  progressWidget: {
    marginHorizontal: 12, marginTop: 10, marginBottom: 4,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  progressWidgetGradient: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  progressWidgetTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progressWidgetBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  progressWidgetBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.2, textTransform: 'uppercase' },
  progressWidgetXpBadge: { backgroundColor: 'rgba(88,204,2,0.25)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  progressWidgetXpText: { fontSize: 11, fontWeight: '800', color: '#4ADE80' },
  progressWidgetStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progressWidgetStat: { flex: 1, alignItems: 'center' },
  progressWidgetStatVal: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 2 },
  progressWidgetStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  progressWidgetDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  progressWidgetBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 100, marginBottom: 8, overflow: 'hidden' },
  progressWidgetBarFill: { height: '100%' as any, backgroundColor: '#4ADE80', borderRadius: 100 },
  progressWidgetNext: { fontSize: 11, color: 'rgba(196,206,234,0.6)', fontWeight: '500' },
});

