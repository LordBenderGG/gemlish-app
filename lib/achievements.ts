import { kvGetJson, kvSetJson } from './local-kv';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: 'levels' | 'streak' | 'words' | 'gems' | 'game' | 'practice';
  gems: number; // Gemas que se entregan al desbloquear este logro
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  levelsCompleted: number;
  streak: number;
  totalWordsLearned: number;
  gems: number;
  xp: number;
  totalDaysCompleted: number;
  practiceSessionsCompleted: number;
  // Campos opcionales para logros de velocidad y desafíos
  bestLevelTime?: number;
  dailyChallengesCompleted?: number;
  challengeStreak?: number;
}

// ─── Definición de todos los logros ─────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // Niveles
  { id: 'first_level', emoji: '🎯', title: 'Primer Paso', description: 'Completa tu primer nivel', gems: 25, check: s => s.levelsCompleted >= 1, category: 'levels' },
  { id: 'levels_10', emoji: '🔟', title: 'Diez Niveles', description: 'Completa 10 niveles', gems: 25, check: s => s.levelsCompleted >= 10, category: 'levels' },
  { id: 'levels_25', emoji: '🌟', title: 'Cuarto de Siglo', description: 'Completa 25 niveles', gems: 50, check: s => s.levelsCompleted >= 25, category: 'levels' },
  { id: 'levels_50', emoji: '🏅', title: 'Medio Camino', description: 'Completa 50 niveles', gems: 50, check: s => s.levelsCompleted >= 50, category: 'levels' },
  { id: 'levels_100', emoji: '💯', title: 'Centurión', description: 'Completa 100 niveles', gems: 100, check: s => s.levelsCompleted >= 100, category: 'levels' },
  { id: 'levels_250', emoji: '🥇', title: 'Experto', description: 'Completa 250 niveles', gems: 150, check: s => s.levelsCompleted >= 250, category: 'levels' },
  { id: 'levels_500', emoji: '👑', title: 'Maestro del Inglés', description: '¡Completa los 500 niveles!', gems: 200, check: s => s.levelsCompleted >= 500, category: 'levels' },
  // Racha
  { id: 'streak_3', emoji: '🔥', title: 'En Racha', description: '3 días seguidos estudiando', gems: 25, check: s => s.streak >= 3, category: 'streak' },
  { id: 'streak_7', emoji: '🔥🔥', title: 'Semana Perfecta', description: '7 días de racha', gems: 50, check: s => s.streak >= 7, category: 'streak' },
  { id: 'streak_30', emoji: '🌙', title: 'Mes de Estudio', description: '30 días de racha', gems: 75, check: s => s.streak >= 30, category: 'streak' },
  { id: 'streak_60', emoji: '🌟', title: 'Dos Meses', description: '60 días de racha', gems: 100, check: s => s.streak >= 60, category: 'streak' },
  { id: 'streak_100', emoji: '⚡', title: 'Imparable', description: '100 días de racha', gems: 150, check: s => s.streak >= 100, category: 'streak' },
  // Palabras
  { id: 'words_10', emoji: '📖', title: 'Primeras Palabras', description: 'Aprende 10 palabras en tarea diaria', gems: 25, check: s => s.totalWordsLearned >= 10, category: 'words' },
  { id: 'words_50', emoji: '📚', title: 'Vocabulario Básico', description: 'Aprende 50 palabras', gems: 50, check: s => s.totalWordsLearned >= 50, category: 'words' },
  { id: 'words_100', emoji: '🧠', title: 'Mente Brillante', description: 'Aprende 100 palabras', gems: 75, check: s => s.totalWordsLearned >= 100, category: 'words' },
  { id: 'words_300', emoji: '📜', title: 'Políglota', description: 'Aprende 300 palabras', gems: 100, check: s => s.totalWordsLearned >= 300, category: 'words' },
  // Gemas — no dan gemas (no tiene sentido darte gemas por tener gemas)
  { id: 'gems_50', emoji: '💎', title: 'Coleccionista', description: 'Acumula 50 💎', gems: 0, check: s => s.gems >= 50, category: 'gems' },
  { id: 'gems_100', emoji: '💎💎', title: 'Tesoro', description: 'Acumula 100 💎', gems: 0, check: s => s.gems >= 100, category: 'gems' },
  { id: 'gems_500', emoji: '💰', title: 'Rico en Conocimiento', description: 'Acumula 500 💎', gems: 0, check: s => s.gems >= 500, category: 'gems' },
  // XP
  { id: 'xp_100', emoji: '⭐', title: 'Primer XP', description: 'Gana 100 XP', gems: 25, check: s => s.xp >= 100, category: 'game' },
  { id: 'xp_500', emoji: '🌠', title: 'Estrella en Ascenso', description: 'Gana 500 XP', gems: 50, check: s => s.xp >= 500, category: 'game' },
  { id: 'xp_1000', emoji: '🚀', title: 'Despegue', description: 'Gana 1,000 XP', gems: 75, check: s => s.xp >= 1000, category: 'game' },
  { id: 'xp_5000', emoji: '🌌', title: 'Leyenda', description: 'Gana 5,000 XP', gems: 100, check: s => s.xp >= 5000, category: 'game' },
  // Tarea diaria
  { id: 'daily_1', emoji: '✅', title: 'Primer Día', description: 'Completa la tarea diaria 1 vez', gems: 25, check: s => s.totalDaysCompleted >= 1, category: 'words' },
  { id: 'daily_7', emoji: '🗓️', title: 'Semana Completa', description: 'Completa la tarea diaria 7 veces', gems: 50, check: s => s.totalDaysCompleted >= 7, category: 'words' },
  { id: 'daily_30', emoji: '📅', title: 'Mes de Palabras', description: 'Completa la tarea diaria 30 veces', gems: 100, check: s => s.totalDaysCompleted >= 30, category: 'words' },
  // Práctica
  { id: 'practice_1', emoji: '🎯', title: 'Primera Práctica', description: 'Completa tu primera sesión de palabras difíciles', gems: 25, check: s => s.practiceSessionsCompleted >= 1, category: 'practice' },
  { id: 'practice_5', emoji: '💪', title: 'Perseverante', description: 'Completa 5 sesiones de práctica', gems: 50, check: s => s.practiceSessionsCompleted >= 5, category: 'practice' },
  { id: 'practice_20', emoji: '🏋️', title: 'Atleta del Vocabulario', description: 'Completa 20 sesiones de práctica', gems: 75, check: s => s.practiceSessionsCompleted >= 20, category: 'practice' },
  // Velocidad
  { id: 'speed_60', emoji: '⚡', title: 'Rayo', description: 'Completa un nivel en menos de 60 segundos', gems: 50, check: s => s.bestLevelTime !== undefined && s.bestLevelTime <= 60000, category: 'game' },
  { id: 'speed_120', emoji: '💨', title: 'Veloz', description: 'Completa un nivel en menos de 2 minutos', gems: 25, check: s => s.bestLevelTime !== undefined && s.bestLevelTime <= 120000, category: 'game' },
  // Desafíos
  { id: 'challenge_1', emoji: '🏆', title: 'Primer Desafío', description: 'Completa tu primer desafío del día', gems: 25, check: s => (s.dailyChallengesCompleted ?? 0) >= 1, category: 'game' },
  { id: 'challenge_7', emoji: '🔥🏆', title: 'Semana de Desafíos', description: '7 desafíos del día completados', gems: 50, check: s => (s.dailyChallengesCompleted ?? 0) >= 7, category: 'game' },
  { id: 'challenge_streak_7', emoji: '🏆🔥', title: 'Racha de Campeón', description: '7 desafíos del día consecutivos', gems: 75, check: s => (s.challengeStreak ?? 0) >= 7, category: 'game' },
  { id: 'challenge_streak_30', emoji: '🏆🌟', title: 'Leyenda del Desafío', description: '30 desafíos del día consecutivos', gems: 100, check: s => (s.challengeStreak ?? 0) >= 30, category: 'game' },
];

// ─── Persistencia de logros desbloqueados ────────────────────────────────────

const KEY = (username: string) => `gemlish_achievements_${username}`;
const DATES_KEY = (username: string) => `gemlish_achievement_dates_${username}`;

// Prevent concurrent execution of checkNewAchievements
let isCheckingAchievements = false;

export async function getUnlockedAchievements(username: string): Promise<Set<string>> {
  const ids = await kvGetJson<string[]>(KEY(username), []);
  return new Set(ids);
}

export async function saveUnlockedAchievements(username: string, ids: Set<string>): Promise<void> {
  await kvSetJson(KEY(username), [...ids]);
}

/** Devuelve un mapa id -> fecha ISO de cuando se desbloquó el logro */
export async function getAchievementDates(username: string): Promise<Record<string, string>> {
  return kvGetJson<Record<string, string>>(DATES_KEY(username), {});
}

async function saveAchievementDates(username: string, dates: Record<string, string>): Promise<void> {
  await kvSetJson(DATES_KEY(username), dates);
}

/**
 * Compara el estado actual con los logros ya desbloqueados.
 * Devuelve los logros que se acaban de desbloquear (nuevos).
 * Previene ejecución concurrente con una bandera de procesamiento.
 */
export async function checkNewAchievements(
  username: string,
  stats: AchievementStats,
): Promise<Achievement[]> {
  // Prevent concurrent execution
  if (isCheckingAchievements) return [];
  isCheckingAchievements = true;

  try {
    const already = await getUnlockedAchievements(username);
    const dates = await getAchievementDates(username);
    const newlyUnlocked: Achievement[] = [];
    const now = new Date().toISOString();

    for (const a of ACHIEVEMENTS) {
      if (!already.has(a.id) && a.check(stats)) {
        newlyUnlocked.push(a);
        already.add(a.id);
        dates[a.id] = now;
      }
    }

    if (newlyUnlocked.length > 0) {
      await saveUnlockedAchievements(username, already);
      await saveAchievementDates(username, dates);
    }

    return newlyUnlocked;
  } finally {
    isCheckingAchievements = false;
  }
}
