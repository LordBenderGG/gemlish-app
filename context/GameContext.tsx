import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  GameState, DailyState, MiniGameState,
  getGameState, saveGameState,
  getDailyState, saveDailyState,
  getMiniGameState, saveMiniGameState,
  getCurrentUser, loginUser, logoutUser, registerUser, renameUser,
} from '@/lib/storage';
import { getDailyChallenge, saveDailyChallenge } from '@/lib/daily-challenge';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos del contexto ──────────────────────────────────────────────────────

interface GameContextValue {
  // Auth
  username: string | null;
  isLoading: boolean;
  login: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>;
  register: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  renameUsername: (newName: string) => Promise<{ ok: boolean; error?: string }>;

  // Juego
  game: GameState;
  updateGame: (patch: Partial<GameState>) => Promise<void>;
  completeLevel: (levelId: number, xpEarned: number, gemsEarned: number, elapsedMs?: number) => Promise<{ wasChallenge: boolean; challengeBonus: { xp: number; gems: number } }>;
  saveLevelErrors: (levelId: number, errorWords: string[]) => Promise<void>;
  loseHeart: () => Promise<void>;
  spendGems: (amount: number) => Promise<boolean>;

  // Tarea Diaria
  daily: DailyState;
  markWordLearned: (word: string) => Promise<void>;
  finishDaily: () => Promise<void>;
  resetDailyIfNeeded: () => Promise<void>;

  // Minijuego
  miniGame: MiniGameState;
  addMiniGameTime: (ms: number) => Promise<void>;
  winMiniGame: () => Promise<void>;
}

// ─── Contexto ────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [game, setGame] = useState<GameState>({
    xp: 0, gems: 0, streak: 0, hearts: 5,
    maxUnlockedLevel: 1, levelProgress: {}, lastHeartRefill: new Date().toISOString(),
    levelErrors: {}, levelCompletedDates: {}, dailyChallengesCompleted: 0,
    challengeStreak: 0, lastChallengeDate: '', challengeHistory: [], levelBestTimes: {},
  });
  const [daily, setDaily] = useState<DailyState>({
    lastDailyDate: '', learnedWords: {}, dailyCompleted: false, totalDaysCompleted: 0,
  });
  const [miniGame, setMiniGame] = useState<MiniGameState>({
    date: new Date().toISOString().split('T')[0], playedMs: 0,
  });

  // ─── Cargar usuario al iniciar ───────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) {
        setUsername(user);
        const [g, d, mg] = await Promise.all([
          getGameState(user),
          getDailyState(user),
          getMiniGameState(user),
        ]);
        setGame(g);
        setDaily(d);
        setMiniGame(mg);
      }
      setIsLoading(false);
    })();
  }, []);

  // ─── Auth ────────────────────────────────────────────────────────────────

  const LEADERBOARD_KEY = '@gemlish_all_users';

  const updateLeaderboard = async (key: string, g: GameState) => {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      const all: Array<{ username: string; xp: number; streak: number; levelsCompleted: number }> = raw ? JSON.parse(raw) : [];
      const levelsCompleted = Object.values(g.levelProgress).filter(p => p.completed).length;
      const updated = all.filter(u => u.username !== key);
      updated.push({ username: key, xp: g.xp, streak: g.streak, levelsCompleted });
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    } catch { /* silencioso */ }
  };

  const login = useCallback(async (u: string, p: string) => {
    const result = await loginUser(u, p);
    if (result.ok) {
      const key = u.toLowerCase();
      setUsername(key);
      const [g, d, mg] = await Promise.all([
        getGameState(key),
        getDailyState(key),
        getMiniGameState(key),
      ]);
      setGame(g);
      setDaily(d);
      setMiniGame(mg);
      updateLeaderboard(key, g);
    }
    return result;
  }, []);

  const register = useCallback(async (u: string, p: string) => {
    const result = await registerUser(u, p);
    if (result.ok) {
      const key = u.toLowerCase();
      setUsername(key);
      const [g, d, mg] = await Promise.all([
        getGameState(key),
        getDailyState(key),
        getMiniGameState(key),
      ]);
      setGame(g);
      setDaily(d);
      setMiniGame(mg);
      updateLeaderboard(key, g);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUsername(null);
  }, []);

  // ─── Juego ───────────────────────────────────────────────────────────────

  const updateGame = useCallback(async (patch: Partial<GameState>) => {
    if (!username) return;
    const next = { ...game, ...patch };
    setGame(next);
    await saveGameState(username, next);
  }, [username, game]);

  const completeLevel = useCallback(async (
    levelId: number,
    xpEarned: number,
    gemsEarned: number,
    elapsedMs?: number,
  ): Promise<{ wasChallenge: boolean; challengeBonus: { xp: number; gems: number } }> => {
    if (!username) return { wasChallenge: false, challengeBonus: { xp: 0, gems: 0 } };
    const today = new Date().toISOString().split('T')[0];
    const lastDate = game.lastHeartRefill?.split('T')[0];
    let newStreak = game.streak;
    if (lastDate !== today) newStreak += 1;

    // Registrar fecha de nivel completado para gráfica de actividad
    const prevDates = game.levelCompletedDates ?? {};
    const updatedDates = {
      ...prevDates,
      [today]: (prevDates[today] ?? 0) + 1,
    };

    // Actualizar mejor tiempo del nivel
    const prevBestTimes = game.levelBestTimes ?? {};
    const updatedBestTimes = { ...prevBestTimes };
    if (elapsedMs !== undefined) {
      const prev = prevBestTimes[levelId];
      if (!prev || elapsedMs < prev) {
        updatedBestTimes[levelId] = elapsedMs;
      }
    }

    // Verificar si este nivel es el desafío del día y no ha sido completado aún
    let bonusXp = 0;
    let bonusGems = 0;
    let wasChallenge = false;
    let newDailyChallengesCompleted = game.dailyChallengesCompleted ?? 0;
    let newChallengeStreak = game.challengeStreak ?? 0;
    let newLastChallengeDate = game.lastChallengeDate ?? '';
    let newChallengeHistory = [...(game.challengeHistory ?? [])];

    try {
      const challenge = await getDailyChallenge(username);
      if (challenge && challenge.date === today && !challenge.completed && challenge.levelId === levelId) {
        // Marcar el desafío como completado
        await saveDailyChallenge(username, { ...challenge, completed: true });
        bonusXp = challenge.xpEarned - xpEarned;
        bonusGems = challenge.gemsEarned - gemsEarned;
        newDailyChallengesCompleted += 1;
        wasChallenge = true;

        // Actualizar racha de desafíos
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (newLastChallengeDate === yesterdayStr || newLastChallengeDate === today) {
          newChallengeStreak += 1;
        } else {
          newChallengeStreak = 1; // Reiniciar si no fue ayer
        }
        newLastChallengeDate = today;

        // Actualizar historial (máx 7 entradas)
        const { getLevelData } = await import('@/data/lessons');
        newChallengeHistory = [
          { date: today, levelId: challenge.levelId, levelName: getLevelData(challenge.levelId).name, xpEarned: challenge.xpEarned, gemsEarned: challenge.gemsEarned },
          ...newChallengeHistory,
        ].slice(0, 7);
      }
    } catch {
      // No interrumpir el flujo si falla la lógica del desafío
    }

    const next: GameState = {
      ...game,
      xp: game.xp + xpEarned + bonusXp,
      gems: game.gems + gemsEarned + bonusGems,
      streak: newStreak,
      hearts: Math.min(game.hearts + 1, 5),
      maxUnlockedLevel: Math.max(game.maxUnlockedLevel, levelId + 1),
      levelProgress: {
        ...game.levelProgress,
        [levelId]: { completed: true, score: 100 },
      },
      levelCompletedDates: updatedDates,
      levelBestTimes: updatedBestTimes,
      dailyChallengesCompleted: newDailyChallengesCompleted,
      challengeStreak: newChallengeStreak,
      lastChallengeDate: newLastChallengeDate,
      challengeHistory: newChallengeHistory,
    };
    setGame(next);
    await saveGameState(username, next);
    return { wasChallenge, challengeBonus: { xp: bonusXp, gems: bonusGems } };
  }, [username, game]);

  const loseHeart = useCallback(async () => {
    if (!username) return;
    const next = { ...game, hearts: Math.max(game.hearts - 1, 0) };
    setGame(next);
    await saveGameState(username, next);
  }, [username, game]);

  const spendGems = useCallback(async (amount: number): Promise<boolean> => {
    if (!username || game.gems < amount) return false;
    const next = { ...game, gems: game.gems - amount };
    setGame(next);
    await saveGameState(username, next);
    return true;
  }, [username, game]);

  const saveLevelErrors = useCallback(async (levelId: number, errorWords: string[]) => {
    if (!username) return;
    const next: GameState = {
      ...game,
      levelErrors: { ...game.levelErrors, [levelId]: errorWords },
    };
    setGame(next);
    await saveGameState(username, next);
  }, [username, game]);

  // ─── Tarea Diaria ────────────────────────────────────────────────────────

  const resetDailyIfNeeded = useCallback(async () => {
    if (!username) return;
    const today = new Date().toISOString().split('T')[0];
    if (daily.lastDailyDate !== today) {
      const next: DailyState = {
        ...daily,
        lastDailyDate: today,
        learnedWords: {},
        dailyCompleted: false,
      };
      setDaily(next);
      await saveDailyState(username, next);
    }
  }, [username, daily]);

  const markWordLearned = useCallback(async (word: string) => {
    if (!username) return;
    const next: DailyState = {
      ...daily,
      learnedWords: { ...daily.learnedWords, [word]: true },
    };
    setDaily(next);
    await saveDailyState(username, next);
  }, [username, daily]);

  const finishDaily = useCallback(async () => {
    if (!username || daily.dailyCompleted) return;
    const next: DailyState = {
      ...daily,
      dailyCompleted: true,
      totalDaysCompleted: daily.totalDaysCompleted + 1,
    };
    setDaily(next);
    await saveDailyState(username, next);

    // Recompensar: +10 💎 +20 XP +1 racha
    const nextGame: GameState = {
      ...game,
      gems: game.gems + 10,
      xp: game.xp + 20,
      streak: game.streak + 1,
    };
    setGame(nextGame);
    await saveGameState(username, nextGame);
  }, [username, daily, game]);

  // ─── Minijuego ───────────────────────────────────────────────────────────

  const addMiniGameTime = useCallback(async (ms: number) => {
    if (!username) return;
    const next: MiniGameState = { ...miniGame, playedMs: miniGame.playedMs + ms };
    setMiniGame(next);
    await saveMiniGameState(username, next);
  }, [username, miniGame]);

  const winMiniGame = useCallback(async () => {
    if (!username) return;
    const nextGame: GameState = { ...game, gems: game.gems + 10 };
    setGame(nextGame);
    await saveGameState(username, nextGame);
  }, [username, game]);

  const renameUsername = useCallback(async (newName: string): Promise<{ ok: boolean; error?: string }> => {
    if (!username) return { ok: false, error: 'No hay sesión activa' };
    const result = await renameUser(username, newName);
    if (result.ok) setUsername(newName.trim());
    return result;
  }, [username]);

  // ─── Render ────────────────────────────────────────────────────────────────────────────────────

  return (
    <GameContext.Provider value={{
      username, isLoading,
      login, register, logout, renameUsername,
      game, updateGame, completeLevel, saveLevelErrors, loseHeart, spendGems,
      daily, markWordLearned, finishDaily, resetDailyIfNeeded,
      miniGame, addMiniGameTime, winMiniGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}
