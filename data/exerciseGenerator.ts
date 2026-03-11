import { getLevelData, getAllWords, getLevelIcon, Word } from './lessons';

export type ExerciseType = 'multiple-choice' | 'translate' | 'match-pairs';

export interface MultipleChoiceExercise {
  type: 'multiple-choice';
  question: string;
  questionEs: string;
  options: string[];
  correct: number;
  correctAnswer: string;
}

export interface TranslateExercise {
  type: 'translate';
  question: string;
  questionEs: string;
  answer: string;
  answerAlt: string;
  correctAnswer: string;
  hint: string;
}

export interface MatchPairsExercise {
  type: 'match-pairs';
  question: string;
  questionEs: string;
  pairs: { left: string; right: string }[];
}

export type Exercise = MultipleChoiceExercise | TranslateExercise | MatchPairsExercise;

export interface Level {
  id: number;
  title: string;
  topic: string;
  icon: string;
  color: string;
  xp: number;
  exercises: Exercise[];
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateLevel(levelNum: number): Level | null {
  const levelData = getLevelData(levelNum);
  if (!levelData) return null;

  const words = levelData.words;
  const allWords = getAllWords();
  const wrongWords = allWords.filter(
    w => !words.some(lw => lw.word.toLowerCase() === w.word.toLowerCase())
  );
  const shuffledWrong = shuffleArray(wrongWords);
  const shuffled = shuffleArray([...words]);

  const exercises: Exercise[] = [];

  // Ejercicio 1: Opción múltiple — significado
  const w1 = shuffled[0];
  const opts1 = shuffleArray([w1.translation, ...shuffledWrong.slice(0, 3).map(w => w.translation)]);
  exercises.push({
    type: 'multiple-choice',
    question: `What does "${w1.word}" mean?`,
    questionEs: `¿Qué significa "${w1.word}"?`,
    options: opts1,
    correct: opts1.indexOf(w1.translation),
    correctAnswer: w1.translation,
  });

  // Ejercicio 2: Traducción — escribe en inglés
  const w2 = shuffled[1];
  exercises.push({
    type: 'translate',
    question: `How do you say "${w2.translation}" in English?`,
    questionEs: `¿Cómo se dice "${w2.translation}" en inglés?`,
    answer: w2.word.toLowerCase(),
    answerAlt: removeAccents(w2.word.toLowerCase()),
    correctAnswer: w2.word,
    hint: w2.word,
  });

  // Ejercicio 3: Opción múltiple — palabra en inglés
  const w3 = shuffled[2];
  const opts3 = shuffleArray([w3.word, ...shuffledWrong.slice(3, 6).map(w => w.word)]);
  exercises.push({
    type: 'multiple-choice',
    question: `Select the English word for "${w3.translation}"`,
    questionEs: `Selecciona la palabra en inglés para "${w3.translation}"`,
    options: opts3,
    correct: opts3.indexOf(w3.word),
    correctAnswer: w3.word,
  });

  // Ejercicio 4: Traducción
  const w4 = shuffled[3];
  exercises.push({
    type: 'translate',
    question: `What is "${w4.translation}" in English?`,
    questionEs: `¿Qué es "${w4.translation}" en inglés?`,
    answer: w4.word.toLowerCase(),
    answerAlt: removeAccents(w4.word.toLowerCase()),
    correctAnswer: w4.word,
    hint: w4.word,
  });

  // Ejercicio 5: Opción múltiple
  const w5 = shuffled[4];
  const opts5 = shuffleArray([w5.translation, ...shuffledWrong.slice(6, 9).map(w => w.translation)]);
  exercises.push({
    type: 'multiple-choice',
    question: `Choose: "${w5.word}" = ?`,
    questionEs: `Elige: "${w5.word}" = ?`,
    options: opts5,
    correct: opts5.indexOf(w5.translation),
    correctAnswer: w5.translation,
  });

  // Ejercicio 6: Emparejamiento de pares (4 pares)
  const pairWords = shuffled.slice(5, 9);
  exercises.push({
    type: 'match-pairs',
    question: 'Match the words with their translations',
    questionEs: 'Empareja las palabras con sus traducciones',
    pairs: pairWords.map(w => ({ left: w.word, right: w.translation })),
  });

  // Ejercicio 7: Traducción
  const w7 = shuffled[5];
  exercises.push({
    type: 'translate',
    question: `Translate: "${w7.translation}"`,
    questionEs: `Traduce: "${w7.translation}"`,
    answer: w7.word.toLowerCase(),
    answerAlt: removeAccents(w7.word.toLowerCase()),
    correctAnswer: w7.word,
    hint: w7.word,
  });

  // Ejercicio 8: Opción múltiple
  const w8 = shuffled[6];
  const opts8 = shuffleArray([w8.word, ...shuffledWrong.slice(0, 3).map(w => w.word)]);
  exercises.push({
    type: 'multiple-choice',
    question: `What is the English for "${w8.translation}"?`,
    questionEs: `¿Cuál es la palabra en inglés para "${w8.translation}"?`,
    options: opts8,
    correct: opts8.indexOf(w8.word),
    correctAnswer: w8.word,
  });

  // Ejercicio 9: Traducción
  const w9 = shuffled[7];
  exercises.push({
    type: 'translate',
    question: `"${w9.translation}" in English is:`,
    questionEs: `"${w9.translation}" en inglés es:`,
    answer: w9.word.toLowerCase(),
    answerAlt: removeAccents(w9.word.toLowerCase()),
    correctAnswer: w9.word,
    hint: w9.word,
  });

  // Ejercicio 10: Opción múltiple — repaso final
  const w10 = shuffled[8];
  const opts10 = shuffleArray([w10.translation, ...shuffledWrong.slice(3, 6).map(w => w.translation)]);
  exercises.push({
    type: 'multiple-choice',
    question: `Final: Select meaning of "${w10.word}"`,
    questionEs: `Final: Selecciona el significado de "${w10.word}"`,
    options: opts10,
    correct: opts10.indexOf(w10.translation),
    correctAnswer: w10.translation,
  });

  return {
    id: levelNum,
    title: `Nivel ${levelNum}: ${levelData.name}`,
    topic: levelData.name,
    icon: getLevelIcon(levelNum),
    color: levelData.color,
    xp: levelData.xp,
    exercises,
  };
}
