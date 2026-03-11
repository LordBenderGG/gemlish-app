import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface GameState {
  xp: number;
  gems: number;
  streak: number;
  hearts: number;
  maxUnlockedLevel: number;
  levelProgress: Record<number, { completed: boolean; score: number }>;
  lastHeartRefill: string;
  // Palabras fallidas por nivel: levelId -> array de palabras en inglés
  levelErrors: Record<number, string[]>;
  // Fechas de niveles completados: fecha (YYYY-MM-DD) -> cantidad de niveles completados ese día
  levelCompletedDates: Record<string, number>;
}

export interface DailyState {
  lastDailyDate: string;
  learnedWords: Record<string, boolean>;
  dailyCompleted: boolean;
  totalDaysCompleted: number;
}

export interface MiniGameState {
  date: string;
  playedMs: number;
}

// ─── Claves ──────────────────────────────────────────────────────────────────

const KEYS = {
  USERS: 'gemlish_users',
  CURRENT_USER: 'gemlish_current_user',
  GAME: (username: string) => `gemlish_game_${username}`,
  DAILY: (username: string) => `gemlish_daily_${username}`,
  MINIGAME: (username: string) => `gemlish_minigame_${username}`,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<Record<string, UserProfile>> {
  const raw = await AsyncStorage.getItem(KEYS.USERS);
  return raw ? JSON.parse(raw) : {};
}

export async function saveUsers(users: Record<string, UserProfile>): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export async function registerUser(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!username.trim() || username.length < 3) return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
  if (!password || password.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };

  const users = await getUsers();
  const key = username.toLowerCase();
  if (users[key]) return { ok: false, error: 'Ese nombre de usuario ya existe' };

  users[key] = {
    username: username.trim(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };
  await saveUsers(users);
  await AsyncStorage.setItem(KEYS.CURRENT_USER, key);
  return { ok: true };
}

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const users = await getUsers();
  const key = username.toLowerCase();
  const user = users[key];
  if (!user) return { ok: false, error: 'Usuario no encontrado' };
  if (user.passwordHash !== simpleHash(password)) return { ok: false, error: 'Contraseña incorrecta' };
  await AsyncStorage.setItem(KEYS.CURRENT_USER, key);
  return { ok: true };
}

export async function getCurrentUser(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.CURRENT_USER);
}

export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

// Detecta si hay usuarios registrados (para el onboarding de bienvenida de vuelta)
export async function hasExistingUsers(): Promise<boolean> {
  const users = await getUsers();
  return Object.keys(users).length > 0;
}

// ─── Estado del Juego ────────────────────────────────────────────────────────

const DEFAULT_GAME_STATE: GameState = {
  xp: 0,
  gems: 0,
  streak: 0,
  hearts: 5,
  maxUnlockedLevel: 1,
  levelProgress: {},
  lastHeartRefill: new Date().toISOString(),
  levelErrors: {},
  levelCompletedDates: {},
};

export async function getGameState(username: string): Promise<GameState> {
  const raw = await AsyncStorage.getItem(KEYS.GAME(username));
  if (!raw) return { ...DEFAULT_GAME_STATE };
  return { ...DEFAULT_GAME_STATE, ...JSON.parse(raw) };
}

export async function saveGameState(username: string, state: GameState): Promise<void> {
  await AsyncStorage.setItem(KEYS.GAME(username), JSON.stringify(state));
}

// ─── Tarea Diaria ────────────────────────────────────────────────────────────

const DEFAULT_DAILY_STATE: DailyState = {
  lastDailyDate: '',
  learnedWords: {},
  dailyCompleted: false,
  totalDaysCompleted: 0,
};

export async function getDailyState(username: string): Promise<DailyState> {
  const raw = await AsyncStorage.getItem(KEYS.DAILY(username));
  if (!raw) return { ...DEFAULT_DAILY_STATE };
  return { ...DEFAULT_DAILY_STATE, ...JSON.parse(raw) };
}

export async function saveDailyState(username: string, state: DailyState): Promise<void> {
  await AsyncStorage.setItem(KEYS.DAILY(username), JSON.stringify(state));
}

// ─── Minijuego ───────────────────────────────────────────────────────────────

export async function getMiniGameState(username: string): Promise<MiniGameState> {
  const raw = await AsyncStorage.getItem(KEYS.MINIGAME(username));
  const today = new Date().toISOString().split('T')[0];
  if (!raw) return { date: today, playedMs: 0 };
  const saved: MiniGameState = JSON.parse(raw);
  if (saved.date !== today) return { date: today, playedMs: 0 };
  return saved;
}

export async function saveMiniGameState(username: string, state: MiniGameState): Promise<void> {
  await AsyncStorage.setItem(KEYS.MINIGAME(username), JSON.stringify(state));
}
