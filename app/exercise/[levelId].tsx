import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Alert, Animated, StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useAchievements } from '@/context/AchievementsContext';
import { useSpeech } from '@/hooks/use-speech';
import {
  generateLevel,
  MultipleChoiceExercise,
  TranslateExercise,
  MatchPairsExercise,
  ListenWriteExercise,
} from '@/data/exerciseGenerator';

const TOTAL_EXERCISES = 10;
const HINT_COST = 10;

// ─── Opción Múltiple ─────────────────────────────────────────────────────────

function MultipleChoiceView({
  exercise,
  onAnswer,
}: {
  exercise: MultipleChoiceExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const optionLetters = ['A', 'B', 'C', 'D'];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setTimeout(() => onAnswer(idx === exercise.correct), 800);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>¿Cuál es la respuesta?</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>
      <View style={styles.optionsGrid}>
        {exercise.options.map((opt, idx) => {
          let bg = '#1A1D27';
          let border = '#2D3148';
          let textColor = '#FFFFFF';
          if (answered) {
            if (idx === exercise.correct) { bg = '#1A3A1A'; border = '#58CC02'; textColor = '#58CC02'; }
            else if (idx === selected) { bg = '#3A1A1A'; border = '#FF4B4B'; textColor = '#FF4B4B'; }
          } else if (selected === idx) {
            bg = '#1A2A3A'; border = '#1CB0F6';
          }
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleSelect(idx)}
              activeOpacity={0.75}
            >
              <View style={[styles.optionLetter, { borderColor: border }]}>
                <Text style={[styles.optionLetterText, { color: textColor }]}>{optionLetters[idx]}</Text>
              </View>
              <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Traducción ──────────────────────────────────────────────────────────────

function normalizeAnswer(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')     // quitar puntuación
    .replace(/\s+/g, ' ');           // colapsar espacios
}

function TranslateView({
  exercise,
  onAnswer,
  hintUsed,
}: {
  exercise: TranslateExercise;
  onAnswer: (correct: boolean) => void;
  hintUsed: boolean;
}) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || submitted) return;
    const userAnswer = normalizeAnswer(input);
    const correctNorm = normalizeAnswer(exercise.answer);
    const altNorm = exercise.answerAlt ? normalizeAnswer(exercise.answerAlt) : '';
    const correct = userAnswer === correctNorm || (altNorm !== '' && userAnswer === altNorm);
    setIsCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1000);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>Escribe en inglés:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>
      {hintUsed && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Pista: <Text style={styles.hintAnswer}>{exercise.hint}</Text></Text>
        </View>
      )}
      <TextInput
        style={[
          styles.translateInput,
          submitted && (isCorrect ? styles.inputCorrect : styles.inputWrong),
        ]}
        placeholder="Escribe tu respuesta en inglés..."
        placeholderTextColor="#6B7280"
        value={input}
        onChangeText={setInput}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        editable={!submitted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      {submitted && (
        <Text style={[styles.feedbackText, { color: isCorrect ? '#58CC02' : '#FF4B4B' }]}>
          {isCorrect ? '¡Correcto! ✅' : `Respuesta correcta: "${exercise.correctAnswer}" ❌`}
        </Text>
      )}
      {!submitted && (
        <TouchableOpacity
          style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim()}
        >
          <Text style={styles.submitBtnText}>Verificar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Emparejamiento de Pares ─────────────────────────────────────────────────

function MatchPairsView({
  exercise,
  onAnswer,
}: {
  exercise: MatchPairsExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const pairs = exercise.pairs;

  // Columna izquierda: palabras en inglés (mezcladas)
  const leftItems = useMemo(() => {
    return [...pairs.map(p => p.left)].sort(() => Math.random() - 0.5);
  }, []);

  // Columna derecha: traducciones (mezcladas independientemente)
  const rightItems = useMemo(() => {
    return [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
  }, []);

  // selectedLeft: índice en leftItems del ítem seleccionado
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  // connectedPairs: { leftIdx, rightIdx } pares correctamente conectados
  const [connectedPairs, setConnectedPairs] = useState<{ leftIdx: number; rightIdx: number }[]>([]);
  // wrongFlash: índices que parpadean en rojo
  const [wrongLeft, setWrongLeft] = useState<number | null>(null);
  const [wrongRight, setWrongRight] = useState<number | null>(null);

  const isLeftConnected = (idx: number) => connectedPairs.some(p => p.leftIdx === idx);
  const isRightConnected = (idx: number) => connectedPairs.some(p => p.rightIdx === idx);

  const handleLeftPress = (idx: number) => {
    if (isLeftConnected(idx)) return;
    setSelectedLeft(prev => prev === idx ? null : idx);
  };

  const handleRightPress = (rIdx: number) => {
    if (isRightConnected(rIdx)) return;
    if (selectedLeft === null) return;

    const leftWord = leftItems[selectedLeft];
    const rightWord = rightItems[rIdx];

    // Buscar si el par es correcto (el left y right pertenecen al mismo par original)
    const isCorrectPair = pairs.some(
      p => p.left === leftWord && p.right === rightWord
    );

    if (isCorrectPair) {
      const newPairs = [...connectedPairs, { leftIdx: selectedLeft, rightIdx: rIdx }];
      setConnectedPairs(newPairs);
      setSelectedLeft(null);
      if (newPairs.length === pairs.length) {
        setTimeout(() => onAnswer(true), 500);
      }
    } else {
      // Flash rojo y deseleccionar
      setWrongLeft(selectedLeft);
      setWrongRight(rIdx);
      setTimeout(() => {
        setWrongLeft(null);
        setWrongRight(null);
        setSelectedLeft(null);
      }, 700);
    }
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>Empareja las palabras:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>
      <Text style={styles.matchHint}>Toca una palabra en inglés y luego su traducción</Text>

      <View style={styles.matchGrid}>
        {/* Columna izquierda — inglés */}
        <View style={styles.matchColumn}>
          <Text style={styles.matchColHeader}>🇺🇸 Inglés</Text>
          {leftItems.map((word, idx) => {
            const connected = isLeftConnected(idx);
            const selected = selectedLeft === idx;
            const isWrong = wrongLeft === idx;
            return (
              <TouchableOpacity
                key={`left-${idx}`}
                style={[
                  styles.matchCard,
                  connected && styles.matchCardConnected,
                  selected && styles.matchCardSelected,
                  isWrong && styles.matchCardWrong,
                ]}
                onPress={() => handleLeftPress(idx)}
                disabled={connected}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.matchCardText,
                  connected && { color: '#58CC02' },
                  selected && { color: '#1CB0F6' },
                  isWrong && { color: '#FF4B4B' },
                ]} numberOfLines={2}>
                  {word}
                </Text>
                {connected && <Text style={styles.matchCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Columna derecha — español */}
        <View style={styles.matchColumn}>
          <Text style={styles.matchColHeader}>🇪🇸 Español</Text>
          {rightItems.map((word, rIdx) => {
            const connected = isRightConnected(rIdx);
            const isWrong = wrongRight === rIdx;
            return (
              <TouchableOpacity
                key={`right-${rIdx}`}
                style={[
                  styles.matchCard,
                  connected && styles.matchCardConnected,
                  isWrong && styles.matchCardWrong,
                ]}
                onPress={() => handleRightPress(rIdx)}
                disabled={connected}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.matchCardText,
                  connected && { color: '#58CC02' },
                  isWrong && { color: '#FF4B4B' },
                ]} numberOfLines={2}>
                  {word}
                </Text>
                {connected && <Text style={styles.matchCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.matchProgress}>
        {connectedPairs.length}/{pairs.length} pares encontrados
      </Text>
    </View>
  );
}

// ─── Escucha y Escribe ───────────────────────────────────────────────────────

function ListenWriteView({
  exercise,
  onAnswer,
  hintUsed,
}: {
  exercise: ListenWriteExercise;
  onAnswer: (correct: boolean) => void;
  hintUsed: boolean;
}) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { speaking, speak, toggle } = useSpeech();

  const handleSpeak = useCallback(() => {
    toggle(exercise.wordToSpeak);
  }, [exercise.wordToSpeak, toggle]);

  // Pronunciar automáticamente al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(exercise.wordToSpeak);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || submitted) return;
    const userAnswer = normalizeAnswer(input);
    const correctNorm = normalizeAnswer(exercise.answer);
    const altNorm = exercise.answerAlt ? normalizeAnswer(exercise.answerAlt) : '';
    const correct = userAnswer === correctNorm || (altNorm !== '' && userAnswer === altNorm);
    setIsCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1000);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>🎧 Escucha y escribe:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>

      <TouchableOpacity
        style={[styles.listenBtn, speaking && styles.listenBtnActive]}
        onPress={handleSpeak}
        activeOpacity={0.8}
      >
        <Text style={styles.listenBtnEmoji}>{speaking ? '⏹' : '🔊'}</Text>
        <Text style={styles.listenBtnText}>
          {speaking ? 'Reproduciendo...' : 'Escuchar palabra'}
        </Text>
      </TouchableOpacity>

      {hintUsed && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Pista: <Text style={styles.hintAnswer}>{exercise.hint}</Text></Text>
        </View>
      )}

      <TextInput
        style={[
          styles.translateInput,
          submitted && (isCorrect ? styles.inputCorrect : styles.inputWrong),
        ]}
        placeholder="Escribe la palabra que escuchaste..."
        placeholderTextColor="#6B7280"
        value={input}
        onChangeText={setInput}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        editable={!submitted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      {submitted && (
        <Text style={[styles.feedbackText, { color: isCorrect ? '#58CC02' : '#FF4B4B' }]}>
          {isCorrect ? '¡Correcto! ✅' : `La palabra era: "${exercise.correctAnswer}" ❌`}
        </Text>
      )}
      {!submitted && (
        <TouchableOpacity
          style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim()}
        >
          <Text style={styles.submitBtnText}>Verificar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { username, game, completeLevel, saveLevelErrors, loseHeart, spendGems } = useGame();
  const { checkAchievements } = useAchievements();
  const levelNum = parseInt(levelId || '1', 10);

  const level = useMemo(() => generateLevel(levelNum), [levelNum]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [hearts, setHearts] = useState(game.hearts);
  const [hintUsed, setHintUsed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [errorWords, setErrorWords] = useState<string[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback((to: number) => {
    Animated.timing(progressAnim, {
      toValue: to,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const handleAnswer = useCallback(async (correct: boolean, wordEn?: string) => {
    if (!correct) {
      setWrongCount(w => w + 1);
      // Guardar la palabra fallida
      if (wordEn) {
        setErrorWords(prev => prev.includes(wordEn) ? prev : [...prev, wordEn]);
      }
      const newHearts = hearts - 1;
      setHearts(newHearts);
      await loseHeart();
      if (newHearts <= 0) {
        Alert.alert(
          '💔 Sin vidas',
          'Te quedaste sin vidas. Vuelve más tarde o gana diamantes jugando.',
          [{ text: 'Volver', onPress: () => router.back() }]
        );
        return;
      }
    }
    const next = currentIdx + 1;
    if (next >= TOTAL_EXERCISES) {
      animateProgress(1);
      setShowResult(true);
      const xpEarned = level?.xp || 10;
      const gemsEarned = wrongCount === 0 ? 5 : 2;
      await completeLevel(levelNum, xpEarned, gemsEarned);
      // Verificar logros desbloqueados
      if (username) {
        const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length + 1;
        await checkAchievements(username, {
          levelsCompleted,
          streak: game.streak,
          totalWordsLearned: 0,
          gems: game.gems + (wrongCount === 0 ? 5 : 2),
          xp: game.xp + (level?.xp || 10),
          totalDaysCompleted: 0,
          practiceSessionsCompleted: 0,
        });
      }
      // Guardar errores del nivel
      const finalErrors = errorWords;
      if (wordEn && !correct && !finalErrors.includes(wordEn)) {
        finalErrors.push(wordEn);
      }
      if (finalErrors.length > 0) {
        await saveLevelErrors(levelNum, finalErrors);
      }
    } else {
      animateProgress(next / TOTAL_EXERCISES);
      setCurrentIdx(next);
      setHintUsed(false);
      setExerciseKey(k => k + 1);
    }
  }, [currentIdx, hearts, wrongCount, errorWords, level, levelNum, completeLevel, saveLevelErrors, loseHeart, animateProgress]);

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Nivel no encontrado</Text>
      </View>
    );
  }

  const exercise = level.exercises[currentIdx];

  // ─── Pantalla de Resultado ───────────────────────────────────────────────

  if (showResult) {
    const gemsEarned = wrongCount === 0 ? 5 : 2;
    const xpEarned = level.xp;
    return (
      <View style={[styles.container, styles.resultContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.resultEmoji}>{wrongCount === 0 ? '🏆' : '⭐'}</Text>
        <Text style={styles.resultTitle}>{wrongCount === 0 ? '¡Perfecto!' : '¡Nivel Completado!'}</Text>
        <Text style={styles.resultSubtitle}>Nivel {levelNum}: {level.topic}</Text>
        <View style={styles.rewardsRow}>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardEmoji}>⭐</Text>
            <Text style={styles.rewardValue}>+{xpEarned} XP</Text>
          </View>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardEmoji}>💎</Text>
            <Text style={styles.rewardValue}>+{gemsEarned}</Text>
          </View>
          {wrongCount === 0 && (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardEmoji}>🎯</Text>
              <Text style={styles.rewardValue}>¡Sin errores!</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.continueBtn} onPress={() => router.back()}>
          <Text style={styles.continueBtnText}>Continuar →</Text>
        </TouchableOpacity>
        {errorWords.length > 0 && (
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: '#FF9500', marginTop: 12 }]}
            onPress={() => router.push({ pathname: '/review/[levelId]', params: { levelId: String(levelNum) } } as any)}
          >
            <Text style={styles.continueBtnText}>🔄 Repasar {errorWords.length} error{errorWords.length > 1 ? 'es' : ''}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.exerciseHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: level.color }]} />
        </View>
        <View style={styles.heartsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={[styles.heartIcon, i >= hearts && styles.heartEmpty]}>
              {i < hearts ? '❤️' : '🖤'}
            </Text>
          ))}
        </View>
      </View>

      {/* Sub-header */}
      <View style={styles.exerciseSubHeader}>
        <Text style={styles.exerciseCount}>{currentIdx + 1} / {TOTAL_EXERCISES}</Text>
        <TouchableOpacity style={styles.hintBtn} onPress={handleHint}>
          <Text style={styles.hintBtnText}>💡 Pista ({game.gems} 💎)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {exercise.type === 'multiple-choice' && (
          <MultipleChoiceView
            key={exerciseKey}
            exercise={exercise as MultipleChoiceExercise}
            onAnswer={handleAnswer}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1A1D27',
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#2D3148', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },
  heartsRow: { flexDirection: 'row', gap: 2 },
  heartIcon: { fontSize: 14 },
  heartEmpty: { opacity: 0.4 },
  exerciseSubHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  exerciseCount: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  hintBtn: {
    backgroundColor: '#1A1D27', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#2D3148',
  },
  hintBtnText: { fontSize: 12, color: '#FFD700', fontWeight: '600' },
  exerciseContainer: { padding: 20, flex: 1 },
  questionLabel: {
    fontSize: 12, color: '#9CA3AF', fontWeight: '700',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  questionText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 24, lineHeight: 30 },
  optionsGrid: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 2, padding: 14, gap: 12,
  },
  optionLetter: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { fontSize: 15, fontWeight: '500', flex: 1 },
  hintBox: {
    backgroundColor: '#FFD70020', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#FFD70040',
  },
  hintText: { color: '#FFD700', fontSize: 14 },
  hintAnswer: { fontWeight: '700' },
  translateInput: {
    backgroundColor: '#1A1D27', borderWidth: 2, borderColor: '#2D3148',
    borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16, marginBottom: 16,
  },
  inputCorrect: { borderColor: '#58CC02', backgroundColor: '#1A3A1A' },
  inputWrong: { borderColor: '#FF4B4B', backgroundColor: '#3A1A1A' },
  feedbackText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  submitBtn: { backgroundColor: '#58CC02', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#2D3148' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  // Match pairs
  matchHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 16, fontStyle: 'italic' },
  matchGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  matchColumn: { flex: 1, gap: 8 },
  matchColHeader: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  matchCard: {
    backgroundColor: '#1A1D27', borderRadius: 10, borderWidth: 2,
    borderColor: '#2D3148', padding: 12, alignItems: 'center',
    minHeight: 52, justifyContent: 'center', flexDirection: 'row', gap: 4,
  },
  matchCardSelected: { borderColor: '#1CB0F6', backgroundColor: '#0D1F2D' },
  matchCardConnected: { borderColor: '#58CC02', backgroundColor: '#0D2010' },
  matchCardWrong: { borderColor: '#FF4B4B', backgroundColor: '#2D0D0D' },
  matchCardText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center', flex: 1 },
  matchCheck: { fontSize: 14, color: '#58CC02' },
  matchProgress: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', fontWeight: '600' },
  // Listen & Write
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#1CB0F620', borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 2, borderColor: '#1CB0F640',
  },
  listenBtnActive: { backgroundColor: '#1CB0F640', borderColor: '#1CB0F6' },
  listenBtnEmoji: { fontSize: 32 },
  listenBtnText: { fontSize: 16, fontWeight: '700', color: '#1CB0F6' },
  // Resultado
  resultContainer: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultEmoji: { fontSize: 80, marginBottom: 16 },
  resultTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  resultSubtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 32 },
  rewardsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  rewardBadge: {
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D3148', minWidth: 80,
  },
  rewardEmoji: { fontSize: 28, marginBottom: 4 },
  rewardValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  continueBtn: { backgroundColor: '#58CC02', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 18 },
  continueBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
