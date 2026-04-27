/**
 * sound-settings — Gestión de la preferencia de sonidos de Gemlish
 * Persiste si el usuario quiere efectos de sonido activados o no
 */
import { useState, useEffect, useCallback } from 'react';
import { kvGet, kvSet } from './local-kv';

const SOUND_ENABLED_KEY = '@gemlish_sound_enabled';

// Estado global en memoria para que todos los hooks compartan el mismo valor
let _soundEnabled = true;
const _listeners: Array<(v: boolean) => void> = [];

function notifyListeners(v: boolean) {
  _listeners.forEach(fn => fn(v));
}

// Inicializar desde KV en cuanto el módulo se importa.
// Así isSoundEnabled() devuelve el valor correcto en cuanto
// el storage responde (típicamente < 5 ms) y se elimina la
// ventana de race condition que existía si el hook se montaba
// antes de que terminara la carga asíncrona.
kvGet(SOUND_ENABLED_KEY).then(val => {
  const enabled = val !== 'false'; // default: true
  _soundEnabled = enabled;
  notifyListeners(enabled);
}).catch(() => {
  // Si falla la lectura, mantener el default (true)
});

export function useSoundSettings() {
  const [soundEnabled, setSoundEnabledState] = useState(_soundEnabled);

  useEffect(() => {
    // Suscribirse a cambios globales. Si KV ya terminó de cargar cuando
    // se monta el hook, el useState ya tendrá el valor correcto gracias a
    // la carga a nivel de módulo. Si aún no terminó, recibiremos la
    // notificación en cuanto lo haga.
    _listeners.push(setSoundEnabledState);
    return () => {
      const idx = _listeners.indexOf(setSoundEnabledState);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }, []);

  const setSoundEnabled = useCallback((value: boolean) => {
    _soundEnabled = value;
    notifyListeners(value);
    kvSet(SOUND_ENABLED_KEY, String(value)).catch(() => {});
  }, []);

  return { soundEnabled, setSoundEnabled };
}

/** Función utilitaria para leer el estado de sonido fuera de un componente React */
export function isSoundEnabled(): boolean {
  return _soundEnabled;
}
