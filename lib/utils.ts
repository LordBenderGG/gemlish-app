import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge.
 * This ensures Tailwind classes are properly merged without conflicts.
 *
 * Usage:
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fisher-Yates shuffle — distribución uniforme, sin sesgo.
 * Fuente única de verdad para todos los modos de práctica.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Normaliza una cadena para comparación de respuestas:
 * minúsculas, sin acentos, sin puntuación, sin espacios extra.
 */
export function normalizeAnswer(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '');
}

/**
 * Calcula la distancia de Levenshtein entre dos strings.
 * Usada para tolerancia a typos en ejercicios de traducción.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

/**
 * Verifica si dos respuestas son equivalentes, permitiendo typos menores.
 * Para respuestas de 5+ caracteres, permite 1 error. Para 8+, permite 2.
 */
export function isAnswerCorrectWithTolerance(userAnswer: string, correctAnswer: string): boolean {
  const a = normalizeAnswer(userAnswer);
  const b = normalizeAnswer(correctAnswer);
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 5) return false; // cortas: exacto
  const allowedDistance = maxLen >= 8 ? 2 : 1;
  return levenshteinDistance(a, b) <= allowedDistance;
}
