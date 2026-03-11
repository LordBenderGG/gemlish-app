import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
// expo-audio no se usa en esta versión (pronunciación removida)

const TOTAL_EXERCISES = 20;
const HINT_COST = 10;

// ─── Normalizar respuestas (sin mayúsculas ni acentos) ──────────────────────

function normalizeAnswer(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')     // quitar puntuación
    .replace(/\s+/g, ' ');           // colapsar espacios
}

// ─── Opción Múltiple ─────────────────────────────────────────────────────────

function MultipleChoiceView({
  exercise,
  onAnswer,
  hideTranslation,
  listenOnly,
}: {
  exercise: MultipleChoiceExercise;
  onAnswer: (correct: boolean) => void;
  hideTranslation?: boolean;
  listenOnly?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const optionLetters = ['A', 'B', 'C', 'D'];
  const { speak } = useSpeech();

  // En modo solo escucha, reproducir la palabra al montar
  useEffect(() => {
    if (listenOnly && exercise.questionEs) {
      // Reproducir la respuesta correcta en inglés
      const correctOption = exercise.options[exercise.correct];
      if (correctOption) setTimeout(() => speak(correctOption), 400);
    }
  }, [listenOnly, exercise.correct, exercise.options, speak]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setTimeout(() => onAnswer(idx === exercise.correct), 800);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>{listenOnly ? '🎧 Escucha y elige:' : '¿Cuál es la respuesta?'}</Text>
      {!hideTranslation && <Text style={styles.questionText}>{exercise.questionEs}</Text>}
      {hideTranslation && <Text style={[styles.questionText, { opacity: 0.4 }]}>🔥 Modo difícil: sin traducción</Text>}
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

  const leftItems = useMemo(() => {
    return [...pairs.map(p => p.left)].sort(() => Math.random() - 0.5);
  }, []);

  const rightItems = useMemo(() => {
    return [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
  }, []);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [connectedPairs, setConnectedPairs] = useState<{ leftIdx: number; rightIdx: number }[]>([]);
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


// ─── Ordenar Oración ─────────────────────────────────────────────────────────

function SentenceOrderView({
  exercise,
  onAnswer,
}: {
  exercise: SentenceOrderExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const [availableWords, setAvailableWords] = useState<string[]>(exercise.shuffledWords);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelectWord = (word: string, idx: number) => {
    if (submitted) return;
    const newAvailable = [...availableWords];
    newAvailable.splice(idx, 1);
    setAvailableWords(newAvailable);
    setSelectedWords(prev => [...prev, word]);
  };

  const handleRemoveWord = (word: string, idx: number) => {
    if (submitted) return;
    const newSelected = [...selectedWords];
    newSelected.splice(idx, 1);
    setSelectedWords(newSelected);
    setAvailableWords(prev => [...prev, word]);
  };

  const handleVerify = () => {
    if (selectedWords.length === 0 || submitted) return;
    const userSentence = normalizeAnswer(selectedWords.join(' '));
    const correctSentence = normalizeAnswer(exercise.sentence);
    const correct = userSentence === correctSentence;
    setIsCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1200);
  };

  const handleReset = () => {
    if (submitted) return;
    setAvailableWords(exercise.shuffledWords);
    setSelectedWords([]);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>📝 Ordena la oración:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>

      {/* Traducción al español */}
      <View style={styles.sentenceTranslationBox}>
        <Text style={styles.sentenceTranslationText}>🇪🇸 {exercise.sentenceEs}</Text>
      </View>

      {/* Área de oración construida */}
      <View style={styles.sentenceBuilderArea}>
        {selectedWords.length === 0 ? (
          <Text style={styles.sentencePlaceholder}>Toca las palabras para ordenarlas aquí...</Text>
        ) : (
          <View style={styles.sentenceWordRow}>
            {selectedWords.map((word, idx) => (
              <TouchableOpacity
                key={`sel-${idx}-${word}`}
                style={[
                  styles.sentenceChip,
                  styles.sentenceChipSelected,
                  submitted && (isCorrect ? styles.sentenceChipCorrect : styles.sentenceChipWrong),
                ]}
                onPress={() => handleRemoveWord(word, idx)}
                disabled={submitted}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.sentenceChipText,
                  submitted && (isCorrect ? { color: '#58CC02' } : { color: '#FF4B4B' }),
                ]}>
                  {word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Separador */}
      <View style={styles.sentenceDivider} />

      {/* Palabras disponibles */}
      <View style={styles.sentenceWordRow}>
        {availableWords.map((word, idx) => (
          <TouchableOpacity
            key={`avail-${idx}-${word}`}
            style={styles.sentenceChip}
            onPress={() => handleSelectWord(word, idx)}
            disabled={submitted}
            activeOpacity={0.7}
          >
            <Text style={styles.sentenceChipText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback */}
      {submitted && (
        <Text style={[styles.feedbackText, { color: isCorrect ? '#58CC02' : '#FF4B4B', marginTop: 16 }]}>
          {isCorrect
            ? '¡Correcto! ✅'
            : `Oración correcta: "${exercise.sentence}" ❌`}
        </Text>
      )}

      {/* Botones */}
      {!submitted && (
        <View style={styles.sentenceButtonRow}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetBtnText}>↺ Reiniciar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, { flex: 1 }, selectedWords.length === 0 && styles.submitBtnDisabled]}
            onPress={handleVerify}
            disabled={selectedWords.length === 0}
          >
            <Text style={styles.submitBtnText}>Verificar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Completar la Oración ────────────────────────────────────────────────────

function FillBlankView({
  exercise,
  onAnswer,
}: {
  exercise: FillBlankExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === exercise.correct;
    setTimeout(() => onAnswer(correct), 900);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>✏️ Completa la oración:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>

      {/* Oración con hueco */}
      <View style={styles.fillSentenceBox}>
        <Text style={styles.fillSentenceText}>
          {exercise.sentenceBefore}
          <Text style={styles.fillBlank}>
            {answered ? ` ${exercise.options[selected!]} ` : ' _____ '}
          </Text>
          {exercise.sentenceAfter}
        </Text>
        {/* Traducción al español de la frase */}
        <Text style={styles.fillSentenceTranslation}>
          🇪🇸 {exercise.sentenceEs}
        </Text>
      </View>

      {/* Opciones */}
      <View style={styles.fillOptionsGrid}>
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
              style={[styles.fillOptionBtn, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleSelect(idx)}
              activeOpacity={0.75}
            >
              <Text style={[styles.fillOptionText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {answered && (
        <Text style={[styles.feedbackText, { color: selected === exercise.correct ? '#58CC02' : '#FF4B4B', marginTop: 8 }]}>
          {selected === exercise.correct
            ? '¡Correcto! ✅'
            : `Respuesta correcta: "${exercise.correctAnswer}" ❌`}
        </Text>
      )}
    </View>
  );
}

// ─── Pantalla ¡Perfecto! ────────────────────────────────────────────────────

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
  }, []);

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
      <StatusBar barStyle="light-content" />
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

const perfectStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  trophyWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  trophyGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFD70020',
    borderWidth: 2,
    borderColor: '#FFD70050',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  trophyEmoji: {
    fontSize: 72,
  },
  perfectTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  perfectSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  perfectTagline: {
    fontSize: 13,
    color: '#58CC02',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 32,
  },
  statCard: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
    borderWidth: 1,
  },
  statCardWide: {
    minWidth: '100%',
    flex: 0,
  },
  statCardGold: {
    backgroundColor: '#FFD70015',
    borderColor: '#FFD70040',
  },
  statCardBlue: {
    backgroundColor: '#1CB0F615',
    borderColor: '#1CB0F640',
  },
  statCardGreen: {
    backgroundColor: '#58CC0215',
    borderColor: '#58CC0240',
  },
  statCardRed: {
    backgroundColor: '#FF4B4B15',
    borderColor: '#FF4B4B40',
  },
  statCardPurple: {
    backgroundColor: '#CE82FF15',
    borderColor: '#CE82FF40',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  continueBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#0D1117',
    fontSize: 18,
    fontWeight: '800',
  },
  repeatBtn: {
    backgroundColor: '#1A1D27',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3148',
  },
  repeatBtnText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { levelId, mode } = useLocalSearchParams<{ levelId: string; mode?: string }>();
  const { username, game, completeLevel, saveLevelErrors, loseHeart, spendGems } = useGame();
  const { checkAchievements } = useAchievements();
  const { playCorrect, playWrong, playLevelComplete, playStreak } = useFeedbackSounds();
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
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
  }, [internalStreak >= 3]);

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
    if (!level) return '#58CC02';
    const type = level.exercises[currentIdx]?.type;
    switch (type) {
      case 'listen-write': return '#1CB0F6';
      case 'fill-blank': return '#58CC02';
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
      playLevelComplete();
      const xpEarned = level?.xp || 10;
      const gemsEarned = wrongCount === 0 ? 5 : 2;
      const elapsedMs = elapsedSeconds * 1000;
      const completionResult = await completeLevel(levelNum, xpEarned, gemsEarned, elapsedMs);
      setWasChallengeLevel(completionResult.wasChallenge);
      setChallengeBonus(completionResult.challengeBonus);
      if (username) {
        const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length + 1;
        // Calcular el mejor tiempo global del usuario para logros de velocidad
        const allBestTimes = { ...(game.levelBestTimes ?? {}), [levelNum]: elapsedMs };
        const bestLevelTime = Math.min(...Object.values(allBestTimes));
        await checkAchievements(username, {
          levelsCompleted,
          streak: game.streak,
          totalWordsLearned: 0,
          gems: game.gems + (wrongCount === 0 ? 5 : 2),
          xp: game.xp + (level?.xp || 10),
          totalDaysCompleted: 0,
          practiceSessionsCompleted: 0,
          ...({
            bestLevelTime,
            dailyChallengesCompleted: (game.dailyChallengesCompleted ?? 0) + (completionResult.wasChallenge ? 1 : 0),
            challengeStreak: (game.challengeStreak ?? 0) + (completionResult.wasChallenge ? 1 : 0),
          } as any),
        });
      }
      const finalErrors = errorWords;
      if (wordEn && !correct && !finalErrors.includes(wordEn)) {
        finalErrors.push(wordEn);
      }
      if (finalErrors.length > 0) {
        await saveLevelErrors(levelNum, finalErrors);
      }
    } else {
      transitionToNext();
      animateProgress(next / TOTAL_EXERCISES);
      setCurrentIdx(next);
      setHintUsed(false);
      setExerciseKey(k => k + 1);
    }
  }, [currentIdx, hearts, wrongCount, errorWords, level, levelNum, internalStreak, completeLevel, saveLevelErrors, loseHeart, animateProgress, transitionToNext, playCorrect, playWrong, playLevelComplete, playStreak]);

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
    const gemsEarned = wrongCount === 0 ? 5 : 2;
    const xpEarned = level.xp;
    const isPerfect = wrongCount === 0;
    const totalTime = formatTime(elapsedSeconds);
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
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={[styles.resultContainer, { paddingBottom: 40 }]}>
          <Text style={styles.resultEmoji}>⭐</Text>
          <Text style={styles.resultTitle}>¡Nivel Completado!</Text>
          <Text style={styles.resultSubtitle}>Nivel {levelNum}: {level.topic}</Text>

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
                  <View style={[styles.challengeBonusBadge, { backgroundColor: '#00D4FF22', borderColor: '#00D4FF' }]}>
                    <Text style={[styles.challengeBonusBadgeText, { color: '#00D4FF' }]}>+{challengeBonus.gems} 💎 extra</Text>
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
                    <View style={[styles.breakdownBarFill, { width: `${Math.round((correct / total) * 100)}%` as any, backgroundColor: correct === total ? '#58CC02' : correct / total >= 0.5 ? '#FF9500' : '#FF4B4B' }]} />
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
            style={[styles.continueBtn, { backgroundColor: '#2D3148', marginTop: 10 }]}
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
            <Text style={[styles.continueBtnText, { color: '#9CA3AF' }]}>🔄 Repetir nivel</Text>
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
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.exerciseHeader}>
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
      </View>

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
          <Text style={[styles.exerciseTypeName, { color: '#4B5563' }]}>
            · {currentIdx + 1}/{TOTAL_EXERCISES}
          </Text>
        </View>
        <View style={styles.subHeaderRight}>
          {isHardMode && (
            <View style={{ backgroundColor: '#FF4B4B20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FF4B4B' }}>
              <Text style={{ color: '#FF4B4B', fontSize: 11, fontWeight: '700' }}>🔥 Difícil</Text>
            </View>
          )}
          {isListenMode && (
            <View style={{ backgroundColor: '#1CB0F620', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#1CB0F6' }}>
              <Text style={{ color: '#1CB0F6', fontSize: 11, fontWeight: '700' }}>🎧 Solo escucha</Text>
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
          {exercise.type === 'sentence-order' && (
            <SentenceOrderView
              key={exerciseKey}
              exercise={exercise as SentenceOrderExercise}
              onAnswer={handleAnswer}
            />
          )}
          {exercise.type === 'fill-blank' && (
            <FillBlankView
              key={exerciseKey}
              exercise={exercise as FillBlankExercise}
              onAnswer={handleAnswer}
            />
          )}
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  // Pronunciación
  pronunciationWord: {
    fontSize: 36, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 8,
  },
  pronunciationPhonetic: {
    fontSize: 18, color: '#1CB0F6', textAlign: 'center',
    marginBottom: 6, fontStyle: 'italic',
  },
  pronunciationTranslation: {
    fontSize: 16, color: '#9CA3AF', textAlign: 'center',
    marginBottom: 20,
  },
  pronunciationExampleBox: {
    backgroundColor: '#1A1D27', borderRadius: 12, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#2D3148',
  },
  pronunciationExampleEn: {
    fontSize: 15, color: '#FFFFFF', fontWeight: '600',
    marginBottom: 6, lineHeight: 22,
  },
  pronunciationExampleEs: {
    fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', lineHeight: 20,
  },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#FF4B4B20', borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 2, borderColor: '#FF4B4B60',
  },
  recordBtnActive: {
    backgroundColor: '#FF4B4B40', borderColor: '#FF4B4B',
  },
  recordBtnDone: {
    backgroundColor: '#58CC0220', borderColor: '#58CC0260',
  },
  recordBtnEmoji: { fontSize: 28 },
  recordBtnText: { fontSize: 15, fontWeight: '700', color: '#FF6B6B' },
  playbackBtn: {
    backgroundColor: '#8E5AF520', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: '#8E5AF560',
  },
  playbackBtnActive: { backgroundColor: '#8E5AF540', borderColor: '#8E5AF5' },
  playbackBtnText: { fontSize: 15, fontWeight: '600', color: '#8E5AF5' },
  noMicBox: {
    backgroundColor: '#FF9500' + '20', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#FF9500' + '40',
    alignItems: 'center',
  },
  noMicText: { fontSize: 15, fontWeight: '700', color: '#FF9500', marginBottom: 4 },
  noMicSubtext: { fontSize: 13, color: '#9CA3AF' },
  pronunciationDone: {
    backgroundColor: '#58CC0220', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  pronunciationDoneText: { fontSize: 18, fontWeight: '700', color: '#58CC02' },
  // Ordenar oración
  sentenceBuilderArea: {
    minHeight: 80, backgroundColor: '#1A1D27', borderRadius: 12,
    borderWidth: 2, borderColor: '#2D3148', padding: 12,
    marginBottom: 16, justifyContent: 'center',
  },
  sentencePlaceholder: {
    color: '#6B7280', fontSize: 14, textAlign: 'center', fontStyle: 'italic',
  },
  sentenceWordRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  sentenceChip: {
    backgroundColor: '#2D3148', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 2, borderColor: '#3D4168',
  },
  sentenceChipSelected: {
    backgroundColor: '#1A2A3A', borderColor: '#1CB0F6',
  },
  sentenceChipCorrect: {
    backgroundColor: '#1A3A1A', borderColor: '#58CC02',
  },
  sentenceChipWrong: {
    backgroundColor: '#3A1A1A', borderColor: '#FF4B4B',
  },
  sentenceChipText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  sentenceDivider: {
    height: 1, backgroundColor: '#2D3148', marginVertical: 8,
  },
  sentenceButtonRow: {
    flexDirection: 'row', gap: 12, marginTop: 16,
  },
  resetBtn: {
    backgroundColor: '#1A1D27', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D3148',
    paddingHorizontal: 20,
  },
  resetBtnText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
  // Completar la oración
  fillSentenceBox: {
    backgroundColor: '#1A1D27', borderRadius: 12, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#2D3148',
  },
  fillSentenceText: {
    fontSize: 18, color: '#FFFFFF', lineHeight: 28, fontWeight: '500',
  },
  fillBlank: {
    color: '#1CB0F6', fontWeight: '800', textDecorationLine: 'underline',
  },
  fillSentenceTranslation: {
    fontSize: 13, color: '#9CA3AF', marginTop: 10,
    fontStyle: 'italic', lineHeight: 18,
  },
  sentenceTranslationBox: {
    backgroundColor: '#1A1D27',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#8E5AF5',
  },
  sentenceTranslationText: {
    fontSize: 13, color: '#C4A8FF', fontStyle: 'italic', lineHeight: 18,
  },
  timerText: {
    fontSize: 12, color: '#6B7280', fontVariant: ['tabular-nums'],
  },
  streakToast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#FF9600',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 100,
    shadowColor: '#FF9600',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  streakToastText: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '700',
  },
  floatingXP: {
    position: 'absolute',
    top: 120,
    right: 24,
    zIndex: 99,
  },
  floatingXPText: {
    color: '#58CC02', fontSize: 18, fontWeight: '800',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  breakdownContainer: {
    width: '100%', backgroundColor: '#1A1D27', borderRadius: 16,
    padding: 16, marginVertical: 16, borderWidth: 1, borderColor: '#2D3148',
  },
  breakdownTitle: {
    fontSize: 14, color: '#9CA3AF', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase',
  },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
  },
  breakdownLabel: {
    fontSize: 12, color: '#FFFFFF', width: 100,
  },
  breakdownBarBg: {
    flex: 1, height: 8, backgroundColor: '#2D3148', borderRadius: 4, overflow: 'hidden',
  },
  breakdownBarFill: {
    height: 8, borderRadius: 4,
  },
  breakdownPct: {
    fontSize: 12, color: '#9CA3AF', width: 30, textAlign: 'right',
  },
  fillOptionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  fillOptionBtn: {
    borderRadius: 12, borderWidth: 2, padding: 14,
    minWidth: '45%', alignItems: 'center', flex: 1,
  },
  fillOptionText: { fontSize: 16, fontWeight: '600' },
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
  // Pulso del botón de grabar
  recordPulseWrapper: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
  },
  pulseRing1: {
    borderColor: '#FF4B4B',
    backgroundColor: 'transparent',
  },
  pulseRing2: {
    borderColor: '#FF4B4B',
    backgroundColor: 'transparent',
  },
  // Ícono de tipo en sub-header
  exerciseTypeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  exerciseTypeEmoji: { fontSize: 14 },
  exerciseTypeName: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  subHeaderRight: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  streakBadge: {
    backgroundColor: '#FF4B4B20', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FF4B4B60',
  },
  streakBadgeText: { fontSize: 12, color: '#FF6B6B', fontWeight: '700' },
  challengeBonusBanner: {
    backgroundColor: '#FFD70015', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1.5, borderColor: '#FFD70060',
    alignItems: 'center',
  },
  challengeBonusTitle: { fontSize: 16, fontWeight: '800', color: '#FFD700', marginBottom: 4 },
  challengeBonusText: { fontSize: 13, color: '#FFD700AA', marginBottom: 10 },
  challengeBonusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  challengeBonusBadge: {
    backgroundColor: '#FFD70022', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FFD700',
  },
  challengeBonusBadgeText: { fontSize: 13, color: '#FFD700', fontWeight: '700' },
});
