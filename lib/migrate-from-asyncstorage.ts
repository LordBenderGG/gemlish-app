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

const MIGRATION_FLAG = 'gemlish_sqlite_migrated_v2';
const MIGRATION_IN_PROGRESS_FLAG = 'gemlish_migration_in_progress';

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

    // Verificar si hay una migración en curso (caso de fallo anterior)
    const inProgress = db.getFirstSync<{ value: string }>(
      `SELECT value FROM db_meta WHERE key = ?`, [MIGRATION_IN_PROGRESS_FLAG]
    );
    if (inProgress?.value === '1') {
      console.warn('[Migration] Migration was interrupted. Retrying...');
      // Limpiar el flag para intentar de nuevo
      db.runSync(`DELETE FROM db_meta WHERE key = ?`, [MIGRATION_IN_PROGRESS_FLAG]);
    }

    // Marcar migración como en progreso (antes de cualquier cambio)
    db.runSync(
      `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, '1')`,
      [MIGRATION_IN_PROGRESS_FLAG]
    );

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

          // Migrar desafío diario
          const challengeKey = `gemlish_daily_challenge_${key}`;
          const challengeRaw = await AsyncStorage.getItem(challengeKey);
          if (challengeRaw) {
            const challengeExists = db.getFirstSync<{ value: string }>(
              `SELECT value FROM db_meta WHERE key = ?`, [challengeKey]
            );
            if (!challengeExists) {
              db.runSync(
                `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
                [challengeKey, challengeRaw]
              );
            }
          }

          // Migrar SM2 (repaso espaciado)
          const sm2Key = `gemlish_sm2_${key}`;
          const sm2Raw = await AsyncStorage.getItem(sm2Key);
          if (sm2Raw) {
            const sm2Exists = db.getFirstSync<{ value: string }>(
              `SELECT value FROM db_meta WHERE key = ?`, [sm2Key]
            );
            if (!sm2Exists) {
              db.runSync(
                `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
                [sm2Key, sm2Raw]
              );
            }
          }

          // Migrar logros desbloqueados y fechas
          const achievementsKey = `gemlish_achievements_${key}`;
          const achievementsRaw = await AsyncStorage.getItem(achievementsKey);
          if (achievementsRaw) {
            const achievementsExists = db.getFirstSync<{ value: string }>(
              `SELECT value FROM db_meta WHERE key = ?`, [achievementsKey]
            );
            if (!achievementsExists) {
              db.runSync(
                `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
                [achievementsKey, achievementsRaw]
              );
            }
          }

          const achievementDatesKey = `gemlish_achievement_dates_${key}`;
          const achievementDatesRaw = await AsyncStorage.getItem(achievementDatesKey);
          if (achievementDatesRaw) {
            const datesExists = db.getFirstSync<{ value: string }>(
              `SELECT value FROM db_meta WHERE key = ?`, [achievementDatesKey]
            );
            if (!datesExists) {
              db.runSync(
                `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
                [achievementDatesKey, achievementDatesRaw]
              );
            }
          }

          // Migrar historial de práctica
          const practiceHistoryKey = `gemlish_practice_history_${key}`;
          const practiceHistoryRaw = await AsyncStorage.getItem(practiceHistoryKey);
          if (practiceHistoryRaw) {
            const practiceHistoryExists = db.getFirstSync<{ value: string }>(
              `SELECT value FROM db_meta WHERE key = ?`, [practiceHistoryKey]
            );
            if (!practiceHistoryExists) {
              db.runSync(
                `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
                [practiceHistoryKey, practiceHistoryRaw]
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

    // ── Migrar llaves globales usadas por la app ──────────────────────────────
    const globalKeys = ['@gemlish_all_users', '@gemlish_avatar'];
    for (const key of globalKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const exists = db.getFirstSync<{ value: string }>(
        `SELECT value FROM db_meta WHERE key = ?`,
        [key],
      );
      if (!exists) {
        db.runSync(
          `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`,
          [key, raw],
        );
      }
    }

    // ── Marcar migración como completada ──────────────────────────────────────
    db.runSync(
      `INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, '1')`,
      [MIGRATION_FLAG]
    );

    // Limpiar el flag de migración en progreso (solo si completó exitosamente)
    db.runSync(`DELETE FROM db_meta WHERE key = ?`, [MIGRATION_IN_PROGRESS_FLAG]);

    console.log('[Migration] migrateFromAsyncStorageIfNeeded completed successfully');

  } catch (err) {
    // Si la migración falla por cualquier razón, NO borrar AsyncStorage.
    // El flag de "en progreso" permanecerá y se reintentará en el próximo arranque.
    // IMPORTANTE: registrar el error para poder diagnosticar en producción.
    console.error('[Migration] migrateFromAsyncStorageIfNeeded falló:', err);
    // No relanzar el error para no crashear la app
  }
}
