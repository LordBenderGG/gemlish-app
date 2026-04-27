import { describe, it, expect, vi } from 'vitest';
import { generateLevel } from '../data/exerciseGenerator';
import type { Word } from '../data/lessons';

// Mock the lessons module
vi.mock('../data/lessons', () => ({
  getLevelData: (levelNum: number) => {
    // Return minimal mock data for testing
    const mockWords: Word[] = [
      {
        word: 'hello',
        translation: 'hola',
        pronunciation: 'huh-LO',
        example: 'Hello, how are you?',
        exampleEs: 'Hola, ¿cómo estás?',
      },
      {
        word: 'world',
        translation: 'mundo',
        pronunciation: 'WORLD',
        example: 'Welcome to the world.',
        exampleEs: 'Bienvenido al mundo.',
      },
      {
        word: "it's",
        translation: 'es',
        pronunciation: 'ITS',
        example: "It's a beautiful day!",
        exampleEs: 'Es un día hermoso!',
      },
      {
        word: 'what',
        translation: 'qué',
        pronunciation: 'WHUT',
        example: 'What is this?',
        exampleEs: '¿Qué es esto?',
      },
      {
        word: 'good',
        translation: 'bueno',
        pronunciation: 'GOOD',
        example: 'This is good.',
        exampleEs: 'Esto es bueno.',
      },
      {
        word: 'test',
        translation: 'prueba',
        pronunciation: 'TEST',
        example: 'This is a test sentence.',
        exampleEs: 'Esta es una oración de prueba.',
      },
      {
        word: 'apple',
        translation: 'manzana',
        pronunciation: 'AP-ul',
        example: 'I eat an apple every day.',
        exampleEs: 'Como una manzana cada día.',
      },
      {
        word: 'book',
        translation: 'libro',
        pronunciation: 'BOOK',
        example: 'I am reading a book.',
        exampleEs: 'Estoy leyendo un libro.',
      },
      {
        word: 'computer',
        translation: 'computadora',
        pronunciation: 'kum-PYOO-tur',
        example: 'The computer is fast.',
        exampleEs: 'La computadora es rápida.',
      },
      {
        word: 'discount',
        translation: 'descuento',
        pronunciation: 'DIS-kount',
        example: 'We have a discount today.',
        exampleEs: 'Tenemos un descuento hoy.',
      },
    ];

    if (levelNum >= 1 && levelNum <= 500) {
      return {
        name: `Level ${levelNum}`,
        words: mockWords,
        color: '#4F46E5',
        xp: 100,
      };
    }
    return null;
  },
  getLevelIcon: (levelNum: number) => '📚',
}));

describe('exerciseGenerator.ts', () => {
  describe('generateLevel - Fill-blank robustness with special characters', () => {
    it('should generate level with special characters (apostrophes like "it\'s")', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();
      expect(level!.exercises.length).toBe(20);
    });

    it('should generate fill-blank exercises correctly', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const fillBlankExercises = level!.exercises.filter(e => e.type === 'fill-blank');
      expect(fillBlankExercises.length).toBe(3);
    });

    it('fill-blank exercises should not have blank word in sentenceBefore', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const fillBlankExercises = level!.exercises.filter(e => e.type === 'fill-blank');
      fillBlankExercises.forEach(ex => {
        const fb = ex as any;
        const correctAnswerLower = fb.correctAnswer.toLowerCase();

        expect(fb.sentenceBefore.toLowerCase()).not.toContain(correctAnswerLower);
      });
    });

    it('fill-blank exercises should not have blank word in sentenceAfter', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const fillBlankExercises = level!.exercises.filter(e => e.type === 'fill-blank');
      fillBlankExercises.forEach(ex => {
        const fb = ex as any;
        const correctAnswerLower = fb.correctAnswer.toLowerCase();

        expect(fb.sentenceAfter.toLowerCase()).not.toContain(correctAnswerLower);
      });
    });

    it('fill-blank exercises should have exactly 4 options', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const fillBlankExercises = level!.exercises.filter(e => e.type === 'fill-blank');
      fillBlankExercises.forEach(ex => {
        const fb = ex as any;
        expect(fb.options.length).toBe(4);
      });
    });

    it('correct answer should be in the options', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const fillBlankExercises = level!.exercises.filter(e => e.type === 'fill-blank');
      fillBlankExercises.forEach(ex => {
        const fb = ex as any;
        expect(fb.options).toContain(fb.correctAnswer);
        expect(fb.options[fb.correct]).toBe(fb.correctAnswer);
      });
    });
  });

  describe('generateLevel - Returns correct number of exercises', () => {
    it('should generate exactly 20 exercises per level', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();
      expect(level!.exercises.length).toBe(20);
    });

    it('should generate for low levels (1-5)', () => {
      const level = generateLevel(3);
      expect(level).not.toBeNull();
      expect(level!.exercises.length).toBe(20);
    });

    it('should generate for mid levels (6-15)', () => {
      const level = generateLevel(10);
      expect(level).not.toBeNull();
      expect(level!.exercises.length).toBe(20);
    });

    it('should generate for high levels (16+)', () => {
      const level = generateLevel(50);
      expect(level).not.toBeNull();
      expect(level!.exercises.length).toBe(20);
    });

    it('should return null for invalid level', () => {
      const level = generateLevel(501);
      expect(level).toBeNull();
    });
  });

  describe('generateLevel - Exercise type distribution', () => {
    it('should generate all exercise types', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const types = new Set(level!.exercises.map(e => e.type));
      expect(types).toContain('multiple-choice');
      expect(types).toContain('translate');
      expect(types).toContain('fill-blank');
      expect(types).toContain('match-pairs');
      expect(types).toContain('listen-write');
      expect(types).toContain('sentence-order');
    });

    it('should have correct number of multiple-choice exercises', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const multipleChoice = level!.exercises.filter(e => e.type === 'multiple-choice');
      expect(multipleChoice.length).toBeGreaterThanOrEqual(2);
    });

    it('should have correct number of translate exercises', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const translate = level!.exercises.filter(e => e.type === 'translate');
      expect(translate.length).toBeGreaterThanOrEqual(3);
    });

    it('should have exactly 3 fill-blank exercises', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const fillBlank = level!.exercises.filter(e => e.type === 'fill-blank');
      expect(fillBlank.length).toBe(3);
    });

    it('should have exactly 2 match-pairs exercises', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const matchPairs = level!.exercises.filter(e => e.type === 'match-pairs');
      expect(matchPairs.length).toBe(2);
    });

    it('should have correct number of listen-write exercises', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const listenWrite = level!.exercises.filter(e => e.type === 'listen-write');
      expect(listenWrite.length).toBeGreaterThanOrEqual(2);
    });

    it('should have exactly 3 sentence-order exercises', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const sentenceOrder = level!.exercises.filter(e => e.type === 'sentence-order');
      expect(sentenceOrder.length).toBe(3);
    });
  });

  describe('generateLevel - Exercise structure validation', () => {
    it('all exercises should have type, question, questionEs', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      level!.exercises.forEach(exercise => {
        expect(exercise).toHaveProperty('type');
        expect(exercise).toHaveProperty('question');
        expect(exercise).toHaveProperty('questionEs');
        expect(['multiple-choice', 'translate', 'fill-blank', 'match-pairs', 'listen-write', 'sentence-order']).toContain(exercise.type);
      });
    });

    it('multiple-choice exercises should have valid structure', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const multipleChoiceExercises = level!.exercises.filter(e => e.type === 'multiple-choice');
      multipleChoiceExercises.forEach(ex => {
        const mc = ex as any;
        expect(mc.options).toBeDefined();
        expect(Array.isArray(mc.options)).toBe(true);
        expect(mc.options.length).toBe(4);
        expect(mc.correct).toBeDefined();
        expect(typeof mc.correct).toBe('number');
        expect(mc.correctAnswer).toBeDefined();
        expect(mc.options[mc.correct]).toBe(mc.correctAnswer);
      });
    });

    it('translate exercises should have answer field', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const translateExercises = level!.exercises.filter(e => e.type === 'translate');
      translateExercises.forEach(ex => {
        const tr = ex as any;
        expect(tr.answer).toBeDefined();
        expect(tr.correctAnswer).toBeDefined();
        expect(tr.hint).toBeDefined();
      });
    });

    it('match-pairs exercises should have pairs', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const matchPairExercises = level!.exercises.filter(e => e.type === 'match-pairs');
      matchPairExercises.forEach(ex => {
        const mp = ex as any;
        expect(mp.pairs).toBeDefined();
        expect(Array.isArray(mp.pairs)).toBe(true);
        expect(mp.pairs.length).toBeGreaterThan(0);
        mp.pairs.forEach((pair: any) => {
          expect(pair.left).toBeDefined();
          expect(pair.right).toBeDefined();
        });
      });
    });

    it('sentence-order exercises should have shuffled words', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const sentenceOrderExercises = level!.exercises.filter(e => e.type === 'sentence-order');
      sentenceOrderExercises.forEach(ex => {
        const so = ex as any;
        expect(so.words).toBeDefined();
        expect(so.shuffledWords).toBeDefined();
        expect(Array.isArray(so.words)).toBe(true);
        expect(Array.isArray(so.shuffledWords)).toBe(true);
        expect(so.words.length).toBeGreaterThan(0);
        expect(so.shuffledWords.length).toBe(so.words.length);
      });
    });

    it('listen-write exercises should have wordToSpeak', () => {
      const level = generateLevel(1);
      expect(level).not.toBeNull();

      const listenWriteExercises = level!.exercises.filter(e => e.type === 'listen-write');
      listenWriteExercises.forEach(ex => {
        const lw = ex as any;
        expect(lw.wordToSpeak).toBeDefined();
        expect(lw.answer).toBeDefined();
        expect(lw.correctAnswer).toBeDefined();
      });
    });
  });
});
