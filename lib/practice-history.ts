import AsyncStorage from '@react-native-async-storage/async-storage';

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
const MAX_SESSIONS = 20; // Guardar solo las últimas 20 sesiones

// ─── Funciones ───────────────────────────────────────────────────────────────

export async function getPracticeHistory(username: string): Promise<PracticeSession[]> {
  const raw = await AsyncStorage.getItem(KEY(username));
  if (!raw) return [];
  return JSON.parse(raw) as PracticeSession[];
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
  await AsyncStorage.setItem(KEY(username), JSON.stringify(updated));
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
  // Formato: "11 mar"
  const [, month, day] = dateStr.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
}
