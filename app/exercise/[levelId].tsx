import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLevelCompleteAd, useRewardedAd, AD_UNIT_IDS } from '@/hooks/useAdMob';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Alert, Animated, StatusBar, Platform,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ConfettiOverlay } from '@/components/confetti-overlay';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useAchievements } from '@/context/AchievementsContext';
import { getPracticeHistory } from '@/lib/practice-history';
import { useSpeech } from '@/hooks/use-speech';
import { useFeedbackSounds } from '@/hooks/use-feedback-sounds';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  generateLevel,
  MultipleChoiceExercise,
  TranslateExercise,
  MatchPairsExercise,
  ListenWriteExercise,
  SentenceOrderExercise,
  FillBlankExercise,
} from '@/data/exerciseGenerator';
import { shuffleArray, normalizeAnswer, isAnswerCorrectWithTolerance, levenshteinDistance } from '@/lib/utils';
import MultipleChoiceView from './components/MultipleChoiceView';
import TranslateView from './components/TranslateView';
import MatchPairsView from './components/MatchPairsView';
import ListenWriteView from './components/ListenWriteView';
import SentenceOrderView from './components/SentenceOrderView';
import FillBlankView from './components/FillBlankView';
import { styles, perfectStyles } from './styles';
// expo-audio no se usa en esta versión (pronunciación removida)

const TOTAL_EXERCISES = 20;
const HINT_COST = 10;

interface PerfectScreenProps {
  levelNum: number;
  levelTopic: string;
  xpEarned: number;
  gemsEarned: number;
  totalTime: string;
  maxStreak: number;
  insets: { top: number; bottom: number };
  onContinue: () => void;
  onRepeat: () => void;
}

function PerfectScreen({
  levelNum, levelTopic, xpEarned, gemsEarned, totalTime, maxStreak, insets, onContinue, onRepeat,
}: PerfectScreenProps) {
  // Animaciones de entrada
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(-15);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const trophyPulse = useSharedValue(1);

  useEffect(() => {
    // 1. Trofeo entra con rebote
    trophyScale.value = withSequence(
      withTiming(1.3, { duration: 350, easing: Easing.out(Easing.back(2)) }),
      withTiming(1.0, { duration: 200, easing: Easing.inOut(Easing.ease) }),
    );
    trophyRotate.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
    // 2. Título aparece
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 350 }));
    titleTranslateY.value = withDelay(300, withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }));
    // 3. Estadísticas aparecen
    statsOpacity.value = withDelay(550, withTiming(1, { duration: 400 }));
    statsTranslateY.value = withDelay(550, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));
    // 4. Botones aparecen
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 350 }));
    // 5. Pulso suave del trofeo en bucle
    trophyPulse.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    ));
  }, [buttonsOpacity, statsOpacity, statsTranslateY, titleOpacity, titleTranslateY, trophyPulse, trophyRotate, trophyScale]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value * trophyPulse.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  const statsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  return (
    <View style={[perfectStyles.container, { paddingTop: insets.top }]}>
      <ConfettiOverlay visible />
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={[perfectStyles.scroll, { paddingBottom: Math.max(insets.bottom, 32) }]} showsVerticalScrollIndicator={false}>
        {/* Trofeo animado */}
        <Reanimated.View style={[perfectStyles.trophyWrapper, trophyStyle]}>
          <View style={perfectStyles.trophyGlow}>
            <Text style={perfectStyles.trophyEmoji}>🏆</Text>
          </View>
        </Reanimated.View>

        {/* Título */}
        <Reanimated.View style={titleStyle}>
          <Text style={perfectStyles.perfectTitle}>¡Perfecto!</Text>
          <Text style={perfectStyles.perfectSubtitle}>Nivel {levelNum}: {levelTopic}</Text>
          {/* 3 estrellas doradas */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 }}>
            <Text style={{ fontSize: 32, color: '#F59E0B', textShadowColor: '#FBBF2480', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>★</Text>
            <Text style={{ fontSize: 32, color: '#F59E0B', textShadowColor: '#FBBF2480', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>★</Text>
            <Text style={{ fontSize: 32, color: '#F59E0B', textShadowColor: '#FBBF2480', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>★</Text>
          </View>
          <Text style={perfectStyles.perfectTagline}>Sin ningún error • ¡Increíble!</Text>
        </Reanimated.View>

        {/* Tarjetas de estadísticas */}
        <Reanimated.View style={[perfectStyles.statsGrid, statsStyle]}>
          <View style={[perfectStyles.statCard, perfectStyles.statCardGold]}>
            <Text style={perfectStyles.statEmoji}>⭐</Text>
            <Text style={perfectStyles.statValue}>+{xpEarned}</Text>
            <Text style={perfectStyles.statLabel}>XP Ganados</Text>
          </View>
          <View style={[perfectStyles.statCard, perfectStyles.statCardBlue]}>
            <Text style={perfectStyles.statEmoji}>💎</Text>
            <Text style={perfectStyles.statValue}>+{gemsEarned}</Text>
            <Text style={perfectStyles.statLabel}>Diamantes</Text>
          </View>
          <View style={[perfectStyles.statCard, perfectStyles.statCardGreen]}>
            <Text style={perfectStyles.statEmoji}>⏱</Text>
            <Text style={perfectStyles.statValue}>{totalTime}</Text>
            <Text style={perfectStyles.statLabel}>Tiempo</Text>
          </View>
          {maxStreak >= 3 && (
            <View style={[perfectStyles.statCard, perfectStyles.statCardRed]}>
              <Text style={perfectStyles.statEmoji}>🔥</Text>
              <Text style={perfectStyles.statValue}>{maxStreak}</Text>
              <Text style={perfectStyles.statLabel}>Racha máx.</Text>
            </View>
          )}
          <View style={[perfectStyles.statCard, perfectStyles.statCardPurple, maxStreak >= 3 ? {} : perfectStyles.statCardWide]}>
            <Text style={perfectStyles.statEmoji}>🎯</Text>
            <Text style={perfectStyles.statValue}>100%</Text>
            <Text style={perfectStyles.statLabel}>Precisión</Text>
          </View>
        </Reanimated.View>

        {/* Botones */}
        <Reanimated.View style={[perfectStyles.buttonsContainer, buttonsStyle]}>
          <TouchableOpacity style={perfectStyles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
            <Text style={perfectStyles.continueBtnText}>Continuar →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={perfectStyles.repeatBtn} onPress={onRepeat} activeOpacity={0.85}>
            <Text style={perfectStyles.repeatBtnText}>🔄 Repetir nivel</Text>
          </TouchableOpacity>
        </Reanimated.View>
      </ScrollView>
    </View>
  );
}

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { levelId, mode } = useLocalSearchParams<{ levelId: string; mode?: string }>();
  const { username, game, completeLevel, saveLevelErrors, loseHeart, spendGems } = useGame();
  const { checkAchievements } = useAchievements();
  const { playCorrect, playWrong, playLevelComplete, playStreak } = useFeedbackSounds();
  const { showIfNeeded: showLevelCompleteAd } = useLevelCompleteAd();
  const [showNoHeartsModal, setShowNoHeartsModal] = useState(false);
  const [hardModeHintUnlocked, setHardModeHintUnlocked] = useState(false);
  const { showAd: showHardModeHintAd, loaded: hardModeHintAdLoaded } = useRewardedAd(
    AD_UNIT_IDS.REWARDED_HARD_MODE_HINT,
    () => setHardModeHintUnlocked(true)
  );
  const { showAd: showContinueAd, loaded: continueAdLoaded } = useRewardedAd(
    AD_UNIT_IDS.REWARDED_CONTINUE,
    () => {
      // Recompensa: restaurar 3 corazones y continuar
      setHearts(3);
      setShowNoHeartsModal(false);
    }
  );
  const levelNum = parseInt(levelId || '1', 10);
  const isHardMode = mode === 'hard';
  const isListenMode = mode === 'listen';

  const level = useMemo(() => generateLevel(levelNum), [levelNum]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [hearts, setHearts] = useState(game.hearts);
  const [hintUsed, setHintUsed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const finalWrongCountRef = useRef(0); // ref para evitar stale en pantalla de resultado
  const [errorWords, setErrorWords] = useState<string[]>([]);
  const [internalStreak, setInternalStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  // Desglose por tipo de ejercicio: { type -> { correct, total } }
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, { correct: number; total: number }>>({});
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [floatingXP, setFloatingXP] = useState<{ id: number; value: number } | null>(null);
  const floatingXPCounter = useRef(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [wasChallengeLevel, setWasChallengeLevel] = useState(false);
  const [challengeBonus, setChallengeBonus] = useState<{ xp: number; gems: number }>({ xp: 0, gems: 0 });

  // Cronómetro
  // Detener el timer cuando se muestra el resultado
  useEffect(() => {
    if (showResult) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showResult]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Animaciones de toast y XP flotante
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(-20);
  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }],
  }));
  const xpAnimStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  // Animación de pulso del badge de racha
  const streakPulse = useSharedValue(1);
  useEffect(() => {
    if (internalStreak >= 3) {
      streakPulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      streakPulse.value = withTiming(1.0, { duration: 200 });
    }
  }, [internalStreak, streakPulse]);

  const streakBadgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakPulse.value }],
  }));

  // Animación de transición entre ejercicios
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(1);

  const transitionToNext = useCallback(() => {
    // Salida: deslizar a la izquierda y desvanecer
    slideAnim.value = withTiming(-30, { duration: 180, easing: Easing.in(Easing.ease) });
    fadeAnim.value = withTiming(0, { duration: 180 }, () => {
      // Reposicionar a la derecha (sin animar)
      slideAnim.value = 30;
      fadeAnim.value = 0;
      // Entrada: deslizar desde la derecha y aparecer
      slideAnim.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.ease) });
      fadeAnim.value = withTiming(1, { duration: 220 });
    });
  }, [slideAnim, fadeAnim]);

  const exerciseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Color de la barra de progreso según tipo de ejercicio
  const exerciseTypeColor = useMemo(() => {
    if (!level) return '#4ADE80';
    const type = level.exercises[currentIdx]?.type;
    switch (type) {
      case 'listen-write': return '#4F46E5';
      case 'fill-blank': return '#4ADE80';
      case 'sentence-order': return '#FF9500';
      case 'match-pairs': return '#CE82FF';
      case 'translate': return '#FF9500';
      default: return level.color;
    }
  }, [level, currentIdx]);

  // Animar color de la barra de progreso
  const barColorAnim = useSharedValue(0);
  const prevColorRef = useRef(exerciseTypeColor);
  const [barDisplayColor, setBarDisplayColor] = useState(exerciseTypeColor);

  useEffect(() => {
    setBarDisplayColor(exerciseTypeColor);
    prevColorRef.current = exerciseTypeColor;
  }, [exerciseTypeColor]);

  const animateProgress = useCallback((to: number) => {
    Animated.timing(progressAnim, {
      toValue: to,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const handleAnswer = useCallback(async (correct: boolean, wordEn?: string) => {
    // Actualizar desglose por tipo
    const currentType = level?.exercises[currentIdx]?.type ?? 'unknown';
    setTypeBreakdown(prev => ({
      ...prev,
      [currentType]: {
        correct: (prev[currentType]?.correct ?? 0) + (correct ? 1 : 0),
        total: (prev[currentType]?.total ?? 0) + 1,
      },
    }));
    if (correct) {
      const newStreak = internalStreak + 1;
      setInternalStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      // Sonido especial al llegar exactamente a 5 seguidas
      if (newStreak === 5) {
        playStreak();
        // Mostrar toast de racha
        setShowStreakToast(true);
        toastOpacity.value = withTiming(1, { duration: 200 });
        toastTranslateY.value = withTiming(0, { duration: 200 });
        setTimeout(() => {
          toastOpacity.value = withTiming(0, { duration: 300 });
          toastTranslateY.value = withTiming(-20, { duration: 300 });
          setTimeout(() => setShowStreakToast(false), 350);
        }, 1800);
      } else {
        playCorrect();
      }
      // XP flotante
      const xpVal = 5;
      floatingXPCounter.current += 1;
      const id = floatingXPCounter.current;
      setFloatingXP({ id, value: xpVal });
      xpOpacity.value = 1;
      xpTranslateY.value = 0;
      xpOpacity.value = withTiming(0, { duration: 900 });
      xpTranslateY.value = withTiming(-40, { duration: 900 });
      setTimeout(() => setFloatingXP(null), 950);
    } else {
      playWrong();
      setInternalStreak(0);
    }
    if (!correct) {
      setWrongCount(w => w + 1);
      if (wordEn) {
        setErrorWords(prev => prev.includes(wordEn) ? prev : [...prev, wordEn]);
      }
      const newHearts = hearts - 1;
      setHearts(newHearts);
      await loseHeart();
      if (newHearts <= 0) {
        setShowNoHeartsModal(true);
        return;
      }
    }
    const next = currentIdx + 1;
    if (next >= TOTAL_EXERCISES) {
      animateProgress(1);
      setShowResult(true);
      playLevelComplete();
      showLevelCompleteAd();
      const xpEarned = level?.xp || 10;
      // Calcular gemsEarned con el wrongCount final (incluyendo el error actual si aplica)
      const finalWrongCount = wrongCount + (!correct ? 1 : 0);
      finalWrongCountRef.current = finalWrongCount; // guardar para la pantalla de resultado
      const gemsEarned = finalWrongCount === 0 ? 10 : 5;
      const elapsedMs = elapsedSeconds * 1000;
      // Calcular score real: porcentaje de aciertos sobre el total de ejercicios
      const realScore = Math.round(((TOTAL_EXERCISES - finalWrongCount) / TOTAL_EXERCISES) * 100);
      try {
        const completionResult = await completeLevel(levelNum, xpEarned, gemsEarned, elapsedMs, realScore);
        setWasChallengeLevel(completionResult.wasChallenge);
        setChallengeBonus(completionResult.challengeBonus);
        if (username) {
          const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length + 1;
          // Calcular el mejor tiempo global del usuario para logros de velocidad
          const allBestTimes = { ...(game.levelBestTimes ?? {}), [levelNum]: elapsedMs };
          const bestLevelTime = Math.min(...Object.values(allBestTimes));
          const practiceSessions = await getPracticeHistory(username);
          await checkAchievements(username, {
            levelsCompleted,
            streak: game.streak,
            totalWordsLearned: 0,
            gems: game.gems + gemsEarned,
            xp: game.xp + xpEarned,
            totalDaysCompleted: 0,
            practiceSessionsCompleted: practiceSessions.length,
            bestLevelTime,
            dailyChallengesCompleted: (game.dailyChallengesCompleted ?? 0) + (completionResult.wasChallenge ? 1 : 0),
            challengeStreak: (game.challengeStreak ?? 0) + (completionResult.wasChallenge ? 1 : 0),
          });
        }
        // Construir lista final de errores sin mutar el estado directamente
        const finalErrors = wordEn && !correct && !errorWords.includes(wordEn)
          ? [...errorWords, wordEn]
          : [...errorWords];
        if (finalErrors.length > 0) {
          await saveLevelErrors(levelNum, finalErrors);
        }
      } catch (completionErr) {
        console.warn('[Exercise] Error completing level:', completionErr);
      }    } else {
      transitionToNext();
      animateProgress(next / TOTAL_EXERCISES);
      setCurrentIdx(next);
      setHintUsed(false);
      setExerciseKey(k => k + 1);
    }
  }, [currentIdx, hearts, wrongCount, errorWords, level, levelNum, internalStreak, completeLevel, saveLevelErrors, loseHeart, animateProgress, transitionToNext, playCorrect, playWrong, playLevelComplete, playStreak, checkAchievements, username, elapsedSeconds, game.challengeStreak, game.dailyChallengesCompleted, game.gems, game.levelBestTimes, game.levelProgress, game.streak, game.xp, showLevelCompleteAd, toastOpacity, toastTranslateY, xpOpacity, xpTranslateY]);

  const handleHint = useCallback(async () => {
    if (hintUsed) return;
    if (game.gems < HINT_COST) {
      Alert.alert('💎 Sin diamantes', `Necesitas ${HINT_COST} 💎 para usar una pista. Gana más jugando el minijuego.`);
      return;
    }
    Alert.alert(
      '💡 Usar Pista',
      `¿Gastar ${HINT_COST} 💎 para ver la respuesta?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Usar pista',
          onPress: async () => {
            const ok = await spendGems(HINT_COST);
            if (ok) setHintUsed(true);
          },
        },
      ]
    );
  }, [hintUsed, game.gems, spendGems]);

  if (!level) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <Text style={{ color: t.text, textAlign: 'center', marginTop: 40 }}>Nivel no encontrado</Text>
      </View>
    );
  }

  const exercise = level.exercises[currentIdx];

  // ─── Pantalla de Resultado ───────────────────────────────────────────────

  if (showResult) {
    // Usar el ref para evitar stale closure cuando el último ejercicio fue incorrecto
    const finalWrongCount = finalWrongCountRef.current;
    const gemsEarned = finalWrongCount === 0 ? 10 : 5;
    const xpEarned = level.xp;
    const isPerfect = finalWrongCount === 0;
    const totalTime = formatTime(elapsedSeconds);
    // Calcular estrellas para la pantalla de resultado
    const realScore = Math.round(((TOTAL_EXERCISES - finalWrongCount) / TOTAL_EXERCISES) * 100);
    const resultStars = realScore >= 100 ? 3 : realScore >= 70 ? 2 : 1;
    const typeLabels: Record<string, string> = {
      'multiple-choice': '📝 Opción múltiple',
      'translate': '🔄 Traducción',
      'match-pairs': '🧩 Emparejar',
      'listen-write': '🎧 Escucha',
      'sentence-order': '📝 Ordenar',
      'fill-blank': '✏️ Completar',
    };

    if (isPerfect) {
      return <PerfectScreen
        levelNum={levelNum}
        levelTopic={level.topic}
        xpEarned={xpEarned}
        gemsEarned={gemsEarned}
        totalTime={totalTime}
        maxStreak={maxStreak}
        insets={insets}
        onContinue={() => router.back()}
        onRepeat={() => {
          setCurrentIdx(0);
          setHearts(game.hearts);
          setWrongCount(0);
          setErrorWords([]);
          setInternalStreak(0);
          setMaxStreak(0);
          setTypeBreakdown({});
          setElapsedSeconds(0);
          setExerciseKey(k => k + 1);
          setShowResult(false);
        }}
      />;
    }

    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#EEF2FF', '#F8FAFF', '#F8FAFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
        />
        <ScrollView contentContainerStyle={[styles.resultContainer, { paddingBottom: 40 }]}>
          <Text style={styles.resultEmoji}>⭐</Text>
          <Text style={styles.resultTitle}>¡Nivel Completado!</Text>
          <Text style={styles.resultSubtitle}>Nivel {levelNum}: {level.topic}</Text>
          {/* Estrellas obtenidas */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 4 }}>
            {[1, 2, 3].map((i) => (
              <Text key={i} style={{ fontSize: 28, color: i <= resultStars ? '#F59E0B' : '#CBD5E1' }}>
                {i <= resultStars ? '★' : '☆'}
              </Text>
            ))}
          </View>
          <Text style={{ textAlign: 'center', color: '#64748B', fontSize: 13, marginBottom: 4 }}>
            {resultStars === 3 ? 'Perfecto' : resultStars === 2 ? 'Bien hecho' : 'Completado'} • {realScore}%
          </Text>

          {/* Recompensas */}
          <View style={styles.rewardsRow}>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardEmoji}>⭐</Text>
              <Text style={styles.rewardValue}>+{xpEarned} XP</Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardEmoji}>💎</Text>
              <Text style={styles.rewardValue}>+{gemsEarned}</Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardEmoji}>⏱</Text>
              <Text style={styles.rewardValue}>{totalTime}</Text>
            </View>
            {maxStreak >= 3 && (
              <View style={[styles.rewardBadge, { borderColor: '#FF6B6B40' }]}>
                <Text style={styles.rewardEmoji}>🔥</Text>
                <Text style={styles.rewardValue}>Racha: {maxStreak}</Text>
              </View>
            )}
          </View>

          {/* Badge Desafío del día completado */}
          {wasChallengeLevel && (
            <View style={styles.challengeBonusBanner}>
              <Text style={styles.challengeBonusTitle}>🏆 ¡Desafío del día completado!</Text>
              <Text style={styles.challengeBonusText}>Recompensa ×2 aplicada</Text>
              <View style={styles.challengeBonusRow}>
                {challengeBonus.xp > 0 && (
                  <View style={styles.challengeBonusBadge}>
                    <Text style={styles.challengeBonusBadgeText}>+{challengeBonus.xp} XP extra</Text>
                  </View>
                )}
                {challengeBonus.gems > 0 && (
                  <View style={[styles.challengeBonusBadge, { backgroundColor: '#00D4FF22', borderColor: '#4F46E5' }]}>
                    <Text style={[styles.challengeBonusBadgeText, { color: '#4F46E5' }]}>+{challengeBonus.gems} 💎 extra</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Desglose por tipo */}
          {Object.keys(typeBreakdown).length > 0 && (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Desglose por tipo</Text>
              {Object.entries(typeBreakdown).map(([type, { correct, total }]) => (
                <View key={type} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{typeLabels[type] ?? type}</Text>
                  <View style={styles.breakdownBarBg}>
                    <View style={[styles.breakdownBarFill, { width: `${Math.round((correct / total) * 100)}%` as any, backgroundColor: correct === total ? '#4ADE80' : correct / total >= 0.5 ? '#FF9500' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.breakdownPct}>{correct}/{total}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Botones */}
          <TouchableOpacity style={styles.continueBtn} onPress={() => router.back()}>
            <Text style={styles.continueBtnText}>Continuar →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: '#E2E8F0', marginTop: 10 }]}
            onPress={() => {
              setCurrentIdx(0);
              setHearts(game.hearts);
              setWrongCount(0);
              setErrorWords([]);
              setInternalStreak(0);
              setMaxStreak(0);
              setTypeBreakdown({});
              setElapsedSeconds(0);
              setExerciseKey(k => k + 1);
              setShowResult(false);
            }}
          >
            <Text style={[styles.continueBtnText, { color: '#64748B' }]}>🔄 Repetir nivel</Text>
          </TouchableOpacity>
          {errorWords.length > 0 && (
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: '#FF9500', marginTop: 10 }]}
              onPress={() => router.push({ pathname: '/review/[levelId]', params: { levelId: String(levelNum) } } as any)}
            >
              <Text style={styles.continueBtnText}>🔄 Repasar {errorWords.length} error{errorWords.length > 1 ? 'es' : ''}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header con gradiente */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.exerciseHeader}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: barDisplayColor }]} />
        </View>
        <View style={styles.heartsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={[styles.heartIcon, i >= hearts && styles.heartEmpty]}>
              {i < hearts ? '❤️' : '🖤'}
            </Text>
          ))}
        </View>
      </LinearGradient>

      {/* Sub-header */}
      <View style={styles.exerciseSubHeader}>
        <View style={styles.exerciseTypeTag}>
          <Text style={styles.exerciseTypeEmoji}>
            {exercise.type === 'multiple-choice' ? '📝'
              : exercise.type === 'translate' ? '🔄'
              : exercise.type === 'match-pairs' ? '🧩'
              : exercise.type === 'listen-write' ? '🎧'
              : exercise.type === 'sentence-order' ? '📝'
              : '✏️'}
          </Text>
          <Text style={styles.exerciseTypeName}>
            {exercise.type === 'multiple-choice' ? 'Opción múltiple'
              : exercise.type === 'translate' ? 'Traducción'
              : exercise.type === 'match-pairs' ? 'Emparejar'
              : exercise.type === 'listen-write' ? 'Escucha'
              : exercise.type === 'sentence-order' ? 'Ordenar'
              : 'Completar'}
          </Text>
          <Text style={[styles.exerciseTypeName, { color: '#94A3B8' }]}>
            · {currentIdx + 1}/{TOTAL_EXERCISES}
          </Text>
        </View>
        <View style={styles.subHeaderRight}>
          {isHardMode && (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#EF4444' }}>
              <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>🔥 Difícil</Text>
            </View>
          )}
          {isListenMode && (
            <View style={{ backgroundColor: '#1CB0F620', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#4F46E5' }}>
              <Text style={{ color: '#4F46E5', fontSize: 11, fontWeight: '700' }}>🎧 Solo escucha</Text>
            </View>
          )}
          <Text style={styles.timerText}>⏱ {formatTime(elapsedSeconds)}</Text>
          {internalStreak >= 3 && (
            <Reanimated.View style={[styles.streakBadge, streakBadgeAnimStyle]}>
              <Text style={styles.streakBadgeText}>🔥 {internalStreak}</Text>
            </Reanimated.View>
          )}
          <TouchableOpacity style={styles.hintBtn} onPress={handleHint}>
            <Text style={styles.hintBtnText}>💡 ({game.gems} 💎)</Text>
          </TouchableOpacity>
          {isHardMode && Platform.OS !== 'web' && !hardModeHintUnlocked && (
            <TouchableOpacity
              style={[styles.hintBtn, { backgroundColor: '#FF950020', borderColor: '#FF9500' }]}
              onPress={() => { if (!showHardModeHintAd()) setHardModeHintUnlocked(true); }}
            >
              <Text style={[styles.hintBtnText, { color: '#FF9500' }]}>
                {hardModeHintAdLoaded ? '🎥 Ayuda' : '⏳'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Toast de racha ¡En racha! */}
      {showStreakToast && (
        <Reanimated.View style={[styles.streakToast, toastAnimStyle]}>
          <Text style={styles.streakToastText}>🔥 ¡En racha! 5 seguidas</Text>
        </Reanimated.View>
      )}

      {/* XP flotante */}
      {floatingXP && (
        <Reanimated.View style={[styles.floatingXP, xpAnimStyle]}>
          <Text style={styles.floatingXPText}>+{floatingXP.value} XP</Text>
        </Reanimated.View>
      )}

      <Reanimated.View style={[{ flex: 1 }, exerciseAnimStyle]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {exercise.type === 'multiple-choice' && (
            <MultipleChoiceView
              key={exerciseKey}
              exercise={exercise as MultipleChoiceExercise}
              onAnswer={handleAnswer}
              hideTranslation={isHardMode}
              listenOnly={isListenMode}
              hintUsed={hintUsed}
            />
          )}
          {exercise.type === 'translate' && (
            <TranslateView
              key={exerciseKey}
              exercise={exercise as TranslateExercise}
              onAnswer={handleAnswer}
              hintUsed={hintUsed}
            />
          )}
          {exercise.type === 'match-pairs' && (
            <MatchPairsView
              key={exerciseKey}
              exercise={exercise as MatchPairsExercise}
              onAnswer={handleAnswer}
              hintUsed={hintUsed}
            />
          )}
          {exercise.type === 'listen-write' && (
            <ListenWriteView
              key={exerciseKey}
              exercise={exercise as ListenWriteExercise}
              onAnswer={handleAnswer}
              hintUsed={hintUsed}
            />
          )}
          {exercise.type === 'sentence-order' && (
            <SentenceOrderView
              key={exerciseKey}
              exercise={exercise as SentenceOrderExercise}
              onAnswer={handleAnswer}
              hintUsed={hintUsed}
            />
          )}
          {exercise.type === 'fill-blank' && (
            <FillBlankView
              key={exerciseKey}
              exercise={exercise as FillBlankExercise}
              onAnswer={handleAnswer}
              hintUsed={hintUsed}
            />
          )}
        </ScrollView>
      </Reanimated.View>

      {/* Modal: Sin vidas — ver anuncio para continuar */}
      {showNoHeartsModal && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center', alignItems: 'center', padding: 24,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28,
            alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#1E2A3A',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💔</Text>
            <Text style={{ color: '#1E293B', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Sin vidas</Text>
            <Text style={{ color: '#9BA1A6', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
              Ver un anuncio corto para recuperar 3 vidas y continuar
            </Text>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                onPress={() => { if (!showContinueAd()) {
                  // Si el anuncio no está listo, continuar igual
                  setHearts(3); setShowNoHeartsModal(false);
                }}}
                style={{
                  backgroundColor: '#38BDF8', borderRadius: 12, paddingVertical: 14,
                  paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 12,
                }}
              >
                <Text style={{ color: '#F8FAFF', fontWeight: '800', fontSize: 16 }}>
                  {continueAdLoaded ? '🎥 Ver anuncio y continuar' : '⏳ Cargando anuncio...'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => { setShowNoHeartsModal(false); router.back(); }}
              style={{
                borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
                width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ color: '#9BA1A6', fontSize: 14 }}>Salir del nivel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

