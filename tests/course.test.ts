import { describe, it, expect } from 'vitest';
import { LESSONS, getLevelData, getDailyWords, getAllWords, getLevelIcon } from '../data/lessons';
import { generateLevel } from '../data/exerciseGenerator';

describe('Datos del Curso', () => {
  it('debe tener 30 lecciones', () => {
    expect(LESSONS.length).toBe(30);
  });

  it('cada lección debe tener exactamente 10 palabras', () => {
    LESSONS.forEach(lesson => {
      expect(lesson.words.length).toBe(10);
    });
  });

  it('debe retornar datos para el nivel 1', () => {
    const data = getLevelData(1);
    expect(data).toBeDefined();
    expect(data.name).toBe('Saludos');
  });

  it('debe retornar datos para el nivel 500', () => {
    const data = getLevelData(500);
    expect(data).toBeDefined();
    expect(data.name).toBeTruthy();
  });

  it('debe retornar 30 palabras diarias', () => {
    const words = getDailyWords();
    expect(words.length).toBe(30);
  });

  it('debe retornar todas las palabras (300 en total)', () => {
    const words = getAllWords();
    expect(words.length).toBe(300);
  });

  it('debe retornar un ícono para cada nivel', () => {
    for (let i = 1; i <= 10; i++) {
      const icon = getLevelIcon(i);
      expect(icon).toBeTruthy();
    }
  });
});

describe('Generador de Ejercicios', () => {
  it('debe generar un nivel con 10 ejercicios', () => {
    const level = generateLevel(1);
    expect(level).not.toBeNull();
    expect(level!.exercises.length).toBe(10);
  });

  it('debe generar ejercicios de los 3 tipos', () => {
    const level = generateLevel(1);
    const types = level!.exercises.map(e => e.type);
    expect(types).toContain('multiple-choice');
    expect(types).toContain('translate');
    expect(types).toContain('match-pairs');
  });

  it('debe generar el nivel 500 correctamente', () => {
    const level = generateLevel(500);
    expect(level).not.toBeNull();
    expect(level!.id).toBe(500);
    expect(level!.exercises.length).toBe(10);
  });

  it('los ejercicios de opción múltiple deben tener 4 opciones', () => {
    const level = generateLevel(1);
    const mc = level!.exercises.filter(e => e.type === 'multiple-choice');
    mc.forEach(ex => {
      expect((ex as any).options.length).toBe(4);
    });
  });
});
