import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Alert, Modal, Animated, StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { generateLevel, Exercise, MultipleChoiceExercise, TranslateExercise, MatchPairsExercise } from '@/data/exerciseGenerator';

const TOTAL_EXERCISES = 10;
const HINT_COST = 10;

// ─── Componente de Opción Múltiple ───────────────────────────────────────────

function MultipleChoiceView({
  exercise,
  onAnswer,
}: {
  exercise: MultipleChoiceExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === exercise.correct;
    setTimeout(() => onAnswer(isCorrect), 800);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

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

// ─── Componente de Traducción ────────────────────────────────────────────────

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
    const userAnswer = input.trim().toLowerCase();
    const correct = userAnswer === exercise.answer || userAnswer === exercise.answerAlt;
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
        editable={!submitted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      {submitted && (
        <Text style={[styles.feedbackText, { color: isCorrect ? '#58CC02' : '#FF4B4B' }]}>
          {isCorrect ? '¡Correcto! ✅' : `Respuesta: ${exercise.correctAnswer} ❌`}
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

// ─── Componente de Emparejamiento ────────────────────────────────────────────

function MatchPairsView({
  exercise,
  onAnswer,
}: {
  exercise: MatchPairsExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const pairs = exercise.pairs;
  const leftItems = useMemo(() => pairs.map(p => p.left), [pairs]);
  const rightItems = useMemo(() => {
    const arr = [...pairs.map(p => p.right)];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({});
  const [wrongPair, setWrongPair] = useState<{ l: number; r: number } | null>(null);

  const handleLeft = (idx: number) => {
    if (Object.values(matched).includes(idx) || Object.keys(matched).map(Number).includes(idx)) return;
    setSelectedLeft(idx);
  };

  const handleRight = (rIdx: number) => {
    if (selectedLeft === null) return;
    const rightWord = rightItems[rIdx];
    const leftWord = leftItems[selectedLeft];
    const correctPair = pairs.find(p => p.left === leftWord);
    if (correctPair && correctPair.right === rightWord) {
      const newMatched = { ...matched, [selectedLeft]: rIdx };
      setMatched(newMatched);
      setSelectedLeft(null);
      if (Object.keys(newMatched).length === pairs.length) {
        setTimeout(() => onAnswer(true), 600);
      }
    } else {
      setWrongPair({ l: selectedLeft, r: rIdx });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 700);
    }
  };

  const isLeftMatched = (idx: number) => Object.keys(matched).map(Number).includes(idx);
  const isRightMatched = (rIdx: number) => Object.values(matched).includes(rIdx);

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>Empareja las palabras:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>
      <View style={styles.matchGrid}>
        <View style={styles.matchColumn}>
          {leftItems.map((word, idx) => {
            const isMatched = isLeftMatched(idx);
            const isSelected = selectedLeft === idx;
            const isWrong = wrongPair?.l === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.matchCard,
                  isMatched && styles.matchCardMatched,
                  isSelected && styles.matchCardSelected,
                  isWrong && styles.matchCardWrong,
                ]}
                onPress={() => handleLeft(idx)}
                disabled={isMatched}
              >
                <Text style={[styles.matchCardText, isMatched && { color: '#58CC02' }]}>{word}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.matchColumn}>
          {rightItems.map((word, rIdx) => {
            const isMatched = isRightMatched(rIdx);
            const isWrong = wrongPair?.r === rIdx;
            return (
              <TouchableOpacity
                key={rIdx}
                style={[
                  styles.matchCard,
                  isMatched && styles.matchCardMatched,
                  isWrong && styles.matchCardWrong,
                ]}
                onPress={() => handleRight(rIdx)}
                disabled={isMatched}
              >
                <Text style={[styles.matchCardText, isMatched && { color: '#58CC02' }]}>{word}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Pantalla Principal de Ejercicio ─────────────────────────────────────────

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { game, completeLevel, loseHeart, spendGems } = useGame();
  const levelNum = parseInt(levelId || '1', 10);

  const level = useMemo(() => generateLevel(levelNum), [levelNum]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [hearts, setHearts] = useState(game.hearts);
  const [hintUsed, setHintUsed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback((to: number) => {
    Animated.timing(progressAnim, {
      toValue: to,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const handleAnswer = useCallback(async (correct: boolean) => {
    if (!correct) {
      setWrongCount(w => w + 1);
      const newHearts = hearts - 1;
      setHearts(newHearts);
      await loseHeart();
      if (newHearts <= 0) {
        Alert.alert(
          '💔 Sin vidas',
          'Te quedaste sin vidas. Vuelve más tarde o gana diamantes para continuar.',
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
    } else {
      animateProgress(next / TOTAL_EXERCISES);
      setCurrentIdx(next);
      setHintUsed(false);
      setExerciseKey(k => k + 1);
    }
  }, [currentIdx, hearts, wrongCount, level, levelNum, completeLevel, loseHeart, animateProgress]);

  const handleHint = useCallback(async () => {
    if (hintUsed || game.gems < HINT_COST) {
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
        <Text style={styles.resultTitle}>
          {wrongCount === 0 ? '¡Perfecto!' : '¡Nivel Completado!'}
        </Text>
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
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.continueBtnText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Pantalla de Ejercicio ───────────────────────────────────────────────

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

      {/* Contador y pista */}
      <View style={styles.exerciseSubHeader}>
        <Text style={styles.exerciseCount}>{currentIdx + 1} / {TOTAL_EXERCISES}</Text>
        <TouchableOpacity style={styles.hintBtn} onPress={handleHint}>
          <Text style={styles.hintBtnText}>💡 Pista ({game.gems} 💎)</Text>
        </TouchableOpacity>
      </View>

      {/* Ejercicio */}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1D27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#2D3148', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },
  heartsRow: { flexDirection: 'row', gap: 2 },
  heartIcon: { fontSize: 14 },
  heartEmpty: { opacity: 0.4 },
  exerciseSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  exerciseCount: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  hintBtn: {
    backgroundColor: '#1A1D27',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2D3148',
  },
  hintBtnText: { fontSize: 12, color: '#FFD700', fontWeight: '600' },
  exerciseContainer: { padding: 20, flex: 1 },
  questionLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  questionText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 24, lineHeight: 30 },
  optionsGrid: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { fontSize: 15, fontWeight: '500', flex: 1 },
  hintBox: {
    backgroundColor: '#FFD70020',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  hintText: { color: '#FFD700', fontSize: 14 },
  hintAnswer: { fontWeight: '700' },
  translateInput: {
    backgroundColor: '#1A1D27',
    borderWidth: 2,
    borderColor: '#2D3148',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  inputCorrect: { borderColor: '#58CC02', backgroundColor: '#1A3A1A' },
  inputWrong: { borderColor: '#FF4B4B', backgroundColor: '#3A1A1A' },
  feedbackText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  submitBtn: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#2D3148' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  matchGrid: { flexDirection: 'row', gap: 10 },
  matchColumn: { flex: 1, gap: 8 },
  matchCard: {
    backgroundColor: '#1A1D27',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2D3148',
    padding: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  matchCardSelected: { borderColor: '#1CB0F6', backgroundColor: '#1A2A3A' },
  matchCardMatched: { borderColor: '#58CC02', backgroundColor: '#1A3A1A' },
  matchCardWrong: { borderColor: '#FF4B4B', backgroundColor: '#3A1A1A' },
  matchCardText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  resultContainer: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultEmoji: { fontSize: 80, marginBottom: 16 },
  resultTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  resultSubtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 32 },
  rewardsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  rewardBadge: {
    backgroundColor: '#1A1D27',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3148',
    minWidth: 80,
  },
  rewardEmoji: { fontSize: 28, marginBottom: 4 },
  rewardValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  continueBtn: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
