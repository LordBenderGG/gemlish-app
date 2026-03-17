/**
 * lib/storage.ts
 *
 * Capa de acceso a datos — usa SQLite local (expo-sqlite).
 * Todo el progreso, usuarios y sesiones se guardan en gemlish.db
 * en el dispositivo del usuario. No hay ninguna conexión a servidores externos.
 *
 * La base de datos se inicializa con migraciones versionadas (ver lib/database.ts).
 * Cualquier cambio futuro de esquema se hace agregando una migración, nunca
 * borrando datos — el progreso de los usuarios siempre se conserva.
 */

import { getDb } from './database';

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
  levelErrors: Record<number, string[]>;
  levelCompletedDates: Record<string, number>;
  dailyChallengesCompleted: number;
  challengeStreak: number;
  lastChallengeDate: string;
  challengeHistory: Array<{ date: string; levelId: number; levelName: string; xpEarned: number; gemsEarned: number }>;
  levelBestTimes: Record<number, number>;
}

export interface DailyState {
  lastDailyDate: string;
  learnedWords: Record<string, boolean>;
  allLearnedWords: Record<string, boolean>;
  dailyCompleted: boolean;
  totalDaysCompleted: number;
}

export interface MiniGameState {
  date: string;
  playedMs: number;
}

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
  const db = getDb();
  const rows = db.getAllSync<{ username: string; password_hash: string; created_at: string }>(
    `SELECT username, password_hash, created_at FROM users`
  );
  const result: Record<string, UserProfile> = {};
  for (const row of rows) {
    result[row.username] = {
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }
  return result;
}

export async function registerUser(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!username.trim() || username.length < 3) return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
  if (!password || password.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };

  const db = getDb();
  const key = username.toLowerCase().trim();

  const existing = db.getFirstSync<{ username: string }>(
    `SELECT username FROM users WHERE username = ?`, [key]
  );
  if (existing) return { ok: false, error: 'Ese nombre de usuario ya existe' };

  db.runSync(
    `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`,
    [key, simpleHash(password), new Date().toISOString()]
  );

  // Guardar sesión activa (id=1 siempre, una sola fila)
  db.runSync(
    `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
    [key, key]
  );

  return { ok: true };
}

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const key = username.toLowerCase().trim();

  const user = db.getFirstSync<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE username = ?`, [key]
  );
  if (!user) return { ok: false, error: 'Usuario no encontrado' };
  if (user.password_hash !== simpleHash(password)) return { ok: false, error: 'Contraseña incorrecta' };

  // Guardar sesión activa (principal + respaldo)
  db.runSync(
    `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
    [key, key]
  );

  return { ok: true };
}

export async function getCurrentUser(): Promise<string | null> {
  const db = getDb();
  const row = db.getFirstSync<{ username: string; username_bk: string }>(
    `SELECT username, username_bk FROM session WHERE id = 1`
  );
  if (!row) return null;
  // Si la columna principal está vacía (caso extremo), usar el respaldo
  return row.username || row.username_bk || null;
}

export async function logoutUser(): Promise<void> {
  const db = getDb();
  // Borrar la sesión activa — el usuario y su progreso permanecen intactos en la BD
  db.runSync(`DELETE FROM session WHERE id = 1`);
}

export async function hasExistingUsers(): Promise<boolean> {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM users`
  );
  return (row?.count ?? 0) > 0;
}

export async function renameUser(oldUsername: string, newUsername: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = newUsername.trim();
  if (!trimmed || trimmed.length < 3) return { ok: false, error: 'El nombre debe tener al menos 3 caracteres' };
  if (trimmed.length > 20) return { ok: false, error: 'El nombre no puede superar 20 caracteres' };

  const db = getDb();
  const oldKey = oldUsername.toLowerCase();
  const newKey = trimmed.toLowerCase();

  if (newKey !== oldKey) {
    const existing = db.getFirstSync<{ username: string }>(
      `SELECT username FROM users WHERE username = ?`, [newKey]
    );
    if (existing) return { ok: false, error: 'Ese nombre ya está en uso' };
  } else {
    // Mismo key, solo actualizar display name — verificar si es igual
    const current = db.getFirstSync<{ username: string }>(
      `SELECT username FROM users WHERE username = ?`, [oldKey]
    );
    if (current?.username === trimmed) return { ok: false, error: 'Es el mismo nombre' };
  }

  if (newKey !== oldKey) {
    // Copiar datos de juego al nuevo username
    const gameRow = db.getFirstSync<{ data: string }>(`SELECT data FROM game_state WHERE username = ?`, [oldKey]);
    const dailyRow = db.getFirstSync<{ data: string }>(`SELECT data FROM daily_state WHERE username = ?`, [oldKey]);
    const miniRow = db.getFirstSync<{ data: string }>(`SELECT data FROM minigame_state WHERE username = ?`, [oldKey]);

    if (gameRow) db.runSync(`INSERT OR REPLACE INTO game_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`, [newKey, gameRow.data]);
    if (dailyRow) db.runSync(`INSERT OR REPLACE INTO daily_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`, [newKey, dailyRow.data]);
    if (miniRow) db.runSync(`INSERT OR REPLACE INTO minigame_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`, [newKey, miniRow.data]);

    // Insertar nuevo usuario con los mismos datos
    const oldUser = db.getFirstSync<{ password_hash: string; created_at: string }>(
      `SELECT password_hash, created_at FROM users WHERE username = ?`, [oldKey]
    );
    if (oldUser) {
      db.runSync(
        `INSERT OR REPLACE INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`,
        [newKey, oldUser.password_hash, oldUser.created_at]
      );
    }

    // Eliminar datos del key anterior
    db.runSync(`DELETE FROM users WHERE username = ?`, [oldKey]);
    db.runSync(`DELETE FROM game_state WHERE username = ?`, [oldKey]);
    db.runSync(`DELETE FROM daily_state WHERE username = ?`, [oldKey]);
    db.runSync(`DELETE FROM minigame_state WHERE username = ?`, [oldKey]);
  }

  // Actualizar sesión activa
  db.runSync(
    `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
    [newKey, newKey]
  );

  return { ok: true };
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
  dailyChallengesCompleted: 0,
  challengeStreak: 0,
  lastChallengeDate: '',
  challengeHistory: [],
  levelBestTimes: {},
};

export async function getGameState(username: string): Promise<GameState> {
  const db = getDb();
  const row = db.getFirstSync<{ data: string }>(
    `SELECT data FROM game_state WHERE username = ?`, [username]
  );
  if (!row) return { ...DEFAULT_GAME_STATE };
  try {
    return { ...DEFAULT_GAME_STATE, ...JSON.parse(row.data) };
  } catch {
    return { ...DEFAULT_GAME_STATE };
  }
}

export async function saveGameState(username: string, state: GameState): Promise<void> {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO game_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`,
    [username, JSON.stringify(state)]
  );
}

// ─── Tarea Diaria ────────────────────────────────────────────────────────────

const DEFAULT_DAILY_STATE: DailyState = {
  lastDailyDate: '',
  learnedWords: {},
  allLearnedWords: {},
  dailyCompleted: false,
  totalDaysCompleted: 0,
};

export async function getDailyState(username: string): Promise<DailyState> {
  const db = getDb();
  const row = db.getFirstSync<{ data: string }>(
    `SELECT data FROM daily_state WHERE username = ?`, [username]
  );
  if (!row) return { ...DEFAULT_DAILY_STATE };
  try {
    return { ...DEFAULT_DAILY_STATE, ...JSON.parse(row.data) };
  } catch {
    return { ...DEFAULT_DAILY_STATE };
  }
}

export async function saveDailyState(username: string, state: DailyState): Promise<void> {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO daily_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`,
    [username, JSON.stringify(state)]
  );
}

// ─── Minijuego ───────────────────────────────────────────────────────────────

export async function getMiniGameState(username: string): Promise<MiniGameState> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const row = db.getFirstSync<{ data: string }>(
    `SELECT data FROM minigame_state WHERE username = ?`, [username]
  );
  if (!row) return { date: today, playedMs: 0 };
  try {
    const saved: MiniGameState = JSON.parse(row.data);
    // Resetear si es un día nuevo
    if (saved.date !== today) return { date: today, playedMs: 0 };
    return saved;
  } catch {
    return { date: today, playedMs: 0 };
  }
}

export async function saveMiniGameState(username: string, state: MiniGameState): Promise<void> {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO minigame_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`,
    [username, JSON.stringify(state)]
  );
}
