import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useSpeech } from '@/hooks/use-speech';
import {
  ListenWriteExercise,
} from '@/data/exerciseGenerator';
import { normalizeAnswer } from '@/lib/utils';
import { styles } from '../styles';

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleSpeak = useCallback(() => {
    toggle(exercise.wordToSpeak);
  }, [exercise.wordToSpeak, toggle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(exercise.wordToSpeak);
    }, 600);
    return () => clearTimeout(timer);
  }, [exercise.wordToSpeak, speak]);

  const handleSubmit = () => {
    if (!input.trim() || submitted) return;
    const userAnswer = normalizeAnswer(input);
    const correctNorm = normalizeAnswer(exercise.answer);
    const altNorm = exercise.answerAlt ? normalizeAnswer(exercise.answerAlt) : '';
    const correct = userAnswer === correctNorm || (altNorm !== '' && userAnswer === altNorm);
    setIsCorrect(correct);
    setSubmitted(true);
    timerRef.current = setTimeout(() => onAnswer(correct), 1000);
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
        <Text style={[styles.feedbackText, { color: isCorrect ? '#4ADE80' : '#EF4444' }]}>
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

export default ListenWriteView;
