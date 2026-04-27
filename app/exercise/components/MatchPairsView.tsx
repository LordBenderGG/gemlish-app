import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  MatchPairsExercise,
} from '@/data/exerciseGenerator';
import { shuffleArray } from '@/lib/utils';
import { styles } from '../styles';

function MatchPairsView({
  exercise,
  onAnswer,
  hintUsed,
}: {
  exercise: MatchPairsExercise;
  onAnswer: (correct: boolean) => void;
  hintUsed?: boolean;
}) {
  const pairs = exercise.pairs;

  const leftItems = useMemo(() => shuffleArray(pairs.map(p => p.left)), [pairs]);
  const rightItems = useMemo(() => shuffleArray(pairs.map(p => p.right)), [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [connectedPairs, setConnectedPairs] = useState<{ leftIdx: number; rightIdx: number }[]>([]);
  const [wrongLeft, setWrongLeft] = useState<number | null>(null);
  const [wrongRight, setWrongRight] = useState<number | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  }, []);

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
        answerTimerRef.current = setTimeout(() => onAnswer(true), 500);
      }
    } else {
      setWrongLeft(selectedLeft);
      setWrongRight(rIdx);
      // Asegurar que ambos estados se resetean correctamente
      wrongTimerRef.current = setTimeout(() => {
        setWrongLeft(null);
        setWrongRight(null);
        setSelectedLeft(null); // Limpia la selección visual
      }, 700);
    }
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>Empareja las palabras:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>
      <Text style={styles.matchHint}>Toca una palabra en inglés y luego su traducción</Text>

      {/* Pista: revela el primer par si se usó gema */}
      {hintUsed && exercise.pairs.length > 0 && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Pista: <Text style={styles.hintAnswer}>{exercise.pairs[0].left}</Text> = <Text style={styles.hintAnswer}>{exercise.pairs[0].right}</Text></Text>
        </View>
      )}

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
                  connected && { color: '#4ADE80' },
                  selected && { color: '#4F46E5' },
                  isWrong && { color: '#EF4444' },
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
                  connected && { color: '#4ADE80' },
                  isWrong && { color: '#EF4444' },
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

export default MatchPairsView;
