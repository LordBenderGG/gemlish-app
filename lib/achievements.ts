import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: 'levels' | 'streak' | 'words' | 'gems' | 'game' | 'practice';
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
}

// ─── Definición de todos los logros ─────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // Niveles
  { id: 'first_level', emoji: '🎯', title: 'Primer Paso', description: 'Completa tu primer nivel', check: s => s.levelsCompleted >= 1, category: 'levels' },
  { id: 'levels_10', emoji: '🔟', title: 'Diez Niveles', description: 'Completa 10 niveles', check: s => s.levelsCompleted >= 10, category: 'levels' },
  { id: 'levels_25', emoji: '🌟', title: 'Cuarto de Siglo', description: 'Completa 25 niveles', check: s => s.levelsCompleted >= 25, category: 'levels' },
  { id: 'levels_50', emoji: '🏅', title: 'Medio Camino', description: 'Completa 50 niveles', check: s => s.levelsCompleted >= 50, category: 'levels' },
  { id: 'levels_100', emoji: '💯', title: 'Centurión', description: 'Completa 100 niveles', check: s => s.levelsCompleted >= 100, category: 'levels' },
  { id: 'levels_250', emoji: '🥇', title: 'Experto', description: 'Completa 250 niveles', check: s => s.levelsCompleted >= 250, category: 'levels' },
  { id: 'levels_500', emoji: '👑', title: 'Maestro del Inglés', description: '¡Completa los 500 niveles!', check: s => s.levelsCompleted >= 500, category: 'levels' },
  // Racha
  { id: 'streak_3', emoji: '🔥', title: 'En Racha', description: '3 días seguidos estudiando', check: s => s.streak >= 3, category: 'streak' },
  { id: 'streak_7', emoji: '🔥🔥', title: 'Semana Perfecta', description: '7 días de racha', check: s => s.streak >= 7, category: 'streak' },
  { id: 'streak_30', emoji: '🌙', title: 'Mes de Estudio', description: '30 días de racha', check: s => s.streak >= 30, category: 'streak' },
  { id: 'streak_60', emoji: '🌟', title: 'Dos Meses', description: '60 días de racha', check: s => s.streak >= 60, category: 'streak' },
  { id: 'streak_100', emoji: '⚡', title: 'Imparable', description: '100 días de racha', check: s => s.streak >= 100, category: 'streak' },
  // Palabras
  { id: 'words_10', emoji: '📖', title: 'Primeras Palabras', description: 'Aprende 10 palabras en tarea diaria', check: s => s.totalWordsLearned >= 10, category: 'words' },
  { id: 'words_50', emoji: '📚', title: 'Vocabulario Básico', description: 'Aprende 50 palabras', check: s => s.totalWordsLearned >= 50, category: 'words' },
  { id: 'words_100', emoji: '🧠', title: 'Mente Brillante', description: 'Aprende 100 palabras', check: s => s.totalWordsLearned >= 100, category: 'words' },
  { id: 'words_300', emoji: '📜', title: 'Políglota', description: 'Aprende 300 palabras', check: s => s.totalWordsLearned >= 300, category: 'words' },
  // Gemas
  { id: 'gems_50', emoji: '💎', title: 'Coleccionista', description: 'Acumula 50 💎', check: s => s.gems >= 50, category: 'gems' },
  { id: 'gems_100', emoji: '💎💎', title: 'Tesoro', description: 'Acumula 100 💎', check: s => s.gems >= 100, category: 'gems' },
  { id: 'gems_500', emoji: '💰', title: 'Rico en Conocimiento', description: 'Acumula 500 💎', check: s => s.gems >= 500, category: 'gems' },
  // XP
  { id: 'xp_100', emoji: '⭐', title: 'Primer XP', description: 'Gana 100 XP', check: s => s.xp >= 100, category: 'game' },
  { id: 'xp_500', emoji: '🌠', title: 'Estrella en Ascenso', description: 'Gana 500 XP', check: s => s.xp >= 500, category: 'game' },
  { id: 'xp_1000', emoji: '🚀', title: 'Despegue', description: 'Gana 1,000 XP', check: s => s.xp >= 1000, category: 'game' },
  { id: 'xp_5000', emoji: '🌌', title: 'Leyenda', description: 'Gana 5,000 XP', check: s => s.xp >= 5000, category: 'game' },
  // Tarea diaria
  { id: 'daily_1', emoji: '✅', title: 'Primer Día', description: 'Completa la tarea diaria 1 vez', check: s => s.totalDaysCompleted >= 1, category: 'words' },
  { id: 'daily_7', emoji: '🗓️', title: 'Semana Completa', description: 'Completa la tarea diaria 7 veces', check: s => s.totalDaysCompleted >= 7, category: 'words' },
  { id: 'daily_30', emoji: '📅', title: 'Mes de Palabras', description: 'Completa la tarea diaria 30 veces', check: s => s.totalDaysCompleted >= 30, category: 'words' },
  // Práctica
  { id: 'practice_1', emoji: '🎯', title: 'Primera Práctica', description: 'Completa tu primera sesión de palabras difíciles', check: s => s.practiceSessionsCompleted >= 1, category: 'practice' },
  { id: 'practice_5', emoji: '💪', title: 'Perseverante', description: 'Completa 5 sesiones de práctica', check: s => s.practiceSessionsCompleted >= 5, category: 'practice' },
  { id: 'practice_20', emoji: '🏋️', title: 'Atleta del Vocabulario', description: 'Completa 20 sesiones de práctica', check: s => s.practiceSessionsCompleted >= 20, category: 'practice' },
  // Velocidad
  { id: 'speed_60', emoji: '⚡', title: 'Rayo', description: 'Completa un nivel en menos de 60 segundos', check: s => (s as any).bestLevelTime !== undefined && (s as any).bestLevelTime <= 60000, category: 'game' },
  { id: 'speed_120', emoji: '💨', title: 'Veloz', description: 'Completa un nivel en menos de 2 minutos', check: s => (s as any).bestLevelTime !== undefined && (s as any).bestLevelTime <= 120000, category: 'game' },
  // Desafíos
  { id: 'challenge_1', emoji: '🏆', title: 'Primer Desafío', description: 'Completa tu primer desafío del día', check: s => (s as any).dailyChallengesCompleted >= 1, category: 'game' },
  { id: 'challenge_7', emoji: '🔥🏆', title: 'Semana de Desafíos', description: '7 desafíos del día completados', check: s => (s as any).dailyChallengesCompleted >= 7, category: 'game' },
  { id: 'challenge_streak_7', emoji: '🏆🔥', title: 'Racha de Campeón', description: '7 desafíos del día consecutivos', check: s => (s as any).challengeStreak >= 7, category: 'game' },
  { id: 'challenge_streak_30', emoji: '🏆🌟', title: 'Leyenda del Desafío', description: '30 desafíos del día consecutivos', check: s => (s as any).challengeStreak >= 30, category: 'game' },
];

// ─── Persistencia de logros desbloqueados ────────────────────────────────────

const KEY = (username: string) => `gemlish_achievements_${username}`;
const DATES_KEY = (username: string) => `gemlish_achievement_dates_${username}`;

export async function getUnlockedAchievements(username: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY(username));
  if (!raw) return new Set();
  return new Set(JSON.parse(raw) as string[]);
}

export async function saveUnlockedAchievements(username: string, ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(KEY(username), JSON.stringify([...ids]));
}

/** Devuelve un mapa id -> fecha ISO de cuando se desbloquó el logro */
export async function getAchievementDates(username: string): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(DATES_KEY(username));
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, string>;
}

async function saveAchievementDates(username: string, dates: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(DATES_KEY(username), JSON.stringify(dates));
}

/**
 * Compara el estado actual con los logros ya desbloqueados.
 * Devuelve los logros que se acaban de desbloquear (nuevos).
 */
export async function checkNewAchievements(
  username: string,
  stats: AchievementStats,
): Promise<Achievement[]> {
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
}
