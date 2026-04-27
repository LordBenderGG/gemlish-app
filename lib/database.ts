/**
 * lib/database.ts
 *
 * Base de datos SQLite local con sistema de migraciones versionadas.
 *
 * CÓMO AGREGAR CAMBIOS EN EL FUTURO:
 * 1. Incrementa DB_VERSION en 1
 * 2. Agrega un nuevo bloque `case <nueva_version>:` en runMigrations()
 * 3. Escribe solo el SQL que AGREGA o MODIFICA (nunca borres datos)
 * 4. Los usuarios existentes ejecutarán solo las migraciones pendientes
 *    desde su versión actual hasta la nueva — su progreso se conserva.
 *
 * Estructura de tablas:
 *   - users          → perfiles de usuario y contraseñas
 *   - session        → sesión activa (usuario actual)
 *   - game_state     → progreso del juego por usuario (JSON compacto)
 *   - daily_state    → estado de la tarea diaria por usuario (JSON compacto)
 *   - minigame_state → estado del minijuego por usuario (JSON compacto)
 *   - db_meta        → versión de la base de datos (para migraciones)
 */

import { Platform } from 'react-native';

// ─── Versión actual del esquema ───────────────────────────────────────────────
// Incrementa este número cada vez que hagas un cambio en la estructura de la BD
const DB_VERSION = 1;

// ─── Tipos ───────────────────────────────────────────────────────────────────

type SQLiteDB = {
  execSync: (sql: string) => void;
  runSync: (sql: string, params?: any[]) => void;
  getFirstSync: <T>(sql: string, params?: any[]) => T | null;
  getAllSync: <T>(sql: string, params?: any[]) => T[];
  withTransactionSync: (task: () => void) => void;
};

// ─── Shim para web (no-op) ────────────────────────────────────────────────────

class WebShim implements SQLiteDB {
  execSync(_sql: string): void {}
  runSync(_sql: string, _params?: any[]): void {}
  getFirstSync<T>(_sql: string, _params?: any[]): T | null { return null; }
  getAllSync<T>(_sql: string, _params?: any[]): T[] { return []; }
  withTransactionSync(task: () => void): void { task(); }
}

// ─── Instancia singleton ──────────────────────────────────────────────────────

let _db: SQLiteDB | null = null;

export function getDb(): SQLiteDB {
  if (_db) return _db;

  if (Platform.OS === 'web') {
    _db = new WebShim();
    return _db;
  }

  // Solo importar expo-sqlite en Android/iOS
  const SQLite = require('expo-sqlite');
  _db = SQLite.openDatabaseSync('gemlish.db') as SQLiteDB;
  return _db;
}

// ─── Inicialización y migraciones ─────────────────────────────────────────────

export function initDatabase(): void {
  if (Platform.OS === 'web') return;

  const db = getDb();

  // Crear tabla de metadatos si no existe (siempre la primera operación)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS db_meta (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Leer versión actual
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM db_meta WHERE key = 'version'`
  );
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  // Ejecutar migraciones pendientes en orden
  runMigrations(db, currentVersion);
}

function runMigrations(db: SQLiteDB, fromVersion: number): void {
  let version = fromVersion;

  // Cada case aplica la migración correspondiente y avanza la versión
  // NUNCA elimines un case — solo agrega nuevos al final
  while (version < DB_VERSION) {
    version++;
    switch (version) {
      case 1:
        // Esquema inicial: usuarios, sesión, estados del juego
        db.execSync(`
          CREATE TABLE IF NOT EXISTS users (
            username     TEXT PRIMARY KEY NOT NULL,
            password_hash TEXT NOT NULL,
            created_at   TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS session (
            id           INTEGER PRIMARY KEY CHECK (id = 1),
            username     TEXT NOT NULL,
            username_bk  TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS game_state (
            username TEXT PRIMARY KEY NOT NULL,
            data     TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS daily_state (
            username TEXT PRIMARY KEY NOT NULL,
            data     TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS minigame_state (
            username TEXT PRIMARY KEY NOT NULL,
            data     TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );

          -- Índices para optimizar búsquedas por usuario
          CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
          CREATE INDEX IF NOT EXISTS idx_game_state_username ON game_state(username);
          CREATE INDEX IF NOT EXISTS idx_daily_state_username ON daily_state(username);
          CREATE INDEX IF NOT EXISTS idx_minigame_state_username ON minigame_state(username);
          CREATE INDEX IF NOT EXISTS idx_session_id ON session(id);
          CREATE INDEX IF NOT EXISTS idx_db_meta_key ON db_meta(key);
        `);
        break;

      // ── EJEMPLO DE MIGRACIÓN FUTURA (no borrar, usar como plantilla) ──────
      // case 2:
      //   // Agregar columna de avatar al perfil de usuario
      //   db.execSync(`
      //     ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '🧑';
      //   `);
      //   break;
      //
      // case 3:
      //   // Agregar tabla de logros desbloqueados
      //   db.execSync(`
      //     CREATE TABLE IF NOT EXISTS achievements (
      //       username     TEXT NOT NULL,
      //       achievement_id TEXT NOT NULL,
      //       unlocked_at  TEXT NOT NULL,
      //       PRIMARY KEY (username, achievement_id)
      //     );
      //   `);
      //   break;
    }
  }

  // Guardar la nueva versión
  db.runSync(
    `INSERT OR REPLACE INTO db_meta (key, value) VALUES ('version', ?)`,
    [String(DB_VERSION)]
  );
}
