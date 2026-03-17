/**
 * lib/database.web.ts
 *
 * Fallback para web (preview en navegador).
 * En Android/iOS se usa lib/database.ts con SQLite nativo.
 * En web se usa un shim que simula la API sincrónica de SQLite
 * usando un objeto en memoria (no persiste entre recargas, solo para preview).
 *
 * IMPORTANTE: Este archivo NO se incluye en el APK de Android/iOS.
 * Solo afecta al preview web del sandbox de desarrollo.
 */

// Shim mínimo de SQLiteDatabase para que el código compile en web
class WebSQLiteShim {
  private tables: Record<string, Record<string, any>[]> = {};

  execSync(_sql: string): void {
    // No-op en web
  }

  runSync(_sql: string, _params?: any[]): void {
    // No-op en web
  }

  getFirstSync<T>(_sql: string, _params?: any[]): T | null {
    return null;
  }

  getAllSync<T>(_sql: string, _params?: any[]): T[] {
    return [];
  }
}

let _db: WebSQLiteShim | null = null;

export function getDb(): any {
  if (!_db) {
    _db = new WebSQLiteShim();
  }
  return _db;
}

export function initDatabase(): void {
  // No-op en web — la app es 100% para Android/iOS
}
