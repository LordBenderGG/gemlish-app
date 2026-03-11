import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  GameState, DailyState, MiniGameState,
  getGameState, saveGameState,
  getDailyState, saveDailyState,
  getMiniGameState, saveMiniGameState,
  getCurrentUser, loginUser, logoutUser, registerUser,
} from '@/lib/storage';

// ─── Tipos del contexto ──────────────────────────────────────────────────────

interface GameContextValue {
  // Auth
  username: string | null;
  isLoading: boolean;
  login: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>;
  register: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Juego
  game: GameState;
  updateGame: (patch: Partial<GameState>) => Promise<void>;
  completeLevel: (levelId: number, xpEarned: number, gemsEarned: number) => Promise<void>;
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
    levelErrors: {}, levelCompletedDates: {},
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

  const completeLevel = useCallback(async (levelId: number, xpEarned: number, gemsEarned: number) => {
    if (!username) return;
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

    const next: GameState = {
      ...game,
      xp: game.xp + xpEarned,
      gems: game.gems + gemsEarned,
      streak: newStreak,
      hearts: Math.min(game.hearts + 1, 5),
      maxUnlockedLevel: Math.max(game.maxUnlockedLevel, levelId + 1),
      levelProgress: {
        ...game.levelProgress,
        [levelId]: { completed: true, score: 100 },
      },
      levelCompletedDates: updatedDates,
    };
    setGame(next);
    await saveGameState(username, next);
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

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <GameContext.Provider value={{
      username, isLoading,
      login, register, logout,
      game, updateGame, completeLevel, saveLevelErrors, loseHeart, spendGems,
      daily, markWordLearned, finishDaily, resetDailyIfNeeded,
      miniGame, addMiniGameTime, winMiniGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}
