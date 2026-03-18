import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  GameState, DailyState, MiniGameState,
  getGameState, saveGameState,
  getDailyState, saveDailyState,
  getMiniGameState, saveMiniGameState,
  getCurrentUser, loginUser, logoutUser, registerUser, renameUser,
  canClaimDailyBonus, markDailyBonusClaimed,
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
  completeLevel: (levelId: number, xpEarned: number, gemsEarned: number, elapsedMs?: number, score?: number) => Promise<{ wasChallenge: boolean; challengeBonus: { xp: number; gems: number } }>;
  saveLevelErrors: (levelId: number, errorWords: string[]) => Promise<void>;
  loseHeart: () => Promise<void>;
  spendGems: (amount: number) => Promise<boolean>;
  addGems: (amount: number) => Promise<void>;
  claimDailyBonus: () => Promise<boolean>; // true si se entregaron gemas

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
    lastDailyDate: '', learnedWords: {}, allLearnedWords: {}, dailyCompleted: false, totalDaysCompleted: 0,
  });
  const [miniGame, setMiniGame] = useState<MiniGameState>({
    date: new Date().toISOString().split('T')[0], playedMs: 0,
  });

  // ─── Refs para evitar stale closures ────────────────────────────────────
  // CRÍTICO: Siempre leer el estado más reciente desde los refs, no desde el closure
  const gameRef = useRef(game);
  const dailyRef = useRef(daily);
  const miniGameRef = useRef(miniGame);
  const usernameRef = useRef(username);

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { dailyRef.current = daily; }, [daily]);
  useEffect(() => { miniGameRef.current = miniGame; }, [miniGame]);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // ─── Cargar usuario al iniciar ───────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) {
        setUsername(user);
        usernameRef.current = user;
        const [g, d, mg] = await Promise.all([
          getGameState(user),
          getDailyState(user),
          getMiniGameState(user),
        ]);
        setGame(g);
        setDaily(d);
        setMiniGame(mg);
        gameRef.current = g;
        dailyRef.current = d;
        miniGameRef.current = mg;
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
      usernameRef.current = key;
      const [g, d, mg] = await Promise.all([
        getGameState(key),
        getDailyState(key),
        getMiniGameState(key),
      ]);
      setGame(g);
      setDaily(d);
      setMiniGame(mg);
      gameRef.current = g;
      dailyRef.current = d;
      miniGameRef.current = mg;
      updateLeaderboard(key, g);
    }
    return result;
  }, []);

  const register = useCallback(async (u: string, p: string) => {
    const result = await registerUser(u, p);
    if (result.ok) {
      const key = u.toLowerCase();
      setUsername(key);
      usernameRef.current = key;
      const [g, d, mg] = await Promise.all([
        getGameState(key),
        getDailyState(key),
        getMiniGameState(key),
      ]);
      // Bono de bienvenida: 100 gemas al registrarse
      const gWithBonus = { ...g, gems: g.gems + 100 };
      await saveGameState(key, gWithBonus);
      setGame(gWithBonus);
      setDaily(d);
      setMiniGame(mg);
      gameRef.current = gWithBonus;
      dailyRef.current = d;
      miniGameRef.current = mg;
      updateLeaderboard(key, gWithBonus);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUsername(null);
    usernameRef.current = null;
  }, []);

  // ─── Juego ───────────────────────────────────────────────────────────────

  const updateGame = useCallback(async (patch: Partial<GameState>) => {
    const u = usernameRef.current;
    if (!u) return;
    const current = gameRef.current;
    const next = { ...current, ...patch };
    setGame(next);
    gameRef.current = next;
    await saveGameState(u, next);
  }, []);

  const completeLevel = useCallback(async (
    levelId: number,
    xpEarned: number,
    gemsEarned: number,
    elapsedMs?: number,
    score?: number,
  ): Promise<{ wasChallenge: boolean; challengeBonus: { xp: number; gems: number } }> => {
    const u = usernameRef.current;
    if (!u) return { wasChallenge: false, challengeBonus: { xp: 0, gems: 0 } };

    // SIEMPRE leer el estado más reciente desde el ref (no desde el closure)
    const current = gameRef.current;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const prevDatesCheck = current.levelCompletedDates ?? {};
    const alreadyActiveToday = (prevDatesCheck[today] ?? 0) > 0;
    const wasActiveYesterday = (prevDatesCheck[yesterdayStr] ?? 0) > 0;
    let newStreak = current.streak;
    if (!alreadyActiveToday) {
      if (wasActiveYesterday || current.streak === 0) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const prevDates = current.levelCompletedDates ?? {};
    const updatedDates = {
      ...prevDates,
      [today]: (prevDates[today] ?? 0) + 1,
    };

    const prevBestTimes = current.levelBestTimes ?? {};
    const updatedBestTimes = { ...prevBestTimes };
    if (elapsedMs !== undefined) {
      const prev = prevBestTimes[levelId];
      if (!prev || elapsedMs < prev) {
        updatedBestTimes[levelId] = elapsedMs;
      }
    }

    let bonusXp = 0;
    let bonusGems = 0;
    let wasChallenge = false;
    let newDailyChallengesCompleted = current.dailyChallengesCompleted ?? 0;
    let newChallengeStreak = current.challengeStreak ?? 0;
    let newLastChallengeDate = current.lastChallengeDate ?? '';
    let newChallengeHistory = [...(current.challengeHistory ?? [])];

    try {
      const challenge = await getDailyChallenge(u);
      if (challenge && challenge.date === today && !challenge.completed && challenge.levelId === levelId) {
        await saveDailyChallenge(u, { ...challenge, completed: true });
        bonusXp = challenge.xpEarned - xpEarned;
        bonusGems = challenge.gemsEarned - gemsEarned;
        newDailyChallengesCompleted += 1;
        wasChallenge = true;

        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split('T')[0];
        if (newLastChallengeDate === yestStr || newLastChallengeDate === today) {
          newChallengeStreak += 1;
        } else {
          newChallengeStreak = 1;
        }
        newLastChallengeDate = today;

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
      ...current,
      xp: current.xp + xpEarned + bonusXp,
      gems: current.gems + gemsEarned + bonusGems,
      streak: newStreak,
      hearts: Math.min(current.hearts + 1, 5),
      maxUnlockedLevel: Math.max(current.maxUnlockedLevel, levelId + 1),
      levelProgress: {
        ...current.levelProgress,
        [levelId]: { completed: true, score: score ?? 100 },
      },
      levelCompletedDates: updatedDates,
      levelBestTimes: updatedBestTimes,
      dailyChallengesCompleted: newDailyChallengesCompleted,
      challengeStreak: newChallengeStreak,
      lastChallengeDate: newLastChallengeDate,
      challengeHistory: newChallengeHistory,
    };
    setGame(next);
    gameRef.current = next;
    await saveGameState(u, next);
    return { wasChallenge, challengeBonus: { xp: bonusXp, gems: bonusGems } };
  }, []);

  const loseHeart = useCallback(async () => {
    const u = usernameRef.current;
    if (!u) return;
    const current = gameRef.current;
    const next = { ...current, hearts: Math.max(current.hearts - 1, 0) };
    setGame(next);
    gameRef.current = next;
    await saveGameState(u, next);
  }, []);

  const spendGems = useCallback(async (amount: number): Promise<boolean> => {
    const u = usernameRef.current;
    const current = gameRef.current;
    if (!u || current.gems < amount) return false;
    const next = { ...current, gems: current.gems - amount };
    setGame(next);
    gameRef.current = next;
    await saveGameState(u, next);
    return true;
  }, []);

  const addGems = useCallback(async (amount: number): Promise<void> => {
    const u = usernameRef.current;
    if (!u || amount <= 0) return;
    // Siempre leer del ref para evitar stale closure
    const current = gameRef.current;
    const next = { ...current, gems: current.gems + amount };
    setGame(next);
    gameRef.current = next;
    await saveGameState(u, next);
  }, []);

  const saveLevelErrors = useCallback(async (levelId: number, errorWords: string[]) => {
    const u = usernameRef.current;
    if (!u) return;
    // CRÍTICO: leer el estado más reciente desde el ref para no sobreescribir
    // el progreso guardado por completeLevel (que se llamó justo antes)
    const current = gameRef.current;
    const next: GameState = {
      ...current,
      levelErrors: { ...current.levelErrors, [levelId]: errorWords },
    };
    setGame(next);
    gameRef.current = next;
    await saveGameState(u, next);
  }, []);

  // ─── Tarea Diaria ────────────────────────────────────────────────────────

  const resetDailyIfNeeded = useCallback(async () => {
    const u = usernameRef.current;
    if (!u) return;
    const current = dailyRef.current;
    const today = new Date().toISOString().split('T')[0];
    if (current.lastDailyDate !== today) {
      const next: DailyState = {
        ...current,
        lastDailyDate: today,
        learnedWords: {},
        dailyCompleted: false,
      };
      setDaily(next);
      dailyRef.current = next;
      await saveDailyState(u, next);
    }
  }, []);

  const markWordLearned = useCallback(async (word: string) => {
    const u = usernameRef.current;
    if (!u) return;
    const current = dailyRef.current;
    const next: DailyState = {
      ...current,
      learnedWords: { ...current.learnedWords, [word]: true },
      allLearnedWords: { ...current.allLearnedWords, [word]: true },
    };
    setDaily(next);
    dailyRef.current = next;
    await saveDailyState(u, next);
  }, []);

  const finishDaily = useCallback(async () => {
    const u = usernameRef.current;
    const currentDaily = dailyRef.current;
    if (!u || currentDaily.dailyCompleted) return;
    const nextDaily: DailyState = {
      ...currentDaily,
      dailyCompleted: true,
      totalDaysCompleted: currentDaily.totalDaysCompleted + 1,
    };
    setDaily(nextDaily);
    dailyRef.current = nextDaily;
    await saveDailyState(u, nextDaily);
    // Recompensar: +10 💎 +20 XP + actualizar streak
    const currentGame = gameRef.current;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const prevDates = currentGame.levelCompletedDates ?? {};
    const alreadyActiveToday = (prevDates[today] ?? 0) > 0;
    const wasActiveYesterday = (prevDates[yesterdayStr] ?? 0) > 0;
    let newStreak = currentGame.streak;
    if (!alreadyActiveToday) {
      if (wasActiveYesterday || currentGame.streak === 0) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }
    // Registrar la tarea diaria como actividad del día
    const updatedDates = {
      ...prevDates,
      [today]: (prevDates[today] ?? 0) + 1,
    };
    const nextGame: GameState = {
      ...currentGame,
      gems: currentGame.gems + 10,
      xp: currentGame.xp + 20,
      streak: newStreak,
      levelCompletedDates: updatedDates,
    };
    setGame(nextGame);
    gameRef.current = nextGame;
    await saveGameState(u, nextGame);
  }, []);

  // ─── Minijuego ───────────────────────────────────────────────────────────

  const addMiniGameTime = useCallback(async (ms: number) => {
    const u = usernameRef.current;
    if (!u) return;
    const current = miniGameRef.current;
    const next: MiniGameState = { ...current, playedMs: current.playedMs + ms };
    setMiniGame(next);
    miniGameRef.current = next;
    await saveMiniGameState(u, next);
  }, []);

  const winMiniGame = useCallback(async () => {
    const u = usernameRef.current;
    if (!u) return;
    const current = gameRef.current;
    const nextGame: GameState = { ...current, gems: current.gems + 10 };
    setGame(nextGame);
    gameRef.current = nextGame;
    await saveGameState(u, nextGame);
  }, []);

  const renameUsername = useCallback(async (newName: string): Promise<{ ok: boolean; error?: string }> => {
    const u = usernameRef.current;
    if (!u) return { ok: false, error: 'No hay sesión activa' };
    const result = await renameUser(u, newName);
    if (result.ok) {
      setUsername(newName.trim());
      usernameRef.current = newName.trim();
    }
    return result;
  }, []);

  // ─── Bono Diario ─────────────────────────────────────────────────────────

  const claimDailyBonus = useCallback(async (): Promise<boolean> => {
    const u = usernameRef.current;
    if (!u) return false;
    const eligible = await canClaimDailyBonus(u);
    if (!eligible) return false;
    const current = gameRef.current;
    const nextGame: GameState = { ...current, gems: current.gems + 25 };
    setGame(nextGame);
    gameRef.current = nextGame;
    await saveGameState(u, nextGame);
    await markDailyBonusClaimed(u);
    return true;
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────────────────────────

  return (
    <GameContext.Provider value={{
      username, isLoading,
      login, register, logout, renameUsername,
      game, updateGame, completeLevel, saveLevelErrors, loseHeart, spendGems, addGems, claimDailyBonus,
      daily, markWordLearned, finishDaily, resetDailyIfNeeded,
      miniGame, addMiniGameTime, winMiniGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}
