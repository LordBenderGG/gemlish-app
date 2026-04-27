import { describe, it, expect } from 'vitest';
import { normalizeAnswer, levenshteinDistance, isAnswerCorrectWithTolerance } from '../lib/utils';

describe('utils.ts', () => {
  describe('normalizeAnswer', () => {
    it('should convert to lowercase', () => {
      expect(normalizeAnswer('HELLO')).toBe('hello');
      expect(normalizeAnswer('HeLLo')).toBe('hello');
    });

    it('should remove accents', () => {
      expect(normalizeAnswer('café')).toBe('cafe');
      expect(normalizeAnswer('naïve')).toBe('naive');
      expect(normalizeAnswer('résumé')).toBe('resume');
      expect(normalizeAnswer('señor')).toBe('senor');
    });

    it('should remove extra spaces', () => {
      expect(normalizeAnswer('  hello  ')).toBe('hello');
      expect(normalizeAnswer('hello   world')).toBe('hello world');
      expect(normalizeAnswer('\thello\n')).toBe('hello');
    });

    it('should remove punctuation', () => {
      expect(normalizeAnswer('hello!')).toBe('hello');
      expect(normalizeAnswer('hello?')).toBe('hello');
      expect(normalizeAnswer('hello.')).toBe('hello');
      expect(normalizeAnswer('hello,')).toBe('hello');
      expect(normalizeAnswer("it's")).toBe('its');
      expect(normalizeAnswer('test-word')).toBe('testword');
    });

    it('should handle mixed case with accents and punctuation', () => {
      expect(normalizeAnswer('CAFÉ!')).toBe('cafe');
      expect(normalizeAnswer('Señor?')).toBe('senor');
    });

    it('should keep numbers', () => {
      expect(normalizeAnswer('test123')).toBe('test123');
      expect(normalizeAnswer('123')).toBe('123');
    });

    it('should handle empty string', () => {
      expect(normalizeAnswer('')).toBe('');
    });
  });

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
      expect(levenshteinDistance('test', 'test')).toBe(0);
    });

    it('should return correct distance for empty strings', () => {
      expect(levenshteinDistance('', 'abc')).toBe(3);
      expect(levenshteinDistance('abc', '')).toBe(3);
    });

    it('should return length of longer string when shorter is empty', () => {
      expect(levenshteinDistance('a', '')).toBe(1);
      expect(levenshteinDistance('', 'abc')).toBe(3);
    });

    it('should calculate distance for single character difference', () => {
      expect(levenshteinDistance('cat', 'bat')).toBe(1);
      expect(levenshteinDistance('cat', 'car')).toBe(1);
    });

    it('should calculate distance for substitution', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    it('should calculate distance for insertion', () => {
      expect(levenshteinDistance('cat', 'cats')).toBe(1);
      expect(levenshteinDistance('hello', 'helo')).toBe(1);
    });

    it('should calculate distance for deletion', () => {
      expect(levenshteinDistance('cats', 'cat')).toBe(1);
      expect(levenshteinDistance('helo', 'hello')).toBe(1);
    });

    it('should be case-sensitive', () => {
      expect(levenshteinDistance('Hello', 'hello')).toBe(1);
    });

    it('should handle transposition', () => {
      expect(levenshteinDistance('horse', 'hourse')).toBe(1);
    });

    it('should be symmetric', () => {
      expect(levenshteinDistance('abc', 'def')).toBe(levenshteinDistance('def', 'abc'));
    });
  });

  describe('isAnswerCorrectWithTolerance', () => {
    it('should return true for exact matches', () => {
      expect(isAnswerCorrectWithTolerance('hello', 'hello')).toBe(true);
      expect(isAnswerCorrectWithTolerance('world', 'world')).toBe(true);
    });

    it('should return true for case-insensitive matches', () => {
      expect(isAnswerCorrectWithTolerance('HELLO', 'hello')).toBe(true);
      expect(isAnswerCorrectWithTolerance('HeLLo', 'hello')).toBe(true);
    });

    it('should return true for matches with accents removed', () => {
      expect(isAnswerCorrectWithTolerance('café', 'cafe')).toBe(true);
      expect(isAnswerCorrectWithTolerance('naïve', 'naive')).toBe(true);
    });

    it('should return true for matches with punctuation removed', () => {
      expect(isAnswerCorrectWithTolerance('hello!', 'hello')).toBe(true);
      expect(isAnswerCorrectWithTolerance('hello?', 'hello')).toBe(true);
      expect(isAnswerCorrectWithTolerance("it's", 'its')).toBe(true);
    });

    it('should return false for short strings with typos (< 5 chars)', () => {
      expect(isAnswerCorrectWithTolerance('teh', 'the')).toBe(false);
      expect(isAnswerCorrectWithTolerance('at', 'cat')).toBe(false);
      expect(isAnswerCorrectWithTolerance('cat', 'car')).toBe(false);
    });

    it('should return true for medium strings (5+ chars) with 1 typo', () => {
      expect(isAnswerCorrectWithTolerance('hourse', 'horse')).toBe(true);
      expect(isAnswerCorrectWithTolerance('wrld', 'world')).toBe(false); // 2 typos
    });

    it('should return true for long strings (8+ chars) with up to 2 typos', () => {
      expect(isAnswerCorrectWithTolerance('elephante', 'elephant')).toBe(true);
      expect(isAnswerCorrectWithTolerance('computre', 'computer')).toBe(true);
      expect(isAnswerCorrectWithTolerance('computter', 'computer')).toBe(true);
    });

    it('should return false when typos exceed tolerance', () => {
      expect(isAnswerCorrectWithTolerance('xyz', 'abc')).toBe(false);
      expect(isAnswerCorrectWithTolerance('hello', 'world')).toBe(false);
    });

    it('should normalize before comparison', () => {
      expect(isAnswerCorrectWithTolerance('HOURSE', 'horse')).toBe(true);
      expect(isAnswerCorrectWithTolerance('HOURSE!', 'horse')).toBe(true);
      expect(isAnswerCorrectWithTolerance('  hourse  ', 'horse')).toBe(true);
    });

    it('should handle exact match with extra spaces and punctuation', () => {
      expect(isAnswerCorrectWithTolerance('  hello!  ', 'hello')).toBe(true);
      expect(isAnswerCorrectWithTolerance('hello,world', 'hello world')).toBe(true);
    });

    it('should reject answers that are too different', () => {
      expect(isAnswerCorrectWithTolerance('beautiful', 'ugly')).toBe(false);
      expect(isAnswerCorrectWithTolerance('start', 'end')).toBe(false);
    });

    it('should handle single character strings', () => {
      expect(isAnswerCorrectWithTolerance('a', 'a')).toBe(true);
      expect(isAnswerCorrectWithTolerance('a', 'b')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isAnswerCorrectWithTolerance('', '')).toBe(true);
      expect(isAnswerCorrectWithTolerance('', 'test')).toBe(false);
      expect(isAnswerCorrectWithTolerance('test', '')).toBe(false);
    });

    it('threshold test: 5-char word with 1 typo allowed', () => {
      expect(isAnswerCorrectWithTolerance('helo', 'hello')).toBe(true); // distance 1
      expect(isAnswerCorrectWithTolerance('hellx', 'hello')).toBe(true); // distance 1
    });

    it('threshold test: 8-char word with 2 typos allowed', () => {
      expect(isAnswerCorrectWithTolerance('computre', 'computer')).toBe(true); // distance 1
      expect(isAnswerCorrectWithTolerance('cmputer', 'computer')).toBe(true); // distance 2
    });
  });
});
