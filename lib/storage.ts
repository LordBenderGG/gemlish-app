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

import { getDb, initDatabase } from './database';

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

/**
 * Hash de contraseña — función original del proyecto.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function hashPassword(password: string): Promise<string> {
  return simpleHash(password);
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

export async function registerUser(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = username.trim();
  if (!trimmed || trimmed.length < 3) return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
  if (!password || password.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };

  try {
    // Garantizar que las tablas existan aunque initDatabase() haya fallado al arrancar
    initDatabase();

    const db = getDb();
    const key = trimmed.toLowerCase();

    const existing = db.getFirstSync<{ username: string }>(
      `SELECT username FROM users WHERE username = ?`, [key]
    );
    if (existing) return { ok: false, error: 'Ese nombre de usuario ya existe' };

    const hash = await hashPassword(password);
    db.runSync(
      `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`,
      [key, hash, new Date().toISOString()]
    );

    // Guardar sesión activa (id=1 siempre, una sola fila)
    db.runSync(
      `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
      [key, key]
    );

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[storage] registerUser failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function loginUser(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    initDatabase(); // Garantizar que las tablas existan
    const db = getDb();
    const key = username.toLowerCase().trim();

    const user = db.getFirstSync<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE username = ?`, [key]
    );
    if (!user) return { ok: false, error: 'Usuario no encontrado' };

    const hash = await hashPassword(password);
    if (user.password_hash !== hash) return { ok: false, error: 'Contraseña incorrecta' };

    // Guardar sesión activa (principal + respaldo)
    db.runSync(
      `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
      [key, key]
    );

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[storage] loginUser failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function getCurrentUser(): Promise<string | null> {
  try {
    initDatabase();
    const db = getDb();
    const row = db.getFirstSync<{ username: string; username_bk: string }>(
      `SELECT username, username_bk FROM session WHERE id = 1`
    );
    if (!row) return null;
    // Si la columna principal está vacía (caso extremo), usar el respaldo
    return row.username || row.username_bk || null;
  } catch (err) {
    console.error('[storage] getCurrentUser failed:', err);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    initDatabase();
    const db = getDb();
    // Antes de borrar la sesión, guardar el último username para pre-llenar el login
    const row = db.getFirstSync<{ username: string }>(`SELECT username FROM session WHERE id = 1`);
    if (row?.username) {
      db.runSync(
        `INSERT OR REPLACE INTO db_meta (key, value) VALUES ('last_username', ?)`,
        [row.username]
      );
    }
    // Borrar la sesión activa — el usuario y su progreso permanecen intactos en la BD
    db.runSync(`DELETE FROM session WHERE id = 1`);
  } catch (err) {
    console.error('[storage] logoutUser failed:', err);
  }
}

/** Devuelve el último username que inició sesión (para pre-llenar el campo de login) */
export async function getLastUsername(): Promise<string | null> {
  try {
    initDatabase();
    const db = getDb();
    const row = db.getFirstSync<{ value: string }>(
      `SELECT value FROM db_meta WHERE key = 'last_username'`
    );
    return row?.value ?? null;
  } catch (err) {
    console.error('[storage] getLastUsername failed:', err);
    return null;
  }
}

export async function hasExistingUsers(): Promise<boolean> {
  try {
    initDatabase();
    const db = getDb();
    const row = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count FROM users`
    );
    return (row?.count ?? 0) > 0;
  } catch (err) {
    console.error('[storage] hasExistingUsers failed:', err);
    return false;
  }
}

// Solo letras (incluyendo acentos y ñ), números, puntos, guiones y guiones bajos.
// Bloquea emojis, caracteres de control, espacios internos y símbolos raros.
const VALID_USERNAME_RE = /^[a-zA-ZÀ-ÿ0-9._-]+$/;

export async function renameUser(oldUsername: string, newUsername: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = newUsername.trim();
  if (!trimmed || trimmed.length < 3) return { ok: false, error: 'El nombre debe tener al menos 3 caracteres' };
  if (trimmed.length > 20) return { ok: false, error: 'El nombre no puede superar 20 caracteres' };
  if (!VALID_USERNAME_RE.test(trimmed)) return { ok: false, error: 'Solo se permiten letras, números, puntos, guiones y guiones bajos' };

  const db = getDb();
  const oldKey = oldUsername.toLowerCase();
  const newKey = trimmed.toLowerCase();

  // Validaciones previas fuera de la transacción (solo lecturas)
  if (newKey !== oldKey) {
    const existing = db.getFirstSync<{ username: string }>(
      `SELECT username FROM users WHERE username = ?`, [newKey]
    );
    if (existing) return { ok: false, error: 'Ese nombre ya está en uso' };
  } else {
    // Mismo key lowercase: el usuario quiere cambiar capitalización (ej. "juan" → "Juan")
    // Verificar que el display name realmente cambiaría
    const current = db.getFirstSync<{ username: string }>(
      `SELECT username FROM users WHERE username = ?`, [oldKey]
    );
    if (current?.username === trimmed) return { ok: false, error: 'Es el mismo nombre' };
  }

  // Toda la operación de escritura en una transacción atómica.
  // Si cualquier runSync falla a mitad, SQLite revierte todo y el usuario
  // no queda con datos inconsistentes (bug C-1 del reporte QA).
  try {
    db.withTransactionSync(() => {
      if (newKey !== oldKey) {
        // Leer datos existentes dentro de la transacción
        const gameRow = db.getFirstSync<{ data: string }>(`SELECT data FROM game_state WHERE username = ?`, [oldKey]);
        const dailyRow = db.getFirstSync<{ data: string }>(`SELECT data FROM daily_state WHERE username = ?`, [oldKey]);
        const miniRow = db.getFirstSync<{ data: string }>(`SELECT data FROM minigame_state WHERE username = ?`, [oldKey]);
        const oldUser = db.getFirstSync<{ password_hash: string; created_at: string }>(
          `SELECT password_hash, created_at FROM users WHERE username = ?`, [oldKey]
        );

        // Copiar datos al nuevo username
        if (gameRow) db.runSync(`INSERT OR REPLACE INTO game_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`, [newKey, gameRow.data]);
        if (dailyRow) db.runSync(`INSERT OR REPLACE INTO daily_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`, [newKey, dailyRow.data]);
        if (miniRow) db.runSync(`INSERT OR REPLACE INTO minigame_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`, [newKey, miniRow.data]);
        if (oldUser) {
          db.runSync(
            `INSERT OR REPLACE INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`,
            [newKey, oldUser.password_hash, oldUser.created_at]
          );
        }

        // Eliminar registros del key anterior
        db.runSync(`DELETE FROM users WHERE username = ?`, [oldKey]);
        db.runSync(`DELETE FROM game_state WHERE username = ?`, [oldKey]);
        db.runSync(`DELETE FROM daily_state WHERE username = ?`, [oldKey]);
        db.runSync(`DELETE FROM minigame_state WHERE username = ?`, [oldKey]);
      } else {
        // Mismo key: solo actualizar el display name en la tabla users (bug C-2 del reporte QA:
        // antes este bloque no ejecutaba ningún UPDATE y retornaba ok:true sin cambiar nada)
        db.runSync(`UPDATE users SET username = ? WHERE username = ?`, [trimmed, oldKey]);
      }

      // Actualizar sesión activa con el nuevo nombre
      db.runSync(
        `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
        [newKey, newKey]
      );
    });
  } catch (err) {
    console.warn('[storage] renameUser transaction failed:', err);
    return { ok: false, error: 'Error al renombrar. Intenta de nuevo.' };
  }

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

// ─── Bono Diario de Login ────────────────────────────────────────────────────

/**
 * Verifica si el usuario puede recibir el bono diario de 25 gemas.
 * El bono se da una vez cada 24 horas desde el último reclamo.
 * Retorna true si puede reclamar, false si ya lo reclamó hoy.
 */
export async function canClaimDailyBonus(username: string): Promise<boolean> {
  const db = getDb();
  const key = `daily_bonus_${username}`;
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM db_meta WHERE key = ?`, [key]
  );
  if (!row?.value) return true;
  const lastClaim = new Date(row.value).getTime();
  const now = Date.now();
  return now - lastClaim >= 24 * 60 * 60 * 1000;
}

/**
 * Registra que el usuario reclamó el bono diario ahora.
 */
export async function markDailyBonusClaimed(username: string): Promise<void> {
  const db = getDb();
  const key = `daily_bonus_${username}`;
  db.runSync(
    `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
    [key, new Date().toISOString()]
  );
}

// ─── Cooldown de Video en Memory Pairs ──────────────────────────────────────

export interface VideoRewardState {
  usesToday: number;       // Cuántas veces se usó hoy (máx 3)
  lastUseTime: number;     // Timestamp del último uso (ms)
  lastUseDate: string;     // Fecha del último uso (YYYY-MM-DD)
}

const VIDEO_COOLDOWN_MS = 20 * 60 * 1000;  // 20 minutos entre usos
const VIDEO_MAX_DAILY = 3;                  // Máximo 3 veces por día
const VIDEO_BLOCK_AFTER_LAST_MS = 24 * 60 * 60 * 1000; // 24h tras el 3er uso

export async function getVideoRewardState(username: string): Promise<VideoRewardState> {
  const db = getDb();
  const key = `video_reward_${username}`;
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM db_meta WHERE key = ?`, [key]
  );
  const today = new Date().toISOString().split('T')[0];
  if (!row?.value) return { usesToday: 0, lastUseTime: 0, lastUseDate: today };
  try {
    const saved: VideoRewardState = JSON.parse(row.value);
    // Si es un día nuevo, resetear el contador
    if (saved.lastUseDate !== today) {
      // Verificar si el bloqueo de 24h desde el 3er uso ya expiró
      if (saved.usesToday >= VIDEO_MAX_DAILY) {
        const timeSinceLast = Date.now() - saved.lastUseTime;
        if (timeSinceLast >= VIDEO_BLOCK_AFTER_LAST_MS) {
          return { usesToday: 0, lastUseTime: 0, lastUseDate: today };
        }
        // Aún en bloqueo de 24h
        return { ...saved, lastUseDate: today };
      }
      return { usesToday: 0, lastUseTime: 0, lastUseDate: today };
    }
    return saved;
  } catch {
    return { usesToday: 0, lastUseTime: 0, lastUseDate: today };
  }
}

export async function saveVideoRewardState(username: string, state: VideoRewardState): Promise<void> {
  const db = getDb();
  const key = `video_reward_${username}`;
  db.runSync(
    `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
    [key, JSON.stringify(state)]
  );
}

/**
 * Verifica si el usuario puede ver un video ahora.
 * Retorna: { canWatch: boolean, reason?: string, msUntilAvailable?: number }
 */
export async function getVideoWatchStatus(username: string): Promise<{
  canWatch: boolean;
  reason?: 'cooldown' | 'daily_limit' | 'blocked_24h';
  msUntilAvailable?: number;
}> {
  const state = await getVideoRewardState(username);
  const now = Date.now();

  // Bloqueo de 24h tras el 3er uso
  if (state.usesToday >= VIDEO_MAX_DAILY) {
    const timeSinceLast = now - state.lastUseTime;
    if (timeSinceLast < VIDEO_BLOCK_AFTER_LAST_MS) {
      return {
        canWatch: false,
        reason: 'blocked_24h',
        msUntilAvailable: VIDEO_BLOCK_AFTER_LAST_MS - timeSinceLast,
      };
    }
    // Ya pasaron 24h, puede ver
    return { canWatch: true };
  }

  // Cooldown de 20 minutos entre usos
  if (state.lastUseTime > 0) {
    const timeSinceLast = now - state.lastUseTime;
    if (timeSinceLast < VIDEO_COOLDOWN_MS) {
      return {
        canWatch: false,
        reason: 'cooldown',
        msUntilAvailable: VIDEO_COOLDOWN_MS - timeSinceLast,
      };
    }
  }

  return { canWatch: true };
}

/**
 * Registra que el usuario vio un video y reclamó la recompensa.
 */
export async function recordVideoWatched(username: string): Promise<void> {
  const state = await getVideoRewardState(username);
  const today = new Date().toISOString().split('T')[0];
  const newState: VideoRewardState = {
    usesToday: state.lastUseDate === today ? state.usesToday + 1 : 1,
    lastUseTime: Date.now(),
    lastUseDate: today,
  };
  await saveVideoRewardState(username, newState);
}
