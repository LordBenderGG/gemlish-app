import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  FillBlankExercise,
} from '@/data/exerciseGenerator';
import { styles } from '../styles';

function FillBlankView({
  exercise,
  onAnswer,
  hintUsed,
}: {
  exercise: FillBlankExercise;
  onAnswer: (correct: boolean) => void;
  hintUsed: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpiar timer al desmontar para evitar setState en componente muerto
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === exercise.correct;
    timerRef.current = setTimeout(() => onAnswer(correct), 900);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.questionLabel}>✏️ Completa la oración:</Text>
      <Text style={styles.questionText}>{exercise.questionEs}</Text>

      {/* Pista: muestra la respuesta correcta si se usó gema */}
      {hintUsed && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Pista: <Text style={styles.hintAnswer}>{exercise.correctAnswer}</Text></Text>
        </View>
      )}

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
        <Text style={[styles.feedbackText, { color: selected === exercise.correct ? '#4ADE80' : '#EF4444', marginTop: 8 }]}>
          {selected === exercise.correct
            ? '¡Correcto! ✅'
            : `Respuesta correcta: "${exercise.correctAnswer}" ❌`}
        </Text>
      )}
    </View>
  );
}

export default FillBlankView;
