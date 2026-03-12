import { getLevelData, getLevelIcon, Word } from './lessons';

export type ExerciseType =
  | 'multiple-choice'
  | 'translate'
  | 'match-pairs'
  | 'listen-write'
  | 'sentence-order'
  | 'fill-blank';

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

export interface ListenWriteExercise {
  type: 'listen-write';
  question: string;
  questionEs: string;
  wordToSpeak: string;
  answer: string;
  answerAlt: string;
  correctAnswer: string;
  hint: string;
}

export interface SentenceOrderExercise {
  type: 'sentence-order';
  question: string;
  questionEs: string;
  words: string[];
  shuffledWords: string[];
  sentence: string;
  sentenceEs: string;
}

export interface FillBlankExercise {
  type: 'fill-blank';
  question: string;
  questionEs: string;
  sentenceBefore: string;
  sentenceAfter: string;
  sentenceEs: string;
  options: string[];
  correct: number;
  correctAnswer: string;
  fullSentence: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | TranslateExercise
  | MatchPairsExercise
  | ListenWriteExercise
  | SentenceOrderExercise
  | FillBlankExercise;

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

/**
 * Obtiene 3 palabras incorrectas del MISMO nivel para usar como distractores.
 * Garantiza que las opciones incorrectas son palabras que el usuario ya vio en este nivel.
 */
function getWrongWords(correctWord: Word, levelWords: Word[]): Word[] {
  const others = levelWords.filter(w => w.word.toLowerCase() !== correctWord.word.toLowerCase());
  return shuffleArray(others).slice(0, 3);
}

/**
 * Genera un ejercicio de ordenar oración.
 * Para niveles bajos (1-5) usa oraciones muy simples de 3-4 palabras.
 * Para niveles altos usa el ejemplo completo de la palabra.
 */
function buildSentenceOrderExercise(word: Word, levelNum: number): SentenceOrderExercise {
  let sentence: string;
  let sentenceEs: string;

  if (levelNum <= 5) {
    // Usar directamente el ejemplo de la palabra (siempre gramaticalmente correcto)
    // en lugar de plantillas genéricas que pueden ser incorrectas (ej: "This is Hi")
    const raw = word.example.replace(/[.,!?;:]$/, '');
    const wordCount = raw.split(' ').length;
    if (wordCount <= 6) {
      sentence = raw;
      sentenceEs = word.exampleEs.replace(/[.,!?;:]$/, '');
    } else {
      // Recortar a las primeras 5 palabras si es muy larga
      sentence = raw.split(' ').slice(0, 5).join(' ');
      sentenceEs = word.exampleEs;
    }
  } else if (levelNum <= 15) {
    // Oraciones cortas del ejemplo, sin puntuación
    const raw = word.example.replace(/[.,!?;:]$/, '');
    const wordCount = raw.split(' ').length;
    if (wordCount <= 6) {
      sentence = raw;
      sentenceEs = word.exampleEs;
    } else {
      // Recortar a las primeras 5 palabras si es muy larga
      sentence = raw.split(' ').slice(0, 5).join(' ');
      sentenceEs = word.exampleEs;
    }
  } else {
    // Niveles avanzados: ejemplo completo
    sentence = word.example.replace(/[.,!?;:]$/, '');
    sentenceEs = word.exampleEs;
  }

  const words = sentence.split(' ').filter(w => w.length > 0);
  const shuffledWords = shuffleArray([...words]);

  return {
    type: 'sentence-order',
    question: 'Ordena las palabras para formar una oración:',
    questionEs: 'Ordena las palabras para formar la oración en inglés:',
    words,
    shuffledWords,
    sentence,
    sentenceEs,
  };
}

/**
 * Genera un ejercicio fill-blank con dificultad adaptada al nivel.
 * IMPORTANTE: las opciones incorrectas son siempre palabras del mismo nivel.
 */
function buildFillBlankExercise(
  word: Word,
  levelWords: Word[],
  levelNum: number
): FillBlankExercise {
  let sentence: string;
  let sentenceEs: string;

  if (levelNum <= 5) {
    // Usar directamente el ejemplo de la palabra (siempre gramaticalmente correcto)
    sentence = word.example.replace(/[.,!?;:]$/, '');
    sentenceEs = word.exampleEs;
  } else if (levelNum <= 15) {
    // Usar el ejemplo de la palabra directamente
    sentence = word.example.replace(/[.,!?;:]$/, '');
    sentenceEs = word.exampleEs;
  } else {
    sentence = word.example.replace(/[.,!?;:]$/, '');
    sentenceEs = word.exampleEs;
  }

  const regex = new RegExp(`\\b${word.word}\\b`, 'i');
  const match = sentence.match(regex);

  let sentenceBefore = '';
  let sentenceAfter = '';

  if (match && match.index !== undefined) {
    sentenceBefore = sentence.substring(0, match.index);
    sentenceAfter = sentence.substring(match.index + match[0].length);
  } else {
    sentenceBefore = sentence + ' ';
    sentenceAfter = '';
  }

  // Opciones incorrectas: SOLO palabras del mismo nivel
  const wrongWords = getWrongWords(word, levelWords);
  const wrongOptions = wrongWords.map(w => w.word);

  const allOptions = shuffleArray([word.word, ...wrongOptions]);
  const correctIdx = allOptions.indexOf(word.word);

  return {
    type: 'fill-blank',
    question: 'Completa la oración:',
    questionEs: 'Elige la palabra correcta para completar la oración:',
    sentenceBefore: sentenceBefore.trim(),
    sentenceAfter: sentenceAfter.trim(),
    sentenceEs,
    options: allOptions,
    correct: correctIdx,
    correctAnswer: word.word,
    fullSentence: sentence,
  };
}

/**
 * Genera un ejercicio multiple-choice con opciones del mismo nivel.
 * Garantiza que las opciones incorrectas son palabras que el usuario ya conoce de este nivel.
 */
function buildMultipleChoice(
  word: Word,
  levelWords: Word[],
  mode: 'meaning' | 'english'
): MultipleChoiceExercise {
  const wrongWords = getWrongWords(word, levelWords);

  if (mode === 'meaning') {
    // Pregunta: ¿Qué significa "word"? → opciones en español
    const opts = shuffleArray([word.translation, ...wrongWords.map(w => w.translation)]);
    return {
      type: 'multiple-choice',
      question: `What does "${word.word}" mean?`,
      questionEs: `¿Qué significa "${word.word}"?`,
      options: opts,
      correct: opts.indexOf(word.translation),
      correctAnswer: word.translation,
    };
  } else {
    // Pregunta: ¿Cómo se dice "traducción"? → opciones en inglés
    const opts = shuffleArray([word.word, ...wrongWords.map(w => w.word)]);
    return {
      type: 'multiple-choice',
      question: `Select the English word for "${word.translation}"`,
      questionEs: `Selecciona la palabra en inglés para "${word.translation}"`,
      options: opts,
      correct: opts.indexOf(word.word),
      correctAnswer: word.word,
    };
  }
}

export function generateLevel(levelNum: number): Level | null {
  const levelData = getLevelData(levelNum);
  if (!levelData) return null;

  const words = levelData.words;

  // Necesitamos al menos 10 palabras para generar 20 ejercicios variados
  if (words.length < 4) return null;

  const shuffled = shuffleArray([...words]);
  const exercises: Exercise[] = [];

  // ── BLOQUE 1: Ejercicios 1-10 ─────────────────────────────────────────────

  // 1: Opción múltiple — significado (¿qué significa X?)
  exercises.push(buildMultipleChoice(shuffled[0], words, 'meaning'));

  // 2: Traducción — escribe en inglés
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

  // 3: Opción múltiple — palabra en inglés
  exercises.push(buildMultipleChoice(shuffled[2], words, 'english'));

  // 4: Traducción
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

  // 5: Opción múltiple — significado
  exercises.push(buildMultipleChoice(shuffled[4 % words.length], words, 'meaning'));

  // 6: Emparejamiento de pares (4 pares del nivel)
  const pairWords = shuffled.slice(0, Math.min(4, words.length));
  exercises.push({
    type: 'match-pairs',
    question: 'Match the words with their translations',
    questionEs: 'Empareja las palabras con sus traducciones',
    pairs: pairWords.map(w => ({ left: w.word, right: w.translation })),
  });

  // 7: Traducción
  const w7 = shuffled[5 % words.length];
  exercises.push({
    type: 'translate',
    question: `Translate: "${w7.translation}"`,
    questionEs: `Traduce: "${w7.translation}"`,
    answer: w7.word.toLowerCase(),
    answerAlt: removeAccents(w7.word.toLowerCase()),
    correctAnswer: w7.word,
    hint: w7.word,
  });

  // 8: Opción múltiple — inglés
  exercises.push(buildMultipleChoice(shuffled[6 % words.length], words, 'english'));

  // 9: Traducción
  const w9 = shuffled[7 % words.length];
  exercises.push({
    type: 'translate',
    question: `"${w9.translation}" in English is:`,
    questionEs: `"${w9.translation}" en inglés es:`,
    answer: w9.word.toLowerCase(),
    answerAlt: removeAccents(w9.word.toLowerCase()),
    correctAnswer: w9.word,
    hint: w9.word,
  });

  // 10: Escucha y escribe
  const w10 = shuffled[8 % words.length];
  exercises.push({
    type: 'listen-write',
    question: 'Listen and write the word you hear',
    questionEs: 'Escucha y escribe la palabra que oyes',
    wordToSpeak: w10.word,
    answer: w10.word.toLowerCase(),
    answerAlt: removeAccents(w10.word.toLowerCase()),
    correctAnswer: w10.word,
    hint: w10.word,
  });

  // ── BLOQUE 2: Ejercicios 11-20 ────────────────────────────────────────────

  // 11: Opción múltiple — repaso
  exercises.push(buildMultipleChoice(shuffled[9 % words.length], words, 'meaning'));

  // 12: Ordenar oración (con dificultad según nivel)
  exercises.push(buildSentenceOrderExercise(shuffled[1 % words.length], levelNum));

  // 13: Completar la oración (con opciones del mismo nivel)
  exercises.push(buildFillBlankExercise(shuffled[2 % words.length], words, levelNum));

  // 14: Escucha y escribe
  const w14 = shuffled[3 % words.length];
  exercises.push({
    type: 'listen-write',
    question: 'Listen and write what you hear',
    questionEs: 'Escucha y escribe lo que oyes',
    wordToSpeak: w14.word,
    answer: w14.word.toLowerCase(),
    answerAlt: removeAccents(w14.word.toLowerCase()),
    correctAnswer: w14.word,
    hint: w14.word,
  });

  // 15: Ordenar oración
  exercises.push(buildSentenceOrderExercise(shuffled[4 % words.length], levelNum));

  // 16: Completar la oración
  exercises.push(buildFillBlankExercise(shuffled[5 % words.length], words, levelNum));

  // 17: Traducción
  const w17 = shuffled[6 % words.length];
  exercises.push({
    type: 'translate',
    question: `Write in English: "${w17.translation}"`,
    questionEs: `Escribe en inglés: "${w17.translation}"`,
    answer: w17.word.toLowerCase(),
    answerAlt: removeAccents(w17.word.toLowerCase()),
    correctAnswer: w17.word,
    hint: w17.word,
  });

  // 18: Ordenar oración
  exercises.push(buildSentenceOrderExercise(shuffled[7 % words.length], levelNum));

  // 19: Completar la oración
  exercises.push(buildFillBlankExercise(shuffled[8 % words.length], words, levelNum));

  // 20: Emparejamiento final (repaso de todo el nivel)
  const finalPairWords = shuffled.slice(0, Math.min(4, words.length));
  exercises.push({
    type: 'match-pairs',
    question: 'Final review: match all pairs',
    questionEs: 'Repaso final: empareja todos los pares',
    pairs: finalPairWords.map(w => ({ left: w.word, right: w.translation })),
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
