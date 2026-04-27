import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSpeech } from '@/hooks/use-speech';
import {
  MultipleChoiceExercise,
} from '@/data/exerciseGenerator';
import { styles } from '../styles';

function MultipleChoiceView({
  exercise,
  onAnswer,
  hideTranslation,
  listenOnly,
  hintUsed,
}: {
  exercise: MultipleChoiceExercise;
  onAnswer: (correct: boolean) => void;
  hideTranslation?: boolean;
  listenOnly?: boolean;
  hintUsed?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const optionLetters = ['A', 'B', 'C', 'D'];
  const { speak, speaking } = useSpeech();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpiar timer pendiente al desmontar para evitar setState en componente muerto
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // En modo solo escucha: reproducir la respuesta correcta en inglés
  // En modo difícil: reproducir la palabra en inglés automáticamente
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (listenOnly) {
      const correctOption = exercise.options[exercise.correct];
      if (correctOption) t = setTimeout(() => speak(correctOption), 400);
    } else if (hideTranslation && exercise.wordEn) {
      t = setTimeout(() => speak(exercise.wordEn), 500);
    }
    return () => clearTimeout(t);
  }, [listenOnly, hideTranslation, exercise.correct, exercise.options, exercise.wordEn, speak]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    timerRef.current = setTimeout(() => onAnswer(idx === exercise.correct), 800);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>{listenOnly ? '🎧 Escucha y elige:' : hideTranslation ? '🔥 Modo difícil:' : '¿Cuál es la respuesta?'}</Text>
      {!hideTranslation && <Text style={styles.questionText}>{exercise.questionEs}</Text>}
      {hideTranslation && (
        <View style={{ gap: 12 }}>
          <Text style={styles.questionText}>{exercise.question}</Text>
          <TouchableOpacity
            style={[styles.listenBtn, speaking && styles.listenBtnActive]}
            onPress={() => speak(exercise.wordEn)}
            activeOpacity={0.75}
          >
            <Text style={styles.listenBtnEmoji}>{speaking ? '⏹' : '🔊'}</Text>
            <Text style={styles.listenBtnText}>{speaking ? 'Reproduciendo...' : 'Escuchar de nuevo'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Pista: muestra la respuesta correcta si se usó gema */}
      {hintUsed && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Pista: <Text style={styles.hintAnswer}>{exercise.correctAnswer}</Text></Text>
        </View>
      )}
      <View style={styles.optionsGrid}>
        {exercise.options.map((opt, idx) => {
          let bg = '#FFFFFF';
          let border = '#E2E8F0';
          let textColor = '#1E293B';
          if (answered) {
            if (idx === exercise.correct) { bg = '#F0FDF4'; border = '#4ADE80'; textColor = '#166534'; }
            else if (idx === selected) { bg = '#FEF2F2'; border = '#EF4444'; textColor = '#991B1B'; }
          } else if (selected === idx) {
            bg = '#EFF6FF'; border = '#4F46E5'; textColor = '#3730A3';
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

export default MultipleChoiceView;
