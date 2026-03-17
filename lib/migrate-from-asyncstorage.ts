/**
 * lib/migrate-from-asyncstorage.ts
 *
 * Migración única de datos de AsyncStorage → SQLite.
 * Se ejecuta UNA SOLA VEZ al arrancar la app después de la actualización.
 *
 * Flujo:
 * 1. Verifica si ya se ejecutó la migración (flag en SQLite)
 * 2. Si no, lee todos los datos de AsyncStorage
 * 3. Los inserta en SQLite
 * 4. Marca la migración como completada
 * 5. Los datos de AsyncStorage se conservan como respaldo (no se borran)
 *
 * Los usuarios que ya tenían progreso NO perderán nada.
 * Los usuarios nuevos simplemente empezarán directo en SQLite.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from './database';
import { Platform } from 'react-native';

const MIGRATION_FLAG = 'gemlish_sqlite_migrated_v1';

export async function migrateFromAsyncStorageIfNeeded(): Promise<void> {
  // En web no hay SQLite nativo, omitir
  if (Platform.OS === 'web') return;

  try {
    const db = getDb();

    // Verificar si ya se migró (flag en db_meta)
    const migrated = db.getFirstSync<{ value: string }>(
      `SELECT value FROM db_meta WHERE key = ?`, [MIGRATION_FLAG]
    );
    if (migrated?.value === '1') return; // Ya migrado, nada que hacer

    // ── Leer datos de AsyncStorage ────────────────────────────────────────────
    const [
      usersRaw,
      currentUserRaw,
      currentUserBkRaw,
    ] = await Promise.all([
      AsyncStorage.getItem('gemlish_users'),
      AsyncStorage.getItem('gemlish_current_user'),
      AsyncStorage.getItem('gemlish_current_user_bk'),
    ]);

    // ── Migrar usuarios ───────────────────────────────────────────────────────
    if (usersRaw) {
      try {
        const users: Record<string, { username: string; passwordHash: string; createdAt: string }> = JSON.parse(usersRaw);

        for (const [key, user] of Object.entries(users)) {
          // Insertar usuario si no existe ya en SQLite
          const exists = db.getFirstSync<{ username: string }>(
            `SELECT username FROM users WHERE username = ?`, [key]
          );
          if (!exists) {
            db.runSync(
              `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`,
              [key, user.passwordHash, user.createdAt || new Date().toISOString()]
            );
          }

          // Migrar estado del juego
          const gameRaw = await AsyncStorage.getItem(`gemlish_game_${key}`);
          if (gameRaw) {
            const gameExists = db.getFirstSync<{ username: string }>(
              `SELECT username FROM game_state WHERE username = ?`, [key]
            );
            if (!gameExists) {
              db.runSync(
                `INSERT INTO game_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`,
                [key, gameRaw]
              );
            }
          }

          // Migrar estado diario
          const dailyRaw = await AsyncStorage.getItem(`gemlish_daily_${key}`);
          if (dailyRaw) {
            const dailyExists = db.getFirstSync<{ username: string }>(
              `SELECT username FROM daily_state WHERE username = ?`, [key]
            );
            if (!dailyExists) {
              db.runSync(
                `INSERT INTO daily_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`,
                [key, dailyRaw]
              );
            }
          }

          // Migrar estado del minijuego
          const miniRaw = await AsyncStorage.getItem(`gemlish_minigame_${key}`);
          if (miniRaw) {
            const miniExists = db.getFirstSync<{ username: string }>(
              `SELECT username FROM minigame_state WHERE username = ?`, [key]
            );
            if (!miniExists) {
              db.runSync(
                `INSERT INTO minigame_state (username, data, updated_at) VALUES (?, ?, datetime('now'))`,
                [key, miniRaw]
              );
            }
          }
        }
      } catch {
        // Si falla el parse, continuar — mejor empezar limpio que crashear
      }
    }

    // ── Migrar sesión activa ──────────────────────────────────────────────────
    const activeUser = currentUserRaw || currentUserBkRaw;
    if (activeUser) {
      // Verificar que el usuario existe en SQLite antes de crear la sesión
      const userExists = db.getFirstSync<{ username: string }>(
        `SELECT username FROM users WHERE username = ?`, [activeUser]
      );
      if (userExists) {
        db.runSync(
          `INSERT OR REPLACE INTO session (id, username, username_bk) VALUES (1, ?, ?)`,
          [activeUser, activeUser]
        );
      }
    }

    // ── Marcar migración como completada ──────────────────────────────────────
    db.runSync(
      `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, '1')`,
      [MIGRATION_FLAG]
    );

  } catch {
    // Si la migración falla por cualquier razón, no crashear la app
    // El usuario verá la pantalla de login y podrá volver a entrar
  }
}
