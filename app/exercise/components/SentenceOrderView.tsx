import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSpeech } from '@/hooks/use-speech';
import {
  SentenceOrderExercise,
} from '@/data/exerciseGenerator';
import { normalizeAnswer } from '@/lib/utils';
import { styles } from '../styles';

function SentenceOrderView({
  exercise,
  onAnswer,
  hintUsed,
}: {
  exercise: SentenceOrderExercise;
  onAnswer: (correct: boolean) => void;
  hintUsed: boolean;
}) {
  const [availableWords, setAvailableWords] = useState<string[]>(exercise.shuffledWords);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { speak } = useSpeech();

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleSelectWord = (word: string, idx: number) => {
    if (submitted) return;
    speak(word);
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
    timerRef.current = setTimeout(() => onAnswer(correct), 1200);
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

      {/* Pista: muestra la oración correcta si se usó gema */}
      {hintUsed && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Pista: <Text style={styles.hintAnswer}>{exercise.sentence}</Text></Text>
        </View>
      )}

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
                  submitted && (isCorrect ? { color: '#4ADE80' } : { color: '#EF4444' }),
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
        <Text style={[styles.feedbackText, { color: isCorrect ? '#4ADE80' : '#EF4444', marginTop: 16 }]}>
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

export default SentenceOrderView;
