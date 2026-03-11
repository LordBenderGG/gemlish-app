import { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { useAchievements } from '@/context/AchievementsContext';
import { getDailyState } from '@/lib/storage';
import { getPracticeHistory } from '@/lib/practice-history';

/**
 * Verifica logros pendientes al abrir la app.
 * Se ejecuta una sola vez cuando el usuario tiene sesión activa.
 * Muestra los toasts de logros que se desbloquearon mientras la app estaba cerrada.
 */
export function usePendingAchievements() {
  const { username, game } = useGame();
  const { checkAchievements } = useAchievements();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!username) return;
    // Solo verificar una vez por sesión de usuario
    if (checkedRef.current === username) return;
    checkedRef.current = username;

    // Pequeño delay para que los toasts aparezcan después de que la UI esté lista
    const timer = setTimeout(async () => {
      try {
        const [daily, sessions] = await Promise.all([
          getDailyState(username),
          getPracticeHistory(username),
        ]);

        const totalLevels = Object.values(game.levelProgress).filter(p => p.completed).length;
        const totalWordsLearned = Object.keys(daily.learnedWords ?? {}).length;

        await checkAchievements(username, {
          levelsCompleted: totalLevels,
          streak: game.streak,
          totalWordsLearned,
          gems: game.gems,
          xp: game.xp,
          totalDaysCompleted: daily.totalDaysCompleted,
          practiceSessionsCompleted: sessions.length,
        });
      } catch {
        // Silenciar errores para no interrumpir el inicio de la app
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [username, game, checkAchievements]);
}
