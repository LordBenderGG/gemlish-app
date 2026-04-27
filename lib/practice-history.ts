import { kvGetJson, kvSetJson } from './local-kv';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface PracticeSession {
  id: string;           // timestamp ISO
  date: string;         // YYYY-MM-DD
  wordsCount: number;   // palabras practicadas
  correct: number;      // respuestas correctas
  total: number;        // respuestas totales
  durationMs: number;   // duración en ms
}

// ─── Clave de almacenamiento ─────────────────────────────────────────────────

const KEY = (username: string) => `gemlish_practice_history_${username}`;
const MAX_SESSIONS = 500; // Guardar solo las últimas 500 sesiones
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 días en milisegundos

// ─── Funciones ───────────────────────────────────────────────────────────────

export async function getPracticeHistory(username: string): Promise<PracticeSession[]> {
  return kvGetJson<PracticeSession[]>(KEY(username), []);
}

// ─── Función de limpieza ─────────────────────────────────────────────────────

async function prunePracticeHistory(username: string): Promise<void> {
  const history = await getPracticeHistory(username);
  const now = Date.now();

  // Filtrar: mantener solo sesiones dentro de los últimos 90 días
  const filtered = history.filter(session => {
    const sessionTime = new Date(session.id).getTime();
    return now - sessionTime <= MAX_AGE_MS;
  });

  // Si hay más de MAX_SESSIONS, mantener solo los últimos MAX_SESSIONS
  const pruned = filtered.slice(0, MAX_SESSIONS);

  // Solo guardar si cambió algo
  if (pruned.length !== history.length) {
    await kvSetJson(KEY(username), pruned);
  }
}

export async function savePracticeSession(
  username: string,
  session: Omit<PracticeSession, 'id' | 'date'>,
): Promise<PracticeSession> {
  const now = new Date();
  const newSession: PracticeSession = {
    id: now.toISOString(),
    date: now.toISOString().split('T')[0],
    ...session,
  };

  const history = await getPracticeHistory(username);
  // Insertar al principio (más reciente primero) y limitar
  const updated = [newSession, ...history].slice(0, MAX_SESSIONS);
  await kvSetJson(KEY(username), updated);

  // Ejecutar limpieza en background (no bloquear el guardado)
  prunePracticeHistory(username).catch(err =>
    console.warn('[practice-history] pruning failed:', err)
  );

  return newSession;
}

// ─── Helpers de formato ──────────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function formatSessionDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  // Validar formato YYYY-MM-DD antes de procesar para evitar NaN
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [, month, day] = parts;
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  if (isNaN(monthNum) || isNaN(dayNum) || monthNum < 1 || monthNum > 12) return dateStr;
  // Formato: "11 mar"
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${dayNum} ${months[monthNum - 1]}`;
}
